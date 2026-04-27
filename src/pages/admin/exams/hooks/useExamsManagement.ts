import { Form, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { getApiErrorMessage } from "../../../../api/apiError";
import {
  createExamApi,
  deleteExamApi,
  getExamsApi,
  updateExamApi,
} from "../../../../api/examApi";
import type {
  CreateExamPayload,
  ExamItem,
  UpdateExamPayload,
} from "../../../../types/exam";
import { DEFAULT_PAGE_SIZE } from "../constants";
import { isFormValidationError } from "../../../../lib/utils";
import type { ExamFormValues } from "../components/ExamFormModal";

const EXAMS_LIST_KEY = "exams";

function buildListKey(page: number, limit: number, search: string) {
  return [EXAMS_LIST_KEY, page, limit, search] as const;
}

export function useExamsManagement() {
  const [form] = Form.useForm<ExamFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [submitting, setSubmitting] = useState(false);

  const [{ page, limit, search }, setQueryStates] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
      search: parseAsString.withDefault("").withOptions({ throttleMs: 350 }),
    },
    { history: "replace" },
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);

  const listKey = useMemo(
    () => buildListKey(page, limit, search.trim() || ""),
    [limit, page, search],
  );

  const {
    data,
    isLoading: isExamsLoading,
    isValidating,
    mutate: mutateExams,
  } = useSWR(listKey, ([, p, l, s]) => getExamsApi({ page: p, limit: l, search: s || undefined }), {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
    onError: (error) => {
      messageApi.error(getApiErrorMessage(error));
    },
  });

  const { trigger: createExam, isMutating: isCreating } = useSWRMutation(
    "exams:create",
    async (_key, { arg }: { arg: CreateExamPayload }) => createExamApi(arg),
  );

  const { trigger: updateExam, isMutating: isUpdating } = useSWRMutation(
    "exams:update",
    async (_key, { arg }: { arg: { id: number; payload: UpdateExamPayload } }) =>
      updateExamApi(arg.id, arg.payload),
  );

  const { trigger: removeExamRequest, isMutating: isDeleting } = useSWRMutation(
    "exams:delete",
    async (_key, { arg }: { arg: number }) => deleteExamApi(arg),
  );

  const exams = useMemo(() => data?.items ?? [], [data]);
  const total = data?.meta.totalItems ?? 0;
  const loading = isExamsLoading || isValidating;

  const openCreateModal = useCallback(() => {
    setEditingExam(null);
    form.setFieldsValue({
      title: "",
      description: "",
      duration: 45,
      startDate: undefined,
      isPublic: false,
    });
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (exam: ExamItem) => {
      setEditingExam(exam);
      form.setFieldsValue({
        title: exam.title,
        description: exam.description ?? "",
        duration: exam.duration,
        startDate: dayjs(exam.startDate),
        isPublic: exam.isPublic,
      });
      setIsModalOpen(true);
    },
    [form],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingExam(null);
    form.resetFields();
  }, [form]);

  const submitForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingExam) {
        const payload: UpdateExamPayload = {
          title: values.title,
          description: values.description?.trim() || null,
          duration: values.duration,
          startDate: values.startDate.toISOString(),
          isPublic: values.isPublic,
        };

        await updateExam({ id: editingExam.id, payload });
        messageApi.success("Cập nhật đề thi thành công");
      } else {
        const payload: CreateExamPayload = {
          title: values.title,
          description: values.description?.trim() || undefined,
          duration: values.duration,
          startDate: values.startDate.toISOString(),
          isPublic: values.isPublic ?? false,
        };

        await createExam(payload);
        messageApi.success("Tạo đề thi thành công");
      }

      closeModal();
      await mutateExams();
    } catch (error) {
      if (isFormValidationError(error)) {
        return;
      }

      messageApi.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [
    closeModal,
    createExam,
    editingExam,
    form,
    messageApi,
    mutateExams,
    updateExam,
  ]);

  const removeExam = useCallback(
    async (exam: ExamItem) => {
      try {
        await removeExamRequest(exam.id);
        messageApi.success("Đã xoá đề thi");

        if (exams.length === 1 && page > 1) {
          await setQueryStates({ page: page - 1 });
          return;
        }

        await mutateExams();
      } catch (error) {
        messageApi.error(getApiErrorMessage(error));
      }
    },
    [
      exams.length,
      messageApi,
      mutateExams,
      page,
      removeExamRequest,
      setQueryStates,
    ],
  );

  const resetFilters = useCallback(() => {
    void setQueryStates({ page: 1, search: "" });
  }, [setQueryStates]);

  return {
    form,
    contextHolder,
    exams,
    loading,
    submitting: submitting || isCreating || isUpdating || isDeleting,
    searchKeyword: search,
    page,
    pageSize: limit,
    total,
    isModalOpen,
    editingExam,
    setPage: (value: number) => {
      void setQueryStates({ page: value });
    },
    setPageSize: (value: number) => {
      void setQueryStates({ page: 1, limit: value });
    },
    setSearchKeyword: (value: string) => {
      void setQueryStates({ page: 1, search: value });
    },
    resetFilters,
    refreshExams: () => void mutateExams(),
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
    removeExam,
  };
}
