import { useEffect, useRef, useCallback, useState } from "react";
import { notification } from "antd";
import { logViolationApi, resolveViolationApi } from "../../../../api/attemptApi";

// ── Violation type classification ──────────────────────────────────────────────

/** Lock ngay lập tức, không có grace period */
export type ImmediateLockViolationType = "DEV_TOOLS" | "SCREENSHOT" | "AUTOMATION";

/** Áp dụng grace period — lock sau khi hết thời gian ân hạn */
export type GraceViolationType = "WINDOW_BLUR" | "TAB_SWITCH";

/** Cảnh báo đếm số lần, lock khi vượt ngưỡng */
export type WarnViolationType = "COPY_PASTE";

/** Tất cả loại vi phạm */
export type ViolationType = ImmediateLockViolationType | GraceViolationType | WarnViolationType;

/**
 * @deprecated Dùng ImmediateLockViolationType | GraceViolationType thay thế.
 * Giữ lại để tương thích ngược với useExamTaking.
 */
export type LockViolationType = ImmediateLockViolationType | GraceViolationType;

// Phân loại chi tiết hành động clipboard để ghi log rõ ràng
export type ClipboardAction = "COPY" | "PASTE" | "CUT";

// ── Violation config ───────────────────────────────────────────────────────────

type ViolationBehavior =
  | { kind: "immediate" }
  | { kind: "grace"; defaultMs: number }
  | { kind: "warn"; maxWarns: number };

/**
 * Bảng cấu hình tập trung — định nghĩa hành vi xử lý cho từng loại vi phạm.
 * Thêm loại vi phạm mới vào đây là đủ, không cần sửa logic event handler.
 */
const VIOLATION_CONFIG: Readonly<Record<ViolationType, ViolationBehavior>> = {
  // Immediate lock
  DEV_TOOLS:   { kind: "immediate" },
  SCREENSHOT:  { kind: "immediate" },
  AUTOMATION:  { kind: "immediate" },
  // Grace period
  WINDOW_BLUR: { kind: "grace", defaultMs: 5000 },
  TAB_SWITCH:  { kind: "grace", defaultMs: 3000 },
  // Warn + count
  COPY_PASTE:  { kind: "warn", maxWarns: 3 },
} as const;

// ── Grace state ────────────────────────────────────────────────────────────────

interface GraceState {
  type: GraceViolationType;
  startedAt: number;
  timeoutId: ReturnType<typeof setTimeout>;
  countdownId: ReturnType<typeof setInterval>;
  /** violationId trả về từ server để resolve sau */
  violationId: number | null;
}

// ── Clipboard labels ───────────────────────────────────────────────────────────

const CLIPBOARD_ACTION_LABELS: Record<ClipboardAction, string> = {
  COPY: "sao chép (Ctrl+C)",
  PASTE: "dán (Ctrl+V)",
  CUT: "cắt (Ctrl+X)",
};

// ── Automation detection ───────────────────────────────────────────────────────

interface AutomationSignal {
  key: string;
  description: string;
}

function detectAutomationSignals(): AutomationSignal[] {
  const signals: AutomationSignal[] = [];
  const nav = navigator as any;
  const win = window as any;

  if (nav.webdriver === true) {
    signals.push({ key: "webdriver", description: "navigator.webdriver = true" });
  }

  const cdpProps = [
    "__puppeteer_evaluation_script__",
    "__playwright_target__",
    "__playwright_world_name__",
    "__playwright_clock__",
    "__pw_manual_",
    "_cdc_asdjflasutopfhvcZLmcfl_",
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
      break;
    }
  }

  if (nav.plugins !== undefined && nav.plugins.length === 0) {
    signals.push({ key: "no_plugins", description: "navigator.plugins rỗng (có thể là headless browser)" });
  }

  if (nav.languages !== undefined && nav.languages.length === 0) {
    signals.push({ key: "no_languages", description: "navigator.languages rỗng" });
  }

  const seleniumProps = ["webdriver", "$chrome_asyncScriptInfo", "$cdc_asdjflasutopfhvcZLmcfl_"];
  for (const prop of seleniumProps) {
    if ((document as any)[prop] !== undefined) {
      signals.push({ key: "selenium_doc", description: `Phát hiện Selenium property trên document: ${prop}` });
      break;
    }
  }

  if (win.outerWidth === 0 && win.outerHeight === 0) {
    signals.push({ key: "zero_dimensions", description: "outerWidth/outerHeight = 0 (headless browser)" });
  }

  return signals;
}

