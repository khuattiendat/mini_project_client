import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { UserItem, UserStatus } from "../../../../types/user";
import { PAGE_SIZE_OPTIONS } from "../constants";
import { formatDateTime } from "../utils";

const { Text } = Typography;

interface UsersTableProps {
  users: UserItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  onPaginationChange: (pagination: TablePaginationConfig) => void;
}

export function UsersTable({
  users,
  loading,
  page,
  pageSize,
  total,
  onEdit,
  onDelete,
  onPaginationChange,
}: UsersTableProps) {
  const columns: ColumnsType<UserItem> = [
    {
      title: "Người dùng",
      dataIndex: "fullName",
      key: "fullName",
      width: 280,
      render: (_, record) => (
        <Space size={12}>
          <Avatar
            style={{ backgroundColor: "#334155", width: 32, height: 32 }}
            icon={<UserOutlined />}
          >
            {record.fullName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 14 }}>
              {record.fullName}
            </Text>
            <div className="mt-0.5">
              <Text type="secondary" style={{ fontSize: 12 }}>
                @{record.userName}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      dataIndex: "status",
      width: 120,
      render: (status: UserStatus) =>
        status === "active" ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Hoạt động
          </Tag>
        ) : (
          <Tag color="red" icon={<StopOutlined />}>
            Không hoạt động
          </Tag>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (createdAt: string) => (
        <Text type="secondary">{formatDateTime(createdAt)}</Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 90,
      render: (_, record) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            className="!text-[#1677ff] hover:!text-[#0958d9]"
          />
          <Popconfirm
            title="Xoá người dùng"
            description={`Bạn có chắc muốn xoá ${record.fullName}?`}
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(record)}
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<UserItem>
      rowKey="id"
      columns={columns}
      dataSource={users}
      loading={loading}
      size="middle"
      bordered
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (value) => `Tổng ${value} người dùng`,
      }}
      onChange={onPaginationChange}
      className="overflow-hidden rounded-md  border-slate-300"
    />
  );
}
