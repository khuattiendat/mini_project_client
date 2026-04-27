import { Card } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { UsersFilters } from "./users/components/UsersFilters";
import { UserFormModal } from "./users/components/UserFormModal";
import { UsersHeader } from "./users/components/UsersHeader";
import { UsersTable } from "./users/components/UsersTable";
import { useUsersManagement } from "./users/hooks/useUsersManagement";

export default function UsersPage() {
  const {
    form,
    contextHolder,
    users,
    loading,
    submitting,
    searchKeyword,
    roleFilter,
    statusFilter,
    page,
    pageSize,
    total,
    isModalOpen,
    editingUser,
    setPage,
    setPageSize,
    refreshUsers,
    setSearchKeyword,
    setRoleFilter,
    setStatusFilter,
    resetFilters,
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
    removeUser,
  } = useUsersManagement();

  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 10);
  };

  return (
    <>
      {contextHolder}
      <Card className="bg-white px-4 py-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <UsersHeader
          loading={loading}
          onRefresh={refreshUsers}
          onCreate={openCreateModal}
        />

        <UsersFilters
          searchKeyword={searchKeyword}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={(value) => {
            setSearchKeyword(value);
          }}
          onRoleChange={(value) => {
            setRoleFilter(value);
          }}
          onStatusChange={(value) => {
            setStatusFilter(value);
          }}
          onReset={resetFilters}
        />

        <UsersTable
          users={users}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onEdit={openEditModal}
          onDelete={(user) => {
            void removeUser(user);
          }}
          onPaginationChange={handlePaginationChange}
        />
      </Card>

      <UserFormModal
        open={isModalOpen}
        submitting={submitting}
        isEditing={Boolean(editingUser)}
        form={form}
        onCancel={closeModal}
        onSubmit={() => {
          void submitForm();
        }}
      />
    </>
  );
}
