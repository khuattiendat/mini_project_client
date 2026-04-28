import { useEffect, useRef, useCallback } from "react";
import { notification } from "antd";

interface UseExamGuardOptions {
  /** Bài đã kết thúc (nộp/lỗi) → tắt toàn bộ guard */
  active: boolean;
  /** Callback khi phát hiện vi phạm cần ghi log lên server */
  onViolation?: (type: string) => void;
}

export function useExamGuard({ active, onViolation }: UseExamGuardOptions) {
  const violationCountRef = useRef(0);
  const MAX_WARNINGS = 3;

  const warn = useCallback(
    (type: string, message: string) => {
      violationCountRef.current += 1;
      const remaining = MAX_WARNINGS - violationCountRef.current;

      notification.warning({
        key: `violation-${type}`,
        message: "Cảnh báo vi phạm",
        description:
          remaining > 0
            ? `${message} (Còn ${remaining} lần cảnh báo)`
            : `${message} — Đây là lần cuối cùng!`,
        duration: 5,
        placement: "topRight",
      });

      onViolation?.(type);
    },
    [onViolation],
  );

  // ── 1. Fullscreen ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const requestFullscreen = () => {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        el.requestFullscreen?.().catch(() => { });
      }
    };

    // Vào fullscreen ngay khi mount
    requestFullscreen();

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && active) {
        warn("FULLSCREEN_EXIT", "Bạn đã thoát khỏi chế độ toàn màn hình.");
        // Tự động yêu cầu lại fullscreen sau 1s
        setTimeout(requestFullscreen, 1000);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      // Thoát fullscreen khi bài kết thúc
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => { });
      }
    };
  }, [active, warn]);

  // ── 2. Visibility / Tab switch ─────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        warn("TAB_SWITCH", "Bạn đã chuyển tab hoặc rời khỏi trang thi.");
      }
    };

    const onBlur = () => {
      warn("WINDOW_BLUR", "Cửa sổ trình duyệt mất focus.");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [active, warn]);

  // ── 3. Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+S
      if (ctrl && ["c", "v", "x", "a", "s", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (["c", "v", "x"].includes(e.key.toLowerCase())) {
          warn("COPY_PASTE", "Sao chép / dán không được phép trong khi thi.");
        }
        return;
      }

      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        warn("SCREENSHOT", "Chụp màn hình không được phép trong khi thi.");
        return;
      }

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        warn("DEV_TOOLS", "Mở DevTools không được phép trong khi thi.");
        return;
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        warn("DEV_TOOLS", "Mở DevTools không được phép trong khi thi.");
        return;
      }

      // Ctrl+U (view source)
      if (ctrl && e.key.toLowerCase() === "u") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, warn]);

  // ── 4. Right-click context menu ────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, [active]);

  // ── 5. Clipboard API block ─────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const block = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
    };
  }, [active]);
}
