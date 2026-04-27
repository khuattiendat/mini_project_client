import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
  ReloadOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Badge, Button, Card, Empty, Skeleton, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import useSWR from "swr";
import { getMyAttemptsApi } from "../../api/examApi";
import type { UserAttempt } from "../../types/exam";
import { formatDateTime } from "../../lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  initialized: {
    label: "Khởi tạo",
    color: "default",
    icon: <ClockCircleOutlined />,
  },
  active: {
    label: "Đang thi",
    color: "processing",
    icon: <LoadingOutlined />,
  },
  submitted: {
    label: "Đã nộp",
    color: "success",
    icon: <CheckCircleOutlined />,
  },
  violated: {
    label: "Vi phạm",
    color: "warning",
    icon: <WarningOutlined />,
  },
  terminated: {
    label: "Kết thúc",
    color: "error",
    icon: <CloseCircleOutlined />,
  },
};

export default function UserHistoryPage() {
  const { data: attempts, isLoading, mutate } = useSWR(
    "user:my-attempts",
    getMyAttemptsApi,
    { revalidateOnFocus: false },
  );

  const columns: ColumnsType<UserAttempt> = [
    {
      title: "Đề thi",
      dataIndex: "examTitle",
      key: "examTitle",
      width: 280,
      render: (title: string, record) => (
        <Space size={8}>
          <FileTextOutlined className="text-blue-500" />
          <div>
            <div className="font-medium text-slate-900">{title}</div>
            <div className="text-xs text-slate-400">ID: {record.examId}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Lần thi",
      dataIndex: "attemptNo",
      key: "attemptNo",
      width: 90,
      align: "center",
      render: (no: number) => (
        <Badge
          count={no}
          style={{ backgroundColor: "#6366f1" }}
          showZero
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => {
        const config = STATUS_CONFIG[status] ?? {
          label: status,
          color: "default",
          icon: <StopOutlined />,
        };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Bắt đầu",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 150,
      render: (date: string | null) => (
        <span className="text-xs text-slate-600">{formatDateTime(date)}</span>
      ),
    },
    {
      title: "Nộp bài",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 150,
      render: (date: string | null) => (
        <span className="text-xs text-slate-600">{formatDateTime(date)}</span>
      ),
    },
    {
      title: "Kết thúc",
      dataIndex: "endedAt",
      key: "endedAt",
      width: 150,
      render: (date: string | null) => (
        <span className="text-xs text-slate-600">{formatDateTime(date)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-900">
            Lịch sử thi của tôi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách các lần thi bạn đã thực hiện
          </p>
        </div>
        <Tooltip title="Làm mới">
          <Button
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={() => void mutate()}
          >
            Làm mới
          </Button>
        </Tooltip>
      </div>

      {/* Table */}
      <Card className="shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !attempts || attempts.length === 0 ? (
          <Empty description="Bạn chưa thi đề nào" />
        ) : (
          <Table<UserAttempt>
            rowKey="id"
            columns={columns}
            dataSource={attempts}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total) => `Tổng ${total} lượt thi`,
            }}
            size="middle"
            bordered
            className="overflow-hidden rounded-md"
          />
        )}
      </Card>
    </div>
  );
}
