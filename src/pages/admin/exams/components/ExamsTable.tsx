import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import type { ExamItem } from "../../../../types/exam";
import { PAGE_SIZE_OPTIONS } from "../constants";
import { formatDateTime } from "../utils";

const { Paragraph, Text } = Typography;

interface ExamsTableProps {
  exams: ExamItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onEdit: (exam: ExamItem) => void;
  onDelete: (exam: ExamItem) => void;
  onPaginationChange: (pagination: TablePaginationConfig) => void;
}

export function ExamsTable({
  exams,
  loading,
  page,
  pageSize,
  total,
  onEdit,
  onDelete,
  onPaginationChange,
}: ExamsTableProps) {
  const columns: ColumnsType<ExamItem> = [
    {
      title: "Đề thi",
      dataIndex: "title",
      key: "title",
      width: 320,
      render: (_, record) => (
        <div>
          <Space size={6} align="center">
            <FileTextOutlined className="text-slate-500" />
            <Text strong style={{ fontSize: 14 }}>
              {record.title}
            </Text>
            {record.isPublic ? (
              <Tooltip title="Công khai — tất cả user đều thấy">
                <Tag icon={<GlobalOutlined />} color="green" style={{ marginLeft: 4 }}>
                  Công khai
                </Tag>
              </Tooltip>
            ) : (
              <Tooltip title="Riêng tư — chỉ user được gán mới thấy">
                <Tag icon={<LockOutlined />} color="default" style={{ marginLeft: 4 }}>
                  Riêng tư
                </Tag>
              </Tooltip>
            )}
          </Space>
          {record.description ? (
            <Paragraph
              ellipsis={{ rows: 2, tooltip: record.description }}
              className="mb-0! mt-1! text-xs! text-slate-500!"
            >
              {record.description}
            </Paragraph>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chưa có mô tả
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Thời lượng",
      dataIndex: "duration",
      key: "duration",
      width: 120,
      render: (duration: number) => (
        <Space size={4}>
          <ClockCircleOutlined className="text-slate-500" />
          <Text>{duration} phút</Text>
        </Space>
      ),
    },
    {
      title: "Bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      width: 160,
      render: (startDate: string) => (
        <Space size={4}>
          <CalendarOutlined className="text-slate-500" />
          <Text type="secondary">{formatDateTime(startDate)}</Text>
        </Space>
      ),
    },
    {
      title: "Thao tác nhanh",
      key: "links",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col gap-2">
          <Link to={`/admin/exams/${record.id}/questions`}>
            <Button size="small" type="primary" block>
              Câu hỏi
            </Button>
          </Link>

          <Link to={`/admin/exams/${record.id}/preview`}>
            <Button size="small" type="default" block >
              Preview
            </Button>
          </Link>

          <Link to={`/admin/exams/${record.id}/assign`}>
            <Button size="small" type="dashed" icon={<TeamOutlined />} block >
              Gán user
            </Button>
          </Link>
        </div>
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
            className="text-[#1677ff]! hover:text-[#0958d9]!"
          />
          <Popconfirm
            title="Xoá đề thi"
            description={`Bạn có chắc muốn xoá đề thi "${record.title}"?`}
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
    <Table<ExamItem>
      rowKey="id"
      columns={columns}
      dataSource={exams}
      loading={loading}
      size="middle"
      bordered
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (value) => `Tổng ${value} đề thi`,
      }}
      onChange={onPaginationChange}
      className="overflow-hidden rounded-md border-slate-300"
    />
  );
}
