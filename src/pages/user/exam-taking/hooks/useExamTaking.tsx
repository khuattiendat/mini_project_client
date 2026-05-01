import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
  submitAttemptApi,
  getAttemptByExamApi,
  pingAttemptApi,
  lockAttemptApi,
} from "../../../../api/attemptApi";
import type { AttemptDetail, AnswerItem } from "../../../../types/attempt";
import { getApiErrorMessage } from "../../../../api/apiError";
import { useExamGuard, type LockViolationType } from "./useExamGuard";
import { useAutoSave, loadSavedAnswers, clearSavedAnswers } from "./useAutoSave";
import { useNetworkStatus } from "./useNetworkStatus";

export interface ExamResult {
  score: number;
  correct: number;
  total: number;
}

const PENDING_SUBMIT_KEY = "exam_pending_submit_";

export function useExamTaking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = Number(searchParams.get("examId"));

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingOfflineSubmit, setPendingOfflineSubmit] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const detailRef = useRef<AttemptDetail | null>(null);
  const answersRef = useRef<Record<number, number>>({});
  const submittingRef = useRef(false);
  const lockedRef = useRef(false); // guard: tránh lock nhiều lần

  const PING_INTERVAL_MS = 30_000;

  useEffect(() => { detailRef.current = detail; }, [detail]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // ── Guard callbacks ────────────────────────────────────────────────────────

  const onLock = useCallback((type: LockViolationType, message?: string) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    const attempt = detailRef.current?.attempt;
    if (!attempt) return;

    const deviceId = localStorage.getItem("deviceId") ?? "";
    const LOCK_MESSAGES: Record<LockViolationType, string> = {
      TAB_SWITCH: "Rời khỏi trang thi (chuyển tab hoặc thu nhỏ trình duyệt).",
      DEV_TOOLS: "Mở công cụ phát triển (DevTools) trong khi thi.",
      SCREENSHOT: "Sử dụng phím chụp màn hình trong khi thi.",
      WINDOW_BLUR: "Chuyển sang ứng dụng khác trong khi thi (Alt+Tab).",
      AUTOMATION: "Phát hiện công cụ tự động hóa trong khi thi.",
    };

    // Ưu tiên message chi tiết từ guard (có danh sách dấu hiệu), fallback về default
    const logMessage = message ?? LOCK_MESSAGES[type] ?? `Vi phạm: ${type}`;

    lockAttemptApi(attempt.id, deviceId, type, logMessage).catch(() => {});

    clearTimer();
    clearPing();
    clearSavedAnswers(attempt.id);

    const USER_MESSAGES: Record<LockViolationType, string> = {
      TAB_SWITCH: "Bài thi đã bị khóa do rời khỏi trang thi. Vui lòng liên hệ giám thị.",
      DEV_TOOLS: "Bài thi đã bị khóa do mở công cụ phát triển. Vui lòng liên hệ giám thị.",
      SCREENSHOT: "Bài thi đã bị khóa do chụp màn hình. Vui lòng liên hệ giám thị.",
      WINDOW_BLUR: "Bài thi đã bị khóa do chuyển sang ứng dụng khác. Vui lòng liên hệ giám thị.",
      AUTOMATION: "Bài thi đã bị khóa do phát hiện công cụ tự động hóa. Vui lòng liên hệ giám thị.",
    };
    setError(USER_MESSAGES[type] ?? "Bài thi đã bị khóa do vi phạm quy chế thi. Vui lòng liên hệ giám thị.");
  }, []);

  // Callback riêng cho COPY_PASTE vượt ngưỡng — ghi log đúng type lên server
  const onCopyPasteLock = useCallback((message: string) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    const attempt = detailRef.current?.attempt;
    if (!attempt) return;

    const deviceId = localStorage.getItem("deviceId") ?? "";

    lockAttemptApi(attempt.id, deviceId, "COPY_PASTE", message).catch(() => {});

    clearTimer();
    clearPing();
    clearSavedAnswers(attempt.id);
    setError("Bài thi đã bị khóa do thực hiện sao chép / dán quá nhiều lần. Vui lòng liên hệ giám thị.");
  }, []);

  const { isFullscreen, enterFullscreen } = useExamGuard({
    active: !!detail && !result && !error,
    attemptId: detail?.attempt.id ?? null,
    onLock,
    onCopyPasteLock,
  });

  // ── Auto-save (chỉ active khi đang làm bài) ───────────────────────────────
  useAutoSave({
    attemptId: detail?.attempt.id ?? null,
    answers,
    active: !!detail && !result && !error,
  });

  const { online } = useNetworkStatus();

  // ── Retry pending submit khi có mạng lại ──────────────────────────────────
  useEffect(() => {
    if (!online || !pendingOfflineSubmit || !detailRef.current) return;
    const attempt = detailRef.current;
    setPendingOfflineSubmit(false);
    submitAnswers(attempt, answersRef.current, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, pendingOfflineSubmit]);

  // ── Kiểm tra pending submit khi mount ─────────────────────────────────────
  useEffect(() => {
    if (!detail) return;
    const pendingKey = `${PENDING_SUBMIT_KEY}${detail.attempt.id}`;
    if (localStorage.getItem(pendingKey)) {
      setPendingOfflineSubmit(true);
    }
  }, [detail]);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!examId) {
      setError("Không tìm thấy đề thi.");
      setLoading(false);
      return;
    }

    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }

    const init = async () => {
      try {
        const detail = await getAttemptByExamApi(examId, deviceId!);

        const totalSeconds = detail.exam.duration * 60;
        const elapsed = detail.attempt.startedAt
          ? Math.floor((Date.now() - new Date(detail.attempt.startedAt).getTime()) / 1000)
          : 0;
        const remaining = Math.max(totalSeconds - elapsed, 0);

        // Restore answers từ localStorage TRƯỚC khi set detail
        // để tránh race condition với useExamGuard
        const saved = loadSavedAnswers(detail.attempt.id);
        if (saved && Object.keys(saved).length > 0) {
          setAnswers(saved);
          answersRef.current = saved;
        }

        setTimeLeft(remaining);
        setDetail(detail);
      } catch (err: any) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [examId]);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!detail || result || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          submitAnswers(detailRef.current!, answersRef.current, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, result, timeLeft > 0]);

  // ── Ping loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!detail || result) return;

    const attemptId = detail.attempt.id;
    const deviceId = localStorage.getItem("deviceId") ?? "";

    const doPing = async () => {
      try {
        const res = await pingAttemptApi(attemptId, deviceId);
        if (res.locked) {
          clearTimer();
          clearPing();
          clearSavedAnswers(attemptId);
          setError(res.message ?? "Bài thi đã bị khóa.");
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời
      }
    };

    pingRef.current = setInterval(doPing, PING_INTERVAL_MS);
    return clearPing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, result]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const clearPing = () => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
  };

  const submitAnswers = async (
    attemptDetail: AttemptDetail,
    currentAnswers: Record<number, number>,
    isTimeout = false,
  ) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    clearTimer();
    clearPing();
    setSubmitting(true);

    const pendingKey = `${PENDING_SUBMIT_KEY}${attemptDetail.attempt.id}`;

    try {
      const payload: AnswerItem[] = Object.entries(currentAnswers).map(
        ([qId, cId]) => ({ questionId: Number(qId), selectedChoiceId: cId }),
      );

      const res = await submitAttemptApi(attemptDetail.attempt.id, { answers: payload });

      clearSavedAnswers(attemptDetail.attempt.id);
      localStorage.removeItem(pendingKey);
      setPendingOfflineSubmit(false);

      setResult({
        score: res.score,
        correct: res.correctAnswers,
        total: res.totalQuestions,
      });

      if (isTimeout) {
        Modal.info({
          title: "Đã hết thời gian",
          content: "Bài thi của bạn đã được tự động nộp do hết thời gian làm bài.",
        });
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err) ?? "Nộp bài thất bại.";

      if (isTimeout && !navigator.onLine) {
        localStorage.setItem(pendingKey, "1");
        setPendingOfflineSubmit(true);
        Modal.warning({
          title: "Mất kết nối mạng",
          content: "Hết giờ nhưng không thể nộp bài do mất mạng. Bài làm đã được lưu lại — hệ thống sẽ tự nộp khi có kết nối trở lại.",
          okText: "Đã hiểu",
        });
      } else {
        clearSavedAnswers(attemptDetail.attempt.id);
        localStorage.removeItem(pendingKey);
        setError(msg);
      }
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleSubmit = (autoSubmit = false) => {
    if (!detail || submittingRef.current) return;

    if (!autoSubmit && !online) {
      Modal.warning({
        title: "Mất kết nối mạng",
        content: "Vui lòng kiểm tra lại kết nối internet trước khi nộp bài.",
      });
      return;
    }

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = detail.questions.length;
    const unansweredCount = totalQuestions - answeredCount;

    if (autoSubmit) { submitAnswers(detail, answers, true); return; }

    if (answeredCount === 0) {
      Modal.warning({
        title: "Chưa trả lời câu hỏi nào",
        content: "Vui lòng trả lời ít nhất một câu hỏi trước khi nộp bài.",
      });
      return;
    }

    if (unansweredCount > 0) {
      Modal.confirm({
        title: "Xác nhận nộp bài",
        icon: <ExclamationCircleOutlined />,
        content: `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`,
        okText: "Nộp bài",
        cancelText: "Hủy",
        onOk: () => submitAnswers(detail, answers),
      });
      return;
    }

    submitAnswers(detail, answers);
  };

  const handleGoBack = () => {
    if (result) { navigate("/user"); return; }
    Modal.confirm({
      title: "Xác nhận thoát",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn thoát? Tiến trình làm bài sẽ không được lưu.",
      okText: "Thoát",
      okType: "danger",
      cancelText: "Ở lại",
      onOk: () => navigate("/user"),
    });
  };

  const setAnswer = (questionId: number, choiceId: number) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: choiceId };
      answersRef.current = next;
      return next;
    });
  };

  return {
    loading,
    submitting,
    error,
    detail,
    answers,
    timeLeft,
    result,
    online,
    currentIndex,
    pendingOfflineSubmit,
    isFullscreen,
    enterFullscreen,
    setCurrentIndex,
    handleSubmit,
    handleGoBack,
    setAnswer,
    answeredCount: Object.keys(answers).length,
    totalQuestions: detail?.questions.length ?? 0,
    currentQuestion: detail?.questions[currentIndex],
  };
}
