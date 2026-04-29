import { useEffect, useRef, useCallback, useState } from "react";
import { notification } from "antd";

// Hành vi → lock ngay lập tức
export type LockViolationType = "TAB_SWITCH" | "DEV_TOOLS" | "SCREENSHOT" | "WINDOW_BLUR" | "AUTOMATION";

// Hành vi → cảnh báo, lock sau khi vượt ngưỡng
export type WarnViolationType = "COPY_PASTE";

export type ViolationType = LockViolationType | WarnViolationType;

// Phân loại chi tiết hành động clipboard để ghi log rõ ràng
export type ClipboardAction = "COPY" | "PASTE" | "CUT";

const CLIPBOARD_ACTION_LABELS: Record<ClipboardAction, string> = {
  COPY: "sao chép (Ctrl+C)",
  PASTE: "dán (Ctrl+V)",
  CUT: "cắt (Ctrl+X)",
};

interface UseExamGuardOptions {
  /** Bài đã kết thúc → tắt toàn bộ guard */
  active: boolean;
  /** Callback khi cần lock ngay (vi phạm nghiêm trọng) */
  onLock: (type: LockViolationType, message?: string) => void;
  /**
   * Callback khi COPY_PASTE vượt ngưỡng cảnh báo → lock với message đầy đủ.
   * Tách riêng để caller có thể ghi log server với type COPY_PASTE thay vì TAB_SWITCH.
   */
  onCopyPasteLock: (message: string) => void;
}

const MAX_COPY_PASTE_WARNS = 3;

// ── Automation detection ───────────────────────────────────────────────────────
//
// Kiểm tra nhiều tín hiệu để phát hiện trình duyệt bị điều khiển tự động
// (Selenium, Puppeteer, Playwright, CDP, v.v.)
// Trả về danh sách các dấu hiệu phát hiện được (rỗng = không phát hiện).

interface AutomationSignal {
  key: string;
  description: string;
}

function detectAutomationSignals(): AutomationSignal[] {
  const signals: AutomationSignal[] = [];
  const nav = navigator as any;
  const win = window as any;

  // ── 1. navigator.webdriver ─────────────────────────────────────────────────
  // Cờ chuẩn W3C WebDriver — Selenium/Puppeteer/Playwright đều set true.
  // Một số tool cố xóa cờ này nhưng để lại dấu vết khác.
  if (nav.webdriver === true) {
    signals.push({ key: "webdriver", description: "navigator.webdriver = true" });
  }

  // ── 2. Chrome DevTools Protocol (CDP) properties ──────────────────────────
  // Puppeteer/Playwright dùng CDP và để lại các property này trên window.
  const cdpProps = [
    "__puppeteer_evaluation_script__",
    "__playwright_target__",
    "__playwright_world_name__",
    "__playwright_clock__",
    "__pw_manual_",
    "_cdc_asdjflasutopfhvcZLmcfl_",   // Chrome DevTools legacy
    "_selenium_ide_recorder",
    "callSelenium",
    "callPhantom",
    "_phantom",
    "__nightmare",
    "domAutomation",
    "domAutomationController",
  ];
  for (const prop of cdpProps) {
    if (prop in win || prop in document) {
      signals.push({ key: "cdp_prop", description: `Phát hiện property tự động hóa: ${prop}` });
      break; // Chỉ cần 1 là đủ
    }
  }

  // ── 3. navigator properties bất thường ────────────────────────────────────
  // Headless Chrome không có plugins, languages rỗng, v.v.
  if (nav.plugins !== undefined && nav.plugins.length === 0) {
    // Trình duyệt thật thường có ít nhất 1 plugin (PDF viewer, v.v.)
    // Headless Chrome thường có 0 plugins
    signals.push({ key: "no_plugins", description: "navigator.plugins rỗng (có thể là headless browser)" });
  }

  if (nav.languages !== undefined && nav.languages.length === 0) {
    signals.push({ key: "no_languages", description: "navigator.languages rỗng" });
  }

  // ── 4. Selenium WebDriver objects ─────────────────────────────────────────
  const seleniumProps = [
    "webdriver",           // document.$webdriver
    "$chrome_asyncScriptInfo",
    "$cdc_asdjflasutopfhvcZLmcfl_",
  ];
  for (const prop of seleniumProps) {
    if ((document as any)[prop] !== undefined) {
      signals.push({ key: "selenium_doc", description: `Phát hiện Selenium property trên document: ${prop}` });
      break;
    }
  }

  // ── 5. window.outerWidth / outerHeight = 0 ────────────────────────────────
  // Headless browser thường có outerWidth/outerHeight = 0
  if (win.outerWidth === 0 && win.outerHeight === 0) {
    signals.push({ key: "zero_dimensions", description: "outerWidth/outerHeight = 0 (headless browser)" });
  }

  // ── 6. Permissions API bất thường ─────────────────────────────────────────
  // Headless Chrome trả về "denied" cho notification mà không hỏi user
  // (kiểm tra async, chỉ dùng làm tín hiệu phụ — không block ở đây)

  return signals;
}

