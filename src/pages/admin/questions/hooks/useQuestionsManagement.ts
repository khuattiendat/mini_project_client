import { message } from "antd";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import useSWR from "swr";
import { getApiErrorMessage } from "../../../../api/apiError";
import { getExamsApi } from "../../../../api/examApi";
import type { QuestionItem } from "../../../../types/question";
import { DEFAULT_PAGE_SIZE } from "../constants";
import {
  buildQuestionsListKey,
  deleteQuestionRequest,
  fetchQuestionsList,
} from "../questions.api";

interface UseQuestionsManagementOptions {
  lockedExamId?: number;
}

export function useQuestionsManagement({
  lockedExamId,
}: UseQuestionsManagementOptions = {}) {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [{ page, limit, search, examId }, setQueryStates] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
      search: parseAsString.withDefault("").withOptions({ throttleMs: 350 }),
      examId: parseAsString.withDefault("all"),
    },
    { history: "replace" },
  );

  const activeExamId = useMemo(() => {
    if (lockedExamId !== undefined) {
      return lockedExamId;
    }

    if (examId === "all") {
      return undefined;
    }

    const value = Number.parseInt(examId, 10);

    return Number.isNaN(value) ? undefined : value;
  }, [examId, lockedExamId]);

  const listKey = useMemo(
    () =>
      buildQuestionsListKey({
        page,
        limit,
        search: search.trim() || undefined,
        examId: activeExamId,
      }),
    [activeExamId, limit, page, search],
  );

  const {
    data,
    isLoading: isQuestionsLoading,
    isValidating,
    mutate: mutateQuestions,
  } = useSWR(listKey, fetchQuestionsList, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
    onError: (error) => {
      messageApi.error(getApiErrorMessage(error));
    },
  });

  const {
    data: examsData,
    isLoading: isExamsLoading,
    mutate: mutateExams,
  } = useSWR("questions:exam-options", () =>
    getExamsApi({
      page: 1,
      limit: 1000,
    }),
  );

  const questions = useMemo(() => data?.items ?? [], [data]);
  const total = data?.meta.totalItems ?? 0;
  const loading = isQuestionsLoading || isValidating;

  const examOptions = useMemo(
    () =>
      (examsData?.items ?? []).map((exam) => ({
        label: exam.title,
        value: exam.id,
      })),
    [examsData],
  );

  const examFilterOptions = useMemo(
    () =>
      (examsData?.items ?? []).map((exam) => ({
        label: exam.title,
        value: String(exam.id),
      })),
    [examsData],
  );

  const selectedExamTitle = useMemo(() => {
    if (activeExamId === undefined) {
      return null;
    }

    return (
      examsData?.items.find((exam) => exam.id === activeExamId)?.title ??
      `Đề thi #${activeExamId}`
    );
  }, [activeExamId, examsData]);

  const getQuestionsBasePath = useCallback((examIdentifier?: number) => {
    if (examIdentifier !== undefined) {
      return `/admin/exams/${examIdentifier}/questions`;
    }

    return "/admin/questions";
  }, []);

  const openCreateQuestion = useCallback(() => {
    const targetExamId = activeExamId;
    navigate(`${getQuestionsBasePath(targetExamId)}/new`);
  }, [activeExamId, getQuestionsBasePath, navigate]);

  const openEditQuestion = useCallback(
    (question: QuestionItem) => {
      navigate(`${getQuestionsBasePath(question.examId)}/${question.id}/edit`);
    },
    [getQuestionsBasePath, navigate],
  );

  const removeQuestion = useCallback(
    async (question: QuestionItem) => {
      try {
        await deleteQuestionRequest(question.id);
        messageApi.success("Đã xoá câu hỏi");

        if (questions.length === 1 && page > 1) {
          await setQueryStates({ page: page - 1 });
          return;
        }

        await Promise.all([mutateQuestions(), mutateExams()]);
      } catch (error) {
        messageApi.error(getApiErrorMessage(error));
      }
    },
    [
      messageApi,
      mutateExams,
      mutateQuestions,
      page,
      questions.length,
      setQueryStates,
    ],
  );

  const resetFilters = useCallback(() => {
    void setQueryStates({
      page: 1,
      search: "",
      examId: lockedExamId !== undefined ? String(lockedExamId) : "all",
    });
  }, [lockedExamId, setQueryStates]);

  return {
    contextHolder,
    questions,
    loading,
    loadingExams: isExamsLoading,
    searchKeyword: search,
    examFilter: lockedExamId !== undefined ? String(lockedExamId) : examId,
    examFilterOptions,
    examOptions,
    selectedExamTitle,
    page,
    pageSize: limit,
    total,
    showExamFilter: lockedExamId === undefined,
    setPage: (value: number) => {
      void setQueryStates({ page: value });
    },
    setPageSize: (value: number) => {
      void setQueryStates({ page: 1, limit: value });
    },
    setSearchKeyword: (value: string) => {
      void setQueryStates({ page: 1, search: value });
    },
    setExamFilter: (value: string) => {
      if (lockedExamId !== undefined) {
        return;
      }

      void setQueryStates({ page: 1, examId: value });
    },
    resetFilters,
    refreshQuestions: () => {
      void Promise.all([mutateQuestions(), mutateExams()]);
    },
    openCreateQuestion,
    openEditQuestion,
    removeQuestion,
  };
}
