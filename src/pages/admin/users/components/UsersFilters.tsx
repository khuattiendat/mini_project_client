import { Button, Select, Space } from "antd";
import { InputSearch } from "../../../../components/common/InputSearch";
import {
  STATUS_FILTER_OPTIONS,
  type UserRoleFilter,
  type UserStatusFilter,
} from "../constants";

interface UsersFiltersProps {
  searchKeyword: string;
  roleFilter: UserRoleFilter;
  statusFilter: UserStatusFilter;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserRoleFilter) => void;
  onStatusChange: (value: UserStatusFilter) => void;
  onReset: () => void;
}

export function UsersFilters({
  searchKeyword,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onReset,
}: UsersFiltersProps) {
  return (
    <Space wrap size={[10, 10]} className="w-full my-3">
      <InputSearch
        value={searchKeyword}
        onSearchChange={onSearchChange}
        placeholder="Tìm theo username, họ tên, thiết bị..."
        debounceMs={350}
        className="h-10! w-[320px]! rounded-md!"
      />

      <Select
        value={statusFilter}
        onChange={onStatusChange}
        className="h-10! w-[180px]!"
        options={STATUS_FILTER_OPTIONS}
      />

      <Button className="h-10! rounded-md!" onClick={onReset}>
        Đặt lại
      </Button>
    </Space>
  );
}