export function useExamGuard({ active, onLock, onCopyPasteLock }: UseExamGuardOptions) {
  const warnCountRef = useRef(0);
  const lockedRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Delay nhỏ để tránh false positive khi click vào element trong trang
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BLUR_GRACE_MS = 300;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const triggerLock = useCallback(
    (type: LockViolationType, message?: string) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      onLock(type, message);
    },
    [onLock],
  );

  /**
   * Gọi khi phát hiện hành vi clipboard.
   * - action: loại hành động cụ thể (COPY / PASTE / CUT)
   * - source: "keyboard" | "clipboard-event" để phân biệt nguồn
   */
  const triggerCopyPasteWarn = useCallback(
    (action: ClipboardAction, source: "keyboard" | "clipboard-event") => {
      if (lockedRef.current) return;

      const count = warnCountRef.current + 1;
      warnCountRef.current = count;
      const remaining = MAX_COPY_PASTE_WARNS - count;
      const actionLabel = CLIPBOARD_ACTION_LABELS[action];

      if (remaining > 0) {
        notification.warning({
          key: `violation-copy-paste-${count}`,
          message: `Cảnh báo ${count}/${MAX_COPY_PASTE_WARNS} — Không được ${actionLabel}`,
          description: `Hành vi ${actionLabel} không được phép trong khi thi. Còn ${remaining} lần cảnh báo trước khi bài thi bị khóa.`,
          duration: 5,
          placement: "topRight",
        });
      } else {
        // Vượt ngưỡng → lock
        const lockMessage = `Bài thi bị khóa do thực hiện ${actionLabel} quá ${MAX_COPY_PASTE_WARNS} lần (nguồn: ${source === "keyboard" ? "phím tắt" : "clipboard"}).`;
        notification.error({
          key: "violation-copy-paste-locked",
          message: "Bài thi bị khóa",
          description: `Bạn đã thực hiện ${actionLabel} quá ${MAX_COPY_PASTE_WARNS} lần. Bài thi đã bị khóa.`,
          duration: 0,
          placement: "topRight",
        });
        lockedRef.current = true;
        onCopyPasteLock(lockMessage);
      }
    },
    [onCopyPasteLock],
  );

  // ── Fullscreen helpers (expose ra ngoài) ───────────────────────────────────

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // ── 1. Fullscreen state tracking ───────────────────────────────────────────
  useEffect(() => {
    const onFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);

      if (!inFullscreen && active && !lockedRef.current) {
        notification.warning({
          key: "fullscreen-exit",
          message: "Cảnh báo",
          description: "Bạn đã thoát khỏi chế độ toàn màn hình. Nhấn nút 'Toàn màn hình' để quay lại.",
          duration: 6,
          placement: "topRight",
        });
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [active]);

  // Tự động vào fullscreen khi guard active lần đầu
  useEffect(() => {
    if (!active) return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [active]);

  // ── 2. Tab switch (visibilitychange) ──────────────────────────────────────
  // Bắt: chuyển tab, thu nhỏ trình duyệt, Ctrl+Tab
  // KHÔNG bắt reload — dùng sessionStorage để phân biệt
  useEffect(() => {
    if (!active) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Đánh dấu "đang hidden" vào sessionStorage
        // Nếu là reload, trang mới sẽ xóa flag này ngay khi mount
        sessionStorage.setItem("exam_tab_hidden", "1");

        // Delay nhỏ: nếu là reload thì trang sẽ unload ngay,
        // nếu là chuyển tab thì sau delay vẫn còn flag → lock
        setTimeout(() => {
          if (sessionStorage.getItem("exam_tab_hidden") === "1") {
            triggerLock("TAB_SWITCH");
          }
        }, 200);
      } else {
        // Tab visible lại → xóa flag
        sessionStorage.removeItem("exam_tab_hidden");
      }
    };

    // Xóa flag khi trang load (phân biệt reload vs tab switch)
    sessionStorage.removeItem("exam_tab_hidden");

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [active, triggerLock]);

  // ── 3. Window blur (Alt+Tab, thoát trình duyệt) ───────────────────────────
  useEffect(() => {
    if (!active) return;

    let guardReady = false;
    const readyTimer = setTimeout(() => { guardReady = true; }, 1000);

    const onBlur = () => {
      if (!guardReady) return;
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);

      blurTimerRef.current = setTimeout(() => {
        // Nếu visibilitychange đã xử lý (tab switch) thì bỏ qua
        // Nếu document vẫn visible nhưng window mất focus → Alt+Tab sang app khác
        if (
          !document.hasFocus() &&
          document.visibilityState === "visible" &&
          !lockedRef.current
        ) {
          triggerLock("WINDOW_BLUR");
        }
      }, BLUR_GRACE_MS);
    };

    const onFocus = () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [active, triggerLock]);

  // ── 4. Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+C / Ctrl+V / Ctrl+X → cảnh báo với action cụ thể
      if (ctrl && e.key.toLowerCase() === "c") {
        e.preventDefault();
        triggerCopyPasteWarn("COPY", "keyboard");
        return;
      }
      if (ctrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        triggerCopyPasteWarn("PASTE", "keyboard");
        return;
      }
      if (ctrl && e.key.toLowerCase() === "x") {
        e.preventDefault();
        triggerCopyPasteWarn("CUT", "keyboard");
        return;
      }

      // Ctrl+A, Ctrl+S, Ctrl+U → block im lặng
      if (ctrl && ["a", "s", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }

      // PrintScreen → lock ngay
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerLock("SCREENSHOT");
        return;
      }

      // F12 → lock ngay
      if (e.key === "F12") {
        e.preventDefault();
        triggerLock("DEV_TOOLS");
        return;
      }

      // Ctrl+Shift+I / J / C → lock ngay
      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerLock("DEV_TOOLS");
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, triggerLock, triggerCopyPasteWarn]);

  // ── 5. Right-click block ───────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, [active]);

  // ── 6. Clipboard events block ──────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); triggerCopyPasteWarn("COPY", "clipboard-event"); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); triggerCopyPasteWarn("PASTE", "clipboard-event"); };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); triggerCopyPasteWarn("CUT", "clipboard-event"); };

    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
    };
  }, [active, triggerCopyPasteWarn]);

  // ── 7. Automation / headless browser detection ────────────────────────────
  // Chạy ngay khi guard active và lặp lại định kỳ để bắt các tool inject sau.
  // Dùng interval ngắn lần đầu (kiểm tra ngay), sau đó giãn ra để tiết kiệm CPU.
  useEffect(() => {
    if (!active) return;

    const check = () => {
      if (lockedRef.current) return;

      const signals = detectAutomationSignals();
      if (signals.length === 0) return;

      // Tổng hợp tất cả dấu hiệu vào message để ghi log rõ ràng
      const signalList = signals.map((s) => s.description).join("; ");
      const lockMessage = `Phát hiện công cụ tự động hóa trong khi thi. Dấu hiệu: ${signalList}.`;

      notification.error({
        key: "violation-automation",
        message: "Bài thi bị khóa",
        description: "Phát hiện trình duyệt đang bị điều khiển tự động. Bài thi đã bị khóa.",
        duration: 0,
        placement: "topRight",
      });

      triggerLock("AUTOMATION", lockMessage);
    };

    // Kiểm tra ngay lập tức khi guard bật
    check();

    // Kiểm tra lại sau 2s (để bắt các tool inject muộn như Puppeteer stealth)
    const earlyTimer = setTimeout(check, 2000);

    // Sau đó kiểm tra định kỳ mỗi 15s
    const intervalId = setInterval(check, 15_000);

    return () => {
      clearTimeout(earlyTimer);
      clearInterval(intervalId);
    };
  }, [active, triggerLock]);

  return { isFullscreen, enterFullscreen, exitFullscreen };
}
