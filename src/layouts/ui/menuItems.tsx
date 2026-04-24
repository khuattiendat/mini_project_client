import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

export const menuItems: MenuProps["items"] = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: "Tổng quan hệ thống",
  },
  {
    key: "/admin/exams",
    icon: <FileTextOutlined />,
    label: "Quản lý đề thi",
  },
  {
    key: "/admin/users",
    icon: <TeamOutlined />,
    label: "Quản lý học sinh",
  },
];
