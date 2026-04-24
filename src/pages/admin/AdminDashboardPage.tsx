import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  HomeOutlined,
  SearchOutlined,
  UserOutlined,
  UsergroupDeleteOutlined,
} from "@ant-design/icons";
import { Button, Input, Space, Table, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  active?: boolean;
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  active,
}: StatCardProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: active
          ? "0 4px 24px rgba(83,74,183,0.13)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        border: active ? "1.5px solid #e8e6f9" : "1.5px solid #f0f0f0",
        flex: 1,
        minWidth: 0,
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 13,
            color: "#8c8c8c",
            margin: 0,
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Table data ───────────────────────────────────────────────────────────────
interface BranchItem {
  key: string;
  index: number;
  name: string;
  address: string;
  phone: string;
  createdAt: string;
}

const branchData: BranchItem[] = [
  {
    key: "1",
    index: 1,
    name: "Cơ sở - Online",
    address: "Online",
    phone: "0399582850",
    createdAt: "12/4/2026",
  },
  {
    key: "2",
    index: 2,
    name: "Cơ sở 4 - Tân Dân",
    address: "Cầu Xây, Điền Quy, Kim Anh, Hà Nội",
    phone: "0399582850",
    createdAt: "12/4/2026",
  },
  {
    key: "3",
    index: 3,
    name: "Cơ sở 3 - Minh Phú",
    address: "SN 66 đường Cây Xanh, Thanh Trì, Kim Anh, Hà Nội",
    phone: "0384445281",
    createdAt: "12/4/2026",
  },
  {
    key: "4",
    index: 4,
    name: "Cơ sở 2 - Thành Lãng",
    address: "Độc Lập – Xuân Lãng – Phú Thọ",
    phone: "0393743005",
    createdAt: "12/4/2026",
  },
  {
    key: "5",
    index: 5,
    name: "Cơ sở 1 - Tự Lập",
    address: "Khu 2 – Yên Bài – Tiến Thắng – Hà Nội",
    phone: "0399582850",
    createdAt: "12/4/2026",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [keyword, setKeyword] = useState("");

  const filteredData = useMemo(() => {
    if (!keyword.trim()) return branchData;
    const kw = keyword.toLowerCase();
    return branchData.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        item.address.toLowerCase().includes(kw) ||
        item.phone.includes(keyword),
    );
  }, [keyword]);

  const columns: ColumnsType<BranchItem> = [
    { title: "STT", dataIndex: "index", key: "index", width: 70 },
    { title: "Tên cơ sở", dataIndex: "name", key: "name" },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      responsive: ["lg"],
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 160,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
    },
    {
      title: "",
      key: "action",
      width: 90,
      render: () => (
        <Space size={4}>
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#8c8c8c" }} />}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Stat cards ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard
          icon={<UserOutlined />}
          iconBg="#e8f4fd"
          iconColor="#4096ff"
          label="Tổng số tài khoản"
          value={30}
        />
        <StatCard
          icon={<FileTextOutlined />}
          iconBg="#fff7e6"
          iconColor="#fa8c16"
          label="Tổng số bài thi"
          value={44}
          active
        />
      </div>
    </div>
  );
}
