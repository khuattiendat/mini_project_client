import React from "react";
import { Table, Button, Space, Typography, Card, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface ExamType {
  key: string;
  id: string;
  title: string;
  duration: number;
  status: string;
  createdAt: string;
}

const data: ExamType[] = [
  {
    key: "1",
    id: "EXM-001",
    title: "Kiểm tra 15 phút Toán đại số",
    duration: 15,
    status: "Active",
    createdAt: "2023-10-01",
  },
  {
    key: "2",
    id: "EXM-002",
    title: "Thi giữa kỳ Vật Lý 10",
    duration: 45,
    status: "Draft",
    createdAt: "2023-10-05",
  },
  {
    key: "3",
    id: "EXM-003",
    title: "Thi thử Đại học Tiếng Anh",
    duration: 90,
    status: "Active",
    createdAt: "2023-10-10",
  },
];

export default function ExamsPage() {
  const columns: ColumnsType<ExamType> = [
    {
      title: "Mã Đề",
      dataIndex: "id",
      key: "id",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Tên Đề Thi",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Thời gian (phút)",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Trạng thái",
      key: "status",
      dataIndex: "status",
      render: (_, { status }) => {
        const color = status === "Active" ? "green" : "volcano";
        return (
          <Tag color={color} key={status}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} style={{ color: "#1890ff" }} />
          <Button type="text" icon={<DeleteOutlined />} danger />
        </Space>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
            Quản lý đề thi
          </Title>
          <Text type="secondary">Danh sách tất cả các đề thi trong hệ thống</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{
            background: "#534AB7",
            borderRadius: "8px",
            height: "40px",
            boxShadow: "0 4px 12px rgba(83, 74, 183, 0.3)",
          }}
        >
          Tạo đề thi mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
    </Card>
  );
}
