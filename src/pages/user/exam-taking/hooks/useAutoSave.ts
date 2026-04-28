import { useEffect, useRef } from "react";

interface UseAutoSaveOptions {
  /** attemptId để tạo key unique */
  attemptId: number | null;
  /** Answers hiện tại */
  answers: Record<number, number>;
  /** Chỉ save khi active = true */
  active: boolean;
  /** Interval auto-save (ms) */
  interval?: number;
  /** Callback khi save thành công (optional, để debug) */
  onSave?: () => void;
}

const AUTOSAVE_KEY_PREFIX = "exam_autosave_";

export function useAutoSave({
  attemptId,
  answers,
  active,
  interval = 5000,
  onSave,
}: UseAutoSaveOptions) {
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!attemptId) return;

    const key = `${AUTOSAVE_KEY_PREFIX}${attemptId}`;

    // Nếu không active → xóa localStorage và dừng
    if (!active) {
      try {
        localStorage.removeItem(key);
        lastSavedRef.current = "";
      } catch (err) {
        console.error("[AutoSave] Failed to clear on inactive:", err);
      }
      return;
    }

    const doSave = () => {
      const current = JSON.stringify(answers);
      // Chỉ save nếu có thay đổi
      if (current !== lastSavedRef.current) {
        try {
          localStorage.setItem(key, current);
          lastSavedRef.current = current;
          onSave?.();
        } catch (err) {
          console.error("[AutoSave] Failed to save:", err);
        }
      }
    };

    // Save ngay lần đầu
    doSave();

    // Sau đó save định kỳ
    saveTimerRef.current = setInterval(doSave, interval);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [attemptId, answers, active, interval, onSave]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Load answers từ localStorage khi mount
   */
  const loadSaved = (attemptId: number): Record<number, number> | null => {
    const key = `${AUTOSAVE_KEY_PREFIX}${attemptId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as Record<number, number>;
    } catch {
      return null;
    }
  };

  /**
   * Xóa autosave data (gọi sau khi submit hoặc có lỗi)
   */
  const clearSaved = (attemptId: number) => {
    const key = `${AUTOSAVE_KEY_PREFIX}${attemptId}`;
    try {
      localStorage.removeItem(key);
      lastSavedRef.current = "";
    } catch (err) {
      console.error("[AutoSave] Failed to clear:", err);
    }
  };

  return { loadSaved, clearSaved };
}
