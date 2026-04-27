import { Card } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { ExamFormModal } from "./exams/components/ExamFormModal";
import { ExamsFilters } from "./exams/components/ExamsFilters";
import { ExamsHeader } from "./exams/components/ExamsHeader";
import { ExamsTable } from "./exams/components/ExamsTable";
import { useExamsManagement } from "./exams/hooks/useExamsManagement";

export default function ExamsPage() {
  const {
    form,
    contextHolder,
    exams,
    loading,
    submitting,
    searchKeyword,
    page,
    pageSize,
    total,
    isModalOpen,
    editingExam,
    setPage,
    setPageSize,
    setSearchKeyword,
    resetFilters,
    refreshExams,
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
    removeExam,
  } = useExamsManagement();

  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 10);
  };

  return (
    <>
      {contextHolder}
      <Card className="bg-white px-4 py-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <ExamsHeader
          loading={loading}
          onRefresh={refreshExams}
          onCreate={openCreateModal}
        />

        <ExamsFilters
          searchKeyword={searchKeyword}
          onSearchChange={(value) => {
            setSearchKeyword(value);
          }}
          onReset={resetFilters}
        />

        <ExamsTable
          exams={exams}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onEdit={openEditModal}
          onDelete={(exam) => {
            void removeExam(exam);
          }}
          onPaginationChange={handlePaginationChange}
        />
      </Card>

      <ExamFormModal
        open={isModalOpen}
        submitting={submitting}
        isEditing={Boolean(editingExam)}
        form={form}
        onCancel={closeModal}
        onSubmit={() => {
          void submitForm();
        }}
      />
    </>
  );
}
