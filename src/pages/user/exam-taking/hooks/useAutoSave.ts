import { useEffect, useRef } from "react";

const AUTOSAVE_KEY_PREFIX = "exam_autosave_";

// ── Utility functions (dùng được ngoài hook) ──────────────────────────────

export function getAutoSaveKey(attemptId: number) {
  return `${AUTOSAVE_KEY_PREFIX}${attemptId}`;
}

/** Đọc answers đã lưu từ localStorage — gọi trực tiếp, không cần hook */
export function loadSavedAnswers(attemptId: number): Record<number, number> | null {
  try {
    const raw = localStorage.getItem(getAutoSaveKey(attemptId));
    if (!raw) return null;
    return JSON.parse(raw) as Record<number, number>;
  } catch {
    return null;
  }
}

/** Xóa answers đã lưu — gọi trực tiếp, không cần hook */
export function clearSavedAnswers(attemptId: number) {
  try {
    localStorage.removeItem(getAutoSaveKey(attemptId));
  } catch (err) {
    console.error("[AutoSave] Failed to clear:", err);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────

interface UseAutoSaveOptions {
  attemptId: number | null;
  answers: Record<number, number>;
  /** Chỉ save khi active = true */
  active: boolean;
  interval?: number;
}

export function useAutoSave({ attemptId, answers, active, interval = 5000 }: UseAutoSaveOptions) {
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!attemptId || !active) return;

    const key = getAutoSaveKey(attemptId);

    const doSave = () => {
      const current = JSON.stringify(answers);
      if (current !== lastSavedRef.current) {
        try {
          localStorage.setItem(key, current);
          lastSavedRef.current = current;
        } catch (err) {
          console.error("[AutoSave] Failed to save:", err);
        }
      }
    };

    // Save ngay lần đầu khi active
    doSave();

    saveTimerRef.current = setInterval(doSave, interval);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      // KHÔNG xóa localStorage khi cleanup — data cần giữ lại khi reload
    };
  }, [attemptId, answers, active, interval]);
}
