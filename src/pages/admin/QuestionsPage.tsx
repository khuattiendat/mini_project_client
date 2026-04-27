import { Button, Card } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { Link, useParams } from "react-router-dom";
import { QuestionsFilters } from "./questions/components/QuestionsFilters";
import { QuestionsHeader } from "./questions/components/QuestionsHeader";
import { QuestionsTable } from "./questions/components/QuestionsTable";
import { useQuestionsManagement } from "./questions/hooks/useQuestionsManagement";

export default function QuestionsPage() {
  const { examId } = useParams();
  const lockedExamId = examId ? Number.parseInt(examId, 10) : undefined;
  const normalizedLockedExamId =
    lockedExamId !== undefined && !Number.isNaN(lockedExamId)
      ? lockedExamId
      : undefined;

  const {
    contextHolder,
    questions,
    loading,
    searchKeyword,
    examFilter,
    examFilterOptions,
    page,
    pageSize,
    total,
    selectedExamTitle,
    showExamFilter,
    setPage,
    setPageSize,
    setSearchKeyword,
    setExamFilter,
    resetFilters,
    refreshQuestions,
    openCreateQuestion,
    openEditQuestion,
    removeQuestion,
  } = useQuestionsManagement({ lockedExamId: normalizedLockedExamId });

  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 10);
  };

  const primaryAction = openCreateQuestion;

  return (
    <>
      {contextHolder}
      <Card className="bg-white px-4 py-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <QuestionsHeader
            loading={loading}
            onRefresh={refreshQuestions}
            onCreate={primaryAction}
            title={
              selectedExamTitle
                ? `Danh sách câu hỏi - ${selectedExamTitle}`
                : "Quản lý câu hỏi"
            }
            description={
              normalizedLockedExamId !== undefined
                ? "Danh sách câu hỏi của đề thi đang chọn"
                : "Theo dõi và quản lý câu hỏi trong hệ thống"
            }
            createLabel="Thêm câu hỏi"
          />

          {normalizedLockedExamId !== undefined ? (
            <div className="flex gap-2">
              <Link to={`/admin/exams/${normalizedLockedExamId}/preview`}>
                <Button>
                  Preview đề thi
                </Button>
              </Link>
              <Link to="/admin/exams">
                <Button> Quay lại danh sách đề thi</Button>
              </Link>
            </div>
          ) : null}
        </div>

        <QuestionsFilters
          searchKeyword={searchKeyword}
          examFilter={examFilter}
          examOptions={examFilterOptions}
          showExamFilter={showExamFilter}
          onSearchChange={(value) => {
            setSearchKeyword(value);
          }}
          onExamFilterChange={(value) => {
            setExamFilter(value);
          }}
          onReset={resetFilters}
        />

        <QuestionsTable
          questions={questions}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          showOrderIndex={normalizedLockedExamId !== undefined}
          onEdit={openEditQuestion}
          onDelete={(question) => {
            void removeQuestion(question);
          }}
          onPaginationChange={handlePaginationChange}
        />
      </Card>
    </>
  );
}