// ── Hook options ───────────────────────────────────────────────────────────────

interface UseExamGuardOptions {
  /** Bài đã kết thúc → tắt toàn bộ guard */
  active: boolean;
  /** attemptId để ghi log vi phạm lên server */
  attemptId: number | null;
  /** Callback khi cần lock ngay (vi phạm nghiêm trọng hoặc hết grace period) */
  onLock: (type: LockViolationType, message?: string) => void;
  /**
   * Callback khi COPY_PASTE vượt ngưỡng cảnh báo → lock với message đầy đủ.
   */
  onCopyPasteLock: (message: string) => void;
  /**
   * Cấu hình grace period tùy chỉnh (ms) theo loại vi phạm.
   * Ưu tiên hơn giá trị mặc định trong VIOLATION_CONFIG.
   */
  gracePeriodConfig?: Partial<Record<GraceViolationType, number>>;
}

const MAX_COPY_PASTE_WARNS = (VIOLATION_CONFIG.COPY_PASTE as { kind: "warn"; maxWarns: number }).maxWarns;

// ── Notification keys ──────────────────────────────────────────────────────────

const GRACE_NOTIF_KEY = (type: GraceViolationType) => `grace-period-${type}`;

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useExamGuard({
  active,
  attemptId,
  onLock,
  onCopyPasteLock,
  gracePeriodConfig,
}: UseExamGuardOptions) {
  const warnCountRef = useRef(0);
  const lockedRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Map: GraceViolationType → GraceState đang chạy
  const graceStatesRef = useRef<Map<GraceViolationType, GraceState>>(new Map());

  // Delay nhỏ để tránh false positive khi click vào element trong trang
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BLUR_GRACE_MS = 300;

  // ── Grace period helpers ───────────────────────────────────────────────────

  /** Lấy grace period ms cho một loại vi phạm (ưu tiên config prop) */
  const getGracePeriodMs = useCallback(
    (type: GraceViolationType): number => {
      if (gracePeriodConfig?.[type] !== undefined) return gracePeriodConfig[type]!;
      const cfg = VIOLATION_CONFIG[type];
      return cfg.kind === "grace" ? cfg.defaultMs : 0;
    },
    [gracePeriodConfig],
  );

  /** Hủy grace period đang chạy cho một loại vi phạm */
  const cancelGrace = useCallback((type: GraceViolationType) => {
    const state = graceStatesRef.current.get(type);
    if (!state) return;
    clearTimeout(state.timeoutId);
    clearInterval(state.countdownId);
    notification.destroy(GRACE_NOTIF_KEY(type));
    graceStatesRef.current.delete(type);
  }, []);

  /** Hủy tất cả grace period đang chạy */
  const cancelAllGrace = useCallback(() => {
    for (const type of graceStatesRef.current.keys()) {
      cancelGrace(type);
    }
  }, [cancelGrace]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const triggerLock = useCallback(
    (type: LockViolationType, message?: string) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      cancelAllGrace();
      onLock(type, message);
    },
    [onLock, cancelAllGrace],
  );

  /**
   * Ghi log vi phạm lên server (fire-and-forget, không block luồng xử lý).
   * Trả về violationId hoặc null nếu thất bại.
   */
  const logViolation = useCallback(
    async (
      type: ViolationType,
      message: string,
      metadata?: Record<string, unknown>,
    ): Promise<number | null> => {
      if (!attemptId) return null;
      try {
        const result = await logViolationApi(attemptId, type, message, metadata);
        return result.violationId;
      } catch {
        // Lỗi mạng → không block luồng xử lý vi phạm
        return null;
      }
    },
    [attemptId],
  );

  /**
   * Bắt đầu grace period cho một loại vi phạm.
   * Hiển thị countdown notification, ghi log lên server.
   */
  const startGracePeriod = useCallback(
    (type: GraceViolationType, message: string) => {
      if (lockedRef.current) return;

      // Bỏ qua nếu grace period của cùng loại đang chạy (Req 2.5)
      if (graceStatesRef.current.has(type)) return;

      const gracePeriodMs = getGracePeriodMs(type);
      const graceSecs = Math.ceil(gracePeriodMs / 1000);
      const notifKey = GRACE_NOTIF_KEY(type);

      // Ghi log lên server ngay lập tức (Req 3.1) — fire-and-forget
      // metadata.resolved = false mặc định (Req 7.5)
      logViolation(type, message, {
        gracePeriodMs,
        resolved: false,
      }).then((violationId) => {
        // Cập nhật violationId vào state sau khi server trả về
        const state = graceStatesRef.current.get(type);
        if (state) state.violationId = violationId;
      });

      // Hiển thị countdown notification (Req 6.1)
      let remaining = graceSecs;

      const showNotif = (secs: number) => {
        const isUrgent = secs <= 2;
        const method = isUrgent ? notification.error : notification.warning;
        method({
          key: notifKey,
          message: isUrgent ? "⚠️ Sắp bị khóa bài thi!" : "Cảnh báo — Rời khỏi trang thi",
          description: `Bạn đã rời khỏi trang thi. Quay lại trong ${secs} giây hoặc bài thi sẽ bị khóa.`,
          duration: 0,
          placement: "topRight",
        });
      };

      showNotif(remaining);

      // Cập nhật countdown mỗi giây (Req 6.1)
      const countdownId = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          showNotif(remaining);
        }
      }, 1000);

      // Timeout → lock bài thi (Req 2.4)
      const timeoutId = setTimeout(() => {
        clearInterval(countdownId);
        notification.destroy(notifKey);
        graceStatesRef.current.delete(type);

        if (!lockedRef.current) {
          triggerLock(type, message);
        }
      }, gracePeriodMs);

      graceStatesRef.current.set(type, {
        type,
        startedAt: Date.now(),
        timeoutId,
        countdownId,
        violationId: null,
      });
    },
    [getGracePeriodMs, logViolation, triggerLock],
  );

  /**
   * Xử lý khi thí sinh quay lại trang trong grace period.
   * Hủy countdown, resolve violation trên server, hiển thị thông báo xác nhận.
   */
  const handleReturnDuringGrace = useCallback(() => {
    if (graceStatesRef.current.size === 0) return;

    for (const [type, state] of graceStatesRef.current.entries()) {
      cancelGrace(type);

      // Resolve violation trên server (Req 3.3) — fire-and-forget
      if (state.violationId && attemptId) {
        resolveViolationApi(attemptId, state.violationId).catch(() => {});
      }
    }

    // Hiển thị thông báo xác nhận (Req 6.3)
    notification.success({
      key: "grace-resolved",
      message: "Đã quay lại — bài thi tiếp tục bình thường",
      duration: 3,
      placement: "topRight",
    });
  }, [cancelGrace, attemptId]);

  /**
   * Gọi khi phát hiện hành vi clipboard.
   */
  const triggerCopyPasteWarn = useCallback(
    (action: ClipboardAction, source: "keyboard" | "clipboard-event") => {
      if (lockedRef.current) return;

      const count = warnCountRef.current + 1;
      warnCountRef.current = count;
      const remaining = MAX_COPY_PASTE_WARNS - count;
      const actionLabel = CLIPBOARD_ACTION_LABELS[action];
      const willLock = remaining <= 0;

      // Ghi log lên server ngay lập tức (Req 4.1, 4.4) — trước khi hiển thị notification
      logViolation("COPY_PASTE", `Hành vi ${actionLabel} trong khi thi.`, {
        action,
        source,
        warnCount: count,
        willLock,
      });

      if (!willLock) {
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
        cancelAllGrace();
        onCopyPasteLock(lockMessage);
      }
    },
    [logViolation, cancelAllGrace, onCopyPasteLock],
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
  useEffect(() => {
    if (!active) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sessionStorage.setItem("exam_tab_hidden", "1");

        setTimeout(() => {
          if (sessionStorage.getItem("exam_tab_hidden") === "1") {
            // Dùng grace period thay vì lock ngay (Req 1.3)
            startGracePeriod("TAB_SWITCH", "Rời khỏi trang thi (chuyển tab hoặc thu nhỏ trình duyệt).");
          }
        }, 200);
      } else {
        // Tab visible lại → xóa flag và xử lý quay lại (Req 2.3)
        sessionStorage.removeItem("exam_tab_hidden");
        handleReturnDuringGrace();
      }
    };

    sessionStorage.removeItem("exam_tab_hidden");

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [active, startGracePeriod, handleReturnDuringGrace]);

  // ── 3. Window blur (Alt+Tab, thoát trình duyệt) ───────────────────────────
  useEffect(() => {
    if (!active) return;

    let guardReady = false;
    const readyTimer = setTimeout(() => { guardReady = true; }, 1000);

    const onBlur = () => {
      if (!guardReady) return;
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);

      blurTimerRef.current = setTimeout(() => {
        if (
          !document.hasFocus() &&
          document.visibilityState === "visible" &&
          !lockedRef.current
        ) {
          // Dùng grace period thay vì lock ngay (Req 1.3)
          startGracePeriod("WINDOW_BLUR", "Chuyển sang ứng dụng khác trong khi thi (Alt+Tab).");
        }
      }, BLUR_GRACE_MS);
    };

    const onFocus = () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      // Focus lại → xử lý quay lại grace period (Req 2.3)
      handleReturnDuringGrace();
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [active, startGracePeriod, handleReturnDuringGrace]);

  // ── 4. Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

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

      if (ctrl && ["a", "s", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }

      if (e.key === "PrintScreen") {
        e.preventDefault();
        // Ghi log trước khi lock (Req 3.1)
        logViolation("SCREENSHOT", "Sử dụng phím chụp màn hình trong khi thi.", { source: "keyboard" });
        triggerLock("SCREENSHOT");
        return;
      }

      if (e.key === "F12") {
        e.preventDefault();
        logViolation("DEV_TOOLS", "Nhấn F12 mở DevTools trong khi thi.", { source: "F12" });
        triggerLock("DEV_TOOLS");
        return;
      }

      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logViolation("DEV_TOOLS", "Mở DevTools bằng phím tắt trong khi thi.", { source: "shortcut" });
        triggerLock("DEV_TOOLS");
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, triggerLock, triggerCopyPasteWarn, logViolation]);

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
  useEffect(() => {
    if (!active) return;

    const check = () => {
      if (lockedRef.current) return;

      const signals = detectAutomationSignals();
      if (signals.length === 0) return;

      const signalList = signals.map((s) => s.description).join("; ");
      const lockMessage = `Phát hiện công cụ tự động hóa trong khi thi. Dấu hiệu: ${signalList}.`;

      notification.error({
        key: "violation-automation",
        message: "Bài thi bị khóa",
        description: "Phát hiện trình duyệt đang bị điều khiển tự động. Bài thi đã bị khóa.",
        duration: 0,
        placement: "topRight",
      });

      // Ghi log trước khi lock (Req 3.1)
      logViolation("AUTOMATION", lockMessage, {
        signals: signals.map((s) => s.key),
      });
      triggerLock("AUTOMATION", lockMessage);
    };

    check();
    const earlyTimer = setTimeout(check, 2000);
    const intervalId = setInterval(check, 15_000);

    return () => {
      clearTimeout(earlyTimer);
      clearInterval(intervalId);
    };
  }, [active, triggerLock, logViolation]);

  // ── 8. Cleanup khi bài thi kết thúc (Req 2.6) ─────────────────────────────
  useEffect(() => {
    if (!active) {
      cancelAllGrace();
    }
  }, [active, cancelAllGrace]);

  return { isFullscreen, enterFullscreen, exitFullscreen };
}
