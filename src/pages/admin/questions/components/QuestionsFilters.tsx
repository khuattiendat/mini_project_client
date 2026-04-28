import { Button, Select, Space } from "antd";
import { InputSearch } from "../../../../components/common/InputSearch";

interface ExamOption {
  label: string;
  value: string;
}

interface QuestionsFiltersProps {
  searchKeyword: string;
  examFilter: string;
  examOptions: ExamOption[];
  showExamFilter?: boolean;
  isExamsLoading?: boolean;
  onSearchChange: (value: string) => void;
  onExamFilterChange: (value: string) => void;
  onExamSearch: (value: string) => void;
  onReset: () => void;
}

export function QuestionsFilters({
  searchKeyword,
  examFilter,
  examOptions,
  showExamFilter = true,
  isExamsLoading = false,
  onSearchChange,
  onExamFilterChange,
  onExamSearch,
  onReset,
}: QuestionsFiltersProps) {
  return (
    <Space wrap size={[10, 10]} className="my-3 w-full">
      <InputSearch
        value={searchKeyword}
        onSearchChange={onSearchChange}
        placeholder="Tìm theo đề thi hoặc nội dung câu hỏi..."
        debounceMs={350}
        className="h-10! w-[320px]! rounded-md!"
      />

      {showExamFilter ? (
        <Select
          value={examFilter}
          onChange={onExamFilterChange}
          className="h-10!"
          style={{ width: 260 }}
          showSearch
          filterOption={false}
          onSearch={onExamSearch}
          loading={isExamsLoading}
          notFoundContent={isExamsLoading ? "Đang tìm..." : "Không tìm thấy đề thi"}
          options={[{ value: "all", label: "Tất cả đề thi" }, ...examOptions]}
        />
      ) : null}

      <Button className="h-10! rounded-md!" onClick={onReset}>
        Đặt lại
      </Button>
    </Space>
  );
}
