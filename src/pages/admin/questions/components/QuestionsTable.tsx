import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Space, Table, Typography } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import type { ColumnsType } from "antd/es/table";
import type { QuestionItem } from "../../../../types/question";
import { PAGE_SIZE_OPTIONS } from "../constants";
import { formatDateTime, stripHtml } from "../utils";

const { Paragraph, Text } = Typography;

interface QuestionsTableProps {
  questions: QuestionItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showOrderIndex?: boolean;
  onEdit: (question: QuestionItem) => void;
  onDelete: (question: QuestionItem) => void;
  onPaginationChange: (pagination: TablePaginationConfig) => void;
}

export function QuestionsTable({
  questions,
  loading,
  page,
  pageSize,
  total,
  showOrderIndex = false,
  onEdit,
  onDelete,
  onPaginationChange,
}: QuestionsTableProps) {
  const columns: ColumnsType<QuestionItem> = [
    ...(showOrderIndex
      ? [
          {
            title: "Thứ tự",
            dataIndex: "orderIndex",
            key: "orderIndex",
            width: 90,
            render: (orderIndex: number) => (
              <Text strong className="text-blue-600">
                {orderIndex}
              </Text>
            ),
          } satisfies ColumnsType<QuestionItem>[number],
        ]
      : []),
    {
      title: "Đề thi",
      dataIndex: "examTitle",
      key: "examTitle",
      width: 260,
      render: (examTitle: string | null, record) => (
        <Space size={6}>
          <ReadOutlined className="text-slate-500" />
          <div>
            <Text strong>{examTitle ?? `Đề thi #${record.examId}`}</Text>
           
          </div>
        </Space>
      ),
    },
    {
      title: "Nội dung câu hỏi",
      dataIndex: "content",
      key: "content",
      width: 420,
      render: (content: string) => (
        <Space align="start" size={8}>
          <FileTextOutlined className="mt-1 text-slate-500" />
          <Paragraph
            className="mb-0!"
            ellipsis={{
              rows: 3,
              expandable: false,
              tooltip: stripHtml(content),
            }}
          >
            {stripHtml(content) || "(Nội dung rỗng)"}
          </Paragraph>
        </Space>
      ),
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (updatedAt: string) => (
        <Text type="secondary">{formatDateTime(updatedAt)}</Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space size={8}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            className="text-[#1677ff]! hover:text-[#0958d9]!"
          />
          <Popconfirm
            title="Xoá câu hỏi"
            description={`Bạn có chắc muốn xoá câu hỏi của đề "${record.examTitle ?? record.examId}"?`}
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
    <Table<QuestionItem>
      rowKey="id"
      columns={columns}
      dataSource={questions}
      loading={loading}
      size="middle"
      bordered
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        showTotal: (value) => `Tổng ${value} câu hỏi`,
      }}
      onChange={onPaginationChange}
      className="overflow-hidden rounded-md border-slate-300"
    />
  );
}
