import type { UserRole, UserStatus } from "../../../types/user";

export type UserRoleFilter = UserRole | "all";
export type UserStatusFilter = UserStatus | "all";

export const ROLE_FILTER_VALUES = ["all", "admin", "user"] as const;
export const STATUS_FILTER_VALUES = ["all", "active", "inactive"] as const;

export const STATUS_FILTER_OPTIONS: Array<{
  value: UserStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Không hoạt động" },
];

export const ROLE_FORM_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

export const STATUS_FORM_OPTIONS: Array<{ value: UserStatus; label: string }> =
  [
    { value: "active", label: "Đang hoạt động" },
    { value: "inactive", label: "Không hoạt động" },
  ];

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = ["10", "20", "50"];
