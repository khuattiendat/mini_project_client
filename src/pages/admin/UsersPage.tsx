import React from "react";
import { Table, Button, Space, Typography, Card, Tag, Avatar } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface StudentType {
  key: string;
  id: string;
  name: string;
  email: string;
  grade: string;
  status: string;
}

const data: StudentType[] = [
  {
    key: "1",
    id: "STD-001",
    name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    grade: "Lớp 10A1",
    status: "Active",
  },
  {
    key: "2",
    id: "STD-002",
    name: "Trần Thị B",
    email: "tranthib@gmail.com",
    grade: "Lớp 11B2",
    status: "Inactive",
  },
  {
    key: "3",
    id: "STD-003",
    name: "Lê Văn C",
    email: "levanc@gmail.com",
    grade: "Lớp 12C3",
    status: "Active",
  },
];

export default function UsersPage() {
  const columns: ColumnsType<StudentType> = [
    {
      title: "Học sinh",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: "#534AB7" }} icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Mã HS",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Lớp",
      dataIndex: "grade",
      key: "grade",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Trạng thái",
      key: "status",
      dataIndex: "status",
      render: (_, { status }) => {
        const color = status === "Active" ? "green" : "red";
        return (
          <Tag color={color} key={status}>
            {status.toUpperCase()}
          </Tag>
        );
      },
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
            Quản lý học sinh
          </Title>
          <Text type="secondary">Danh sách học sinh đang hoạt động trong hệ thống</Text>
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
          Thêm học sinh mới
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
