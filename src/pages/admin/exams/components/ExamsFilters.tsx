import { Button, Space } from "antd";
import { InputSearch } from "../../../../components/common/InputSearch";

interface ExamsFiltersProps {
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export function ExamsFilters({
  searchKeyword,
  onSearchChange,
  onReset,
}: ExamsFiltersProps) {
  return (
    <Space wrap size={[10, 10]} className="my-3 w-full">
      <InputSearch
        value={searchKeyword}
        onSearchChange={onSearchChange}
        placeholder="Tìm theo tiêu đề, mô tả, mã đề..."
        debounceMs={350}
        className="h-10! w-[320px]! rounded-md!"
      />

      <Button className="h-10! rounded-md!" onClick={onReset}>
        Đặt lại
      </Button>
    </Space>
  );
}
