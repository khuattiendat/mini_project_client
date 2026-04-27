import { Form, message } from "antd";
import { useCallback, useMemo, useState } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { getApiErrorMessage } from "../../../../api/apiError";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserItem,
} from "../../../../types/user";
import {
  DEFAULT_PAGE_SIZE,
  ROLE_FILTER_VALUES,
  STATUS_FILTER_VALUES,
  type UserRoleFilter,
  type UserStatusFilter,
} from "../constants";
import { isFormValidationError } from "../utils";
import type { UserFormValues } from "../components/UserFormModal";
import {
  buildUsersListKey,
  createUserRequest,
  deleteUserRequest,
  fetchUsersList,
  updateUserRequest,
} from "../users.api";

export function useUsersManagement() {
  const [form] = Form.useForm<UserFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [submitting, setSubmitting] = useState(false);

  const [{ page, limit, search, role, status }, setQueryStates] =
    useQueryStates(
      {
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
        search: parseAsString.withDefault("").withOptions({ throttleMs: 350 }),
        role: parseAsStringLiteral(ROLE_FILTER_VALUES).withDefault("all"),
        status: parseAsStringLiteral(STATUS_FILTER_VALUES).withDefault("all"),
      },
      { history: "replace" },
    );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const listKey = useMemo(
    () =>
      buildUsersListKey({
        page,
        limit,
        search: search.trim() || undefined,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
      }),
    [limit, page, role, search, status],
  );

  const {
    data,
    isLoading: isUsersLoading,
    isValidating,
    mutate: mutateUsers,
  } = useSWR(listKey, fetchUsersList, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
    onError: (error) => {
      messageApi.error(getApiErrorMessage(error));
    },
  });

  const { trigger: createUser, isMutating: isCreating } = useSWRMutation(
    "users:create",
    async (_key, { arg }: { arg: CreateUserPayload }) => createUserRequest(arg),
  );

  const { trigger: updateUser, isMutating: isUpdating } = useSWRMutation(
    "users:update",
    async (
      _key,
      { arg }: { arg: { id: number; payload: UpdateUserPayload } },
    ) => updateUserRequest(arg),
  );

  const { trigger: removeUserRequest, isMutating: isDeleting } = useSWRMutation(
    "users:delete",
    async (_key, { arg }: { arg: number }) => deleteUserRequest(arg),
  );

  const users = useMemo(() => data?.items ?? [], [data]);
  const total = data?.meta.totalItems ?? 0;
  const loading = isUsersLoading || isValidating;

  const openCreateModal = useCallback(() => {
    setEditingUser(null);
    form.setFieldsValue({
      fullName: "",
      userName: "",
      password: "",
      status: "active",
    });
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (user: UserItem) => {
      setEditingUser(user);
      form.setFieldsValue({
        fullName: user.fullName,
        userName: user.userName,
        password: "",
        status: user.status,
      });
      setIsModalOpen(true);
    },
    [form],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  }, [form]);

  const submitForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingUser) {
        const payload: UpdateUserPayload = {
          fullName: values.fullName,
          status: values.status,
        };

        if (values.password?.trim()) {
          payload.password = values.password.trim();
        }

        await updateUser({ id: editingUser.id, payload });
        messageApi.success("Cập nhật người dùng thành công");
      } else {
        const payload: CreateUserPayload = {
          fullName: values.fullName,
          userName: values.userName,
          password: values.password ?? "",
          status: values.status,
        };

        await createUser(payload);
        messageApi.success("Tạo người dùng thành công");
      }

      closeModal();
      await mutateUsers();
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
    createUser,
    editingUser,
    form,
    messageApi,
    mutateUsers,
    updateUser,
  ]);

  const removeUser = useCallback(
    async (user: UserItem) => {
      try {
        await removeUserRequest(user.id);
        messageApi.success("Đã xoá người dùng");

        if (users.length === 1 && page > 1) {
          await setQueryStates({ page: page - 1 });
          return;
        }

        await mutateUsers();
      } catch (error) {
        messageApi.error(getApiErrorMessage(error));
      }
    },
    [
      messageApi,
      mutateUsers,
      page,
      removeUserRequest,
      setQueryStates,
      users.length,
    ],
  );

  const resetFilters = useCallback(() => {
    void setQueryStates({ page: 1, search: "", role: "all", status: "all" });
  }, [setQueryStates]);

  const activeCount = useMemo(
    () => users.filter((user) => user.status === "active").length,
    [users],
  );

  const inactiveCount = useMemo(
    () => users.filter((user) => user.status === "inactive").length,
    [users],
  );

  return {
    form,
    contextHolder,
    users,
    loading,
    submitting: submitting || isCreating || isUpdating || isDeleting,
    searchKeyword: search,
    roleFilter: role,
    statusFilter: status,
    page,
    pageSize: limit,
    total,
    activeCount,
    inactiveCount,
    isModalOpen,
    editingUser,
    setPage: (value: number) => {
      void setQueryStates({ page: value });
    },
    setPageSize: (value: number) => {
      void setQueryStates({ page: 1, limit: value });
    },
    setSearchKeyword: (value: string) => {
      void setQueryStates({ page: 1, search: value });
    },
    setRoleFilter: (value: UserRoleFilter) => {
      void setQueryStates({ page: 1, role: value });
    },
    setStatusFilter: (value: UserStatusFilter) => {
      void setQueryStates({ page: 1, status: value });
    },
    resetFilters,
    refreshUsers: () => void mutateUsers(),
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
    removeUser,
  };
}
