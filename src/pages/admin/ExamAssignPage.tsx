import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import {
  assignUsersApi,
  getAssignedUsersApi,
  unassignUserApi,
} from "../../api/examApi";
import { getExamApi } from "../../api/examApi";
import { getUsersApi } from "../../api/userApi";
import { getApiErrorMessage } from "../../api/apiError";
import { useDebounce } from "../../hooks/useDebounce";
import type { AssignedUser } from "../../types/exam";

const { Text } = Typography;

export default function ExamAssignPage() {
  const { examId } = useParams();
  const parsedId = examId ? Number.parseInt(examId, 10) : undefined;
  const normalizedId =
    parsedId !== undefined && !Number.isNaN(parsedId) ? parsedId : undefined;

  const [messageApi, contextHolder] = message.useMessage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { data: exam, isLoading: isExamLoading } = useSWR(
    normalizedId ? ["exam-assign:exam", normalizedId] : null,
    ([, id]) => getExamApi(id),
  );

  const {
    data: assignedUsers,
    isLoading: isAssignedLoading,
    mutate: mutateAssigned,
  } = useSWR(
    normalizedId ? ["exam-assign:assigned", normalizedId] : null,
    ([, id]) => getAssignedUsersApi(id),
  );

  const debouncedSearch = useDebounce(searchText, 350);

  const { data: allUsersData, isLoading: isSearching } = useSWR(
    modalOpen ? ["exam-assign:search-users", debouncedSearch] : null,
    ([, search]) => getUsersApi({ page: 1, limit: 20, search: search || undefined }),
  );

  const assignedIds = new Set((assignedUsers ?? []).map((u) => u.id));

  const userOptions = (allUsersData?.items ?? [])
    .filter((u) => !assignedIds.has(u.id))
    .map((u) => ({
      label: `${u.fullName} (@${u.userName})`,
      value: u.id,
    }));

  const handleAssign = async () => {
    if (selectedUserIds.length === 0 || !normalizedId) return;
    try {
      setSubmitting(true);
      await assignUsersApi(normalizedId, selectedUserIds);
      messageApi.success(`Đã gán ${selectedUserIds.length} người dùng`);
      setSelectedUserIds([]);
      setModalOpen(false);
      setSearchText("");
      await mutateAssigned();
    } catch (err) {
      messageApi.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (userId: number) => {
    if (!normalizedId) return;
    try {
      await unassignUserApi(normalizedId, userId);
      messageApi.success("Đã xoá người dùng khỏi đề thi");
      await mutateAssigned();
    } catch (err) {
      messageApi.error(getApiErrorMessage(err));
    }
  };

  const columns: ColumnsType<AssignedUser> = [
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <Space size={10}>
          <Avatar size={32} icon={<UserOutlined />} style={{ background: "#6366f1" }} />
          <div>
            <Text strong>{record.fullName}</Text>
            <div className="text-xs text-slate-400">@{record.userName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status === "active" ? "Hoạt động" : "Vô hiệu"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Xoá khỏi đề thi?"
          description={`Bỏ quyền thi của "${record.fullName}"?`}
          okText="Xoá"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          onConfirm={() => void handleUnassign(record.id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Card className="shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/admin/exams`}>

            <Button icon={<ArrowLeftOutlined />} className="mb-3">
              Quay lại danh sách đề thi
            </Button>
          </Link>


          {isExamLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: 300 }} />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="m-0 text-xl font-bold text-slate-900">
                  Gán người dùng — {exam?.title ?? `Đề thi #${normalizedId}`}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Quản lý danh sách người dùng được phép thi đề này
                </p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalOpen(true)}
              >
                Gán người dùng
              </Button>
            </div>
          )}
        </div>

        {/* Assigned users table */}
        {isAssignedLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : !assignedUsers || assignedUsers.length === 0 ? (
          <Empty
            description="Chưa có người dùng nào được gán vào đề thi này"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table<AssignedUser>
            rowKey="id"
            columns={columns}
            dataSource={assignedUsers}
            size="middle"
            bordered
            pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} người dùng` }}
            className="overflow-hidden rounded-md"
          />
        )}
      </Card >

      {/* Assign modal */}
      < Modal
        title="Gán người dùng vào đề thi"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedUserIds([]);
          setSearchText("");
        }
        }
        onOk={() => void handleAssign()}
        confirmLoading={submitting}
        okText="Gán"
        cancelText="Huỷ"
        okButtonProps={{ disabled: selectedUserIds.length === 0 }}
        destroyOnHidden
      >
        <div className="py-2">
          <p className="mb-2 text-sm text-slate-600">
            Chọn người dùng muốn gán vào đề thi:
          </p>
          <Select
            mode="multiple"
            className="w-full"
            placeholder="Tìm và chọn người dùng..."
            options={userOptions}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            showSearch
            filterOption={false}
            onSearch={setSearchText}
            loading={isSearching}
            notFoundContent={isSearching ? "Đang tìm..." : "Không tìm thấy người dùng"}
            maxTagCount="responsive"
          />
          {selectedUserIds.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Đã chọn {selectedUserIds.length} người dùng
            </p>
          )}
        </div>
      </Modal >
    </>
  );
}
