import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { submitAttemptApi, getAttemptByExamApi, pingAttemptApi } from "../../../../api/attemptApi";
import type { AttemptDetail, AnswerItem } from "../../../../types/attempt";
import { getApiErrorMessage } from "../../../../api/apiError";
import { useExamGuard } from "./useExamGuard";
import { useAutoSave } from "./useAutoSave";
import { useNetworkStatus } from "./useNetworkStatus";

export interface ExamResult {
  score: number;
  correct: number;
  total: number;
}

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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const detailRef = useRef<AttemptDetail | null>(null);
  const answersRef = useRef<Record<number, number>>({});
  const submittingRef = useRef(false); // guard chống duplicate submit

  const PING_INTERVAL_MS = 30_000;

  // Sync refs để dùng trong callbacks mà không bị stale closure
  useEffect(() => { detailRef.current = detail; }, [detail]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const onViolation = useCallback((type: string) => {
    const attempt = detailRef.current?.attempt;
    if (!attempt) return;
    const deviceId = localStorage.getItem("deviceId") ?? "";
    // Fire-and-forget ping ngay khi vi phạm để server ghi log
    pingAttemptApi(attempt.id, deviceId).then((res) => {
      if (res.locked) {
        clearTimer();
        clearPing();
        clearSaved(attempt.id);
        setError(res.message ?? "Bài thi đã bị khóa.");
      }
    }).catch(() => {});
    void type; // type sẽ được server tự detect qua ping
  }, []);

  // Guard: fullscreen, tab switch, keyboard shortcuts
  useExamGuard({
    active: !!detail && !result && !error,
    onViolation,
  });

  // Auto-save answers vào localStorage mỗi 5s
  // active = false khi bài kết thúc/bị khóa/có lỗi → dừng save
  const { loadSaved, clearSaved } = useAutoSave({
    attemptId: detail?.attempt.id ?? null,
    answers,
    active: !!detail && !result && !error,
  });

  const { online } = useNetworkStatus();

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!examId) {
      setError("Không tìm thấy đề thi.");
      setLoading(false);
      return;
    }

    // Ensure deviceId exists in localStorage
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }

    const init = async () => {
      try {
        const detail = await getAttemptByExamApi(examId, deviceId!);

        // Tính thời gian còn lại dựa vào startedAt từ server
        // startedAt được reset mỗi khi vào trang làm bài
        const totalSeconds = detail.exam.duration * 60;
        const elapsed = detail.attempt.startedAt
          ? Math.floor((Date.now() - new Date(detail.attempt.startedAt).getTime()) / 1000)
          : 0;
        const remaining = Math.max(totalSeconds - elapsed, 0);

        setTimeLeft(remaining);
        setDetail(detail);

        // Restore answers từ localStorage nếu có
        const saved = loadSaved(detail.attempt.id);
        if (saved && Object.keys(saved).length > 0) {
          setAnswers(saved);
          answersRef.current = saved;
        }
      } catch (err: any) {
        const msg = getApiErrorMessage(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [examId]);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    // Không start timer nếu chưa có detail, đã có kết quả, hoặc timeLeft = 0
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
          clearSaved(attemptId);
          setError(res.message ?? "Bài thi đã bị khóa.");
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời, không dừng bài
      }
    };

    pingRef.current = setInterval(doPing, PING_INTERVAL_MS);
    return clearPing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, result]);

  // ── Warn before unload ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!detail || result) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [detail, result]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearPing = () => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  };

  const submitAnswers = async (
    attemptDetail: AttemptDetail,
    currentAnswers: Record<number, number>,
    isTimeout = false,
  ) => {
    // Guard: chặn duplicate submit từ timer hoặc manual cùng lúc
    if (submittingRef.current) return;
    submittingRef.current = true;

    clearTimer();
    clearPing();
    setSubmitting(true);
    try {
      const payload: AnswerItem[] = Object.entries(currentAnswers).map(
        ([qId, cId]) => ({
          questionId: Number(qId),
          selectedChoiceId: cId,
        }),
      );

      const res = await submitAttemptApi(attemptDetail.attempt.id, {
        answers: payload,
      });

      // Xóa autosave sau khi submit thành công
      clearSaved(attemptDetail.attempt.id);

      setResult({
        score: res.score,
        correct: res.correctAnswers,
        total: res.totalQuestions,
      });

      if (isTimeout) {
        Modal.info({
          title: "Đã hết thời gian",
          content:
            "Bài thi của bạn đã được tự động nộp do hết thời gian làm bài.",
        });
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err) ?? "Nộp bài thất bại.";
      // Xóa autosave khi có lỗi để tránh restore data cũ
      clearSaved(attemptDetail.attempt.id);
      setError(msg);
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleSubmit = (autoSubmit = false) => {
    if (!detail || submittingRef.current) return;

    // Block submit khi mất mạng (trừ auto-submit timeout)
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

    if (autoSubmit) {
      submitAnswers(detail, answers, true);
      return;
    }

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
    if (result) {
      navigate("/user");
      return;
    }

    Modal.confirm({
      title: "Xác nhận thoát",
      icon: <ExclamationCircleOutlined />,
      content:
        "Bạn có chắc chắn muốn thoát? Bài làm của bạn sẽ không được lưu.",
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
    setCurrentIndex,
    handleSubmit,
    handleGoBack,
    setAnswer,
    answeredCount: Object.keys(answers).length,
    totalQuestions: detail?.questions.length ?? 0,
    currentQuestion: detail?.questions[currentIndex],
  };
}
