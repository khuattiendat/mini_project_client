import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  StopOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Empty,
  Modal,
  Popconfirm,
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import {
  adminResetAttemptApi,
  adminTerminateAttemptApi,
  getExamApi,
  getExamHistoryApi,
} from "../../api/examApi";
import { getApiErrorMessage } from "../../api/apiError";
import { InputSearch } from "../../components/common/InputSearch";
import type { ExamHistoryAttempt, ExamHistoryViolation } from "../../types/exam";
import { formatDateTime } from "../../lib/utils";

const { Text } = Typography;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  initialized: { label: "Khởi tạo", color: "default", icon: <ClockCircleOutlined /> },
  active: { label: "Đang thi", color: "processing", icon: <LoadingOutlined /> },
  submitted: { label: "Đã nộp", color: "success", icon: <CheckCircleOutlined /> },
  violated: { label: "Vi phạm", color: "warning", icon: <WarningOutlined /> },
  terminated: { label: "Kết thúc", color: "error", icon: <CloseCircleOutlined /> },
};

const VIOLATION_LABELS: Record<string, string> = {
  DEVICE_MISMATCH: "Thiết bị không khớp",
  TAB_SWITCH: "Chuyển tab",
  WINDOW_BLUR: "Rời cửa sổ",
  COPY_PASTE: "Sao chép / dán",
  FULLSCREEN_EXIT: "Thoát toàn màn hình",
  DEV_TOOLS: "Mở DevTools",
  SCREENSHOT: "Chụp màn hình",
  AUTOMATION: "Công cụ tự động hóa",
  OTHER: "Khác",
};

const violationColumns: ColumnsType<ExamHistoryViolation> = [
  {
    title: "#",
    key: "index",
    width: 48,
    render: (_, __, index) => (
      <Text type="secondary" className="text-xs">{index + 1}</Text>
    ),
  },
  {
    title: "Loại vi phạm",
    dataIndex: "type",
    key: "type",
    width: 200,
    render: (type: string) => (
      <Tag color="orange" icon={<WarningOutlined />}>
        {VIOLATION_LABELS[type] ?? type}
      </Tag>
    ),
  },
  {
    title: "Thông tin",
    dataIndex: "metadata",
    key: "metadata",
    render: (metadata: Record<string, any> | null) => {
      if (!metadata) return <Text type="secondary">—</Text>;
      const { message: msg, ...rest } = metadata;
      return (
        <div className="text-xs text-slate-600">
          {msg && <div className="mb-1">{msg}</div>}
          {Object.keys(rest).length > 0 && (
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-500">
              {JSON.stringify(rest)}
            </code>
          )}
        </div>
      );
    },
  },
  {
    title: "Thời điểm",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 160,
    render: (date: string) => (
      <span className="text-xs text-slate-500">{formatDateTime(date)}</span>
    ),
  },
];

// Các status không cho phép thực hiện hành động admin
const TERMINAL_STATUSES = new Set(["submitted", "terminated", "violated"]);

export default function ExamHistoryPage() {
  const { examId } = useParams();
  const parsedId = examId ? Number.parseInt(examId, 10) : undefined;
  const normalizedId =
    parsedId !== undefined && !Number.isNaN(parsedId) ? parsedId : undefined;

  const [messageApi, contextHolder] = message.useMessage();
  const [selectedAttempt, setSelectedAttempt] = useState<ExamHistoryAttempt | null>(null);
  const [search, setSearch] = useState("");
  // Track loading per-row để tránh double-click
  const [loadingRows, setLoadingRows] = useState<Record<string, "reset" | "terminate">>({});

  const { data: exam, isLoading: isExamLoading } = useSWR(
    normalizedId ? ["exam-history:exam", normalizedId] : null,
    ([, id]) => getExamApi(id),
  );

  const {
    data: attempts,
    isLoading: isFirstLoad,
    isValidating,
    mutate,
  } = useSWR(
    normalizedId ? ["exam-history:attempts", normalizedId, search] : null,
    ([, id, q]) => getExamHistoryApi(id, q),
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const isFetching = isValidating && !isFirstLoad;

  const handleReset = async (record: ExamHistoryAttempt) => {
    if (!normalizedId) return;
    setLoadingRows((prev) => ({ ...prev, [record.id]: "reset" }));
    try {
      await adminResetAttemptApi(normalizedId, record.user.id);
      messageApi.success(`Đã cho ${record.user.fullName} thi lại`);
      await mutate();
    } catch (err) {
      messageApi.error(getApiErrorMessage(err));
    } finally {
      setLoadingRows((prev) => {
        const next = { ...prev };
        delete next[record.id];
        return next;
      });
    }
  };

  const handleTerminate = async (record: ExamHistoryAttempt) => {
    setLoadingRows((prev) => ({ ...prev, [record.id]: "terminate" }));
    try {
      await adminTerminateAttemptApi(record.id);
      messageApi.success(`Đã cấm thi ${record.user.fullName}`);
      await mutate();
    } catch (err) {
      messageApi.error(getApiErrorMessage(err));
    } finally {
      setLoadingRows((prev) => {
        const next = { ...prev };
        delete next[record.id];
        return next;
      });
    }
  };

  const columns: ColumnsType<ExamHistoryAttempt> = [
    {
      title: "Người dùng",
      key: "user",
      width: 220,
      render: (_, record) => (
        <Space size={8}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <UserOutlined />
          </div>
          <div>
            <div className="font-medium text-slate-900">{record.user.fullName}</div>
            <div className="text-xs text-slate-400">@{record.user.userName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Lần thi",
      dataIndex: "attemptNo",
      key: "attemptNo",
      width: 80,
      align: "center",
      render: (no: number) => (
        <Badge count={no} style={{ backgroundColor: "#6366f1" }} showZero />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status] ?? {
          label: status,
          color: "default",
          icon: <StopOutlined />,
        };
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Vi phạm",
      key: "violations",
      width: 90,
      align: "center",
      render: (_, record) =>
        record.violations.length > 0 ? (
          <Tag
            color="red"
            icon={<WarningOutlined />}
            className="cursor-pointer"
            onClick={() => setSelectedAttempt(record)}
          >
            {record.violations.length}
          </Tag>
        ) : (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            0
          </Tag>
        ),
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
      title: "Hành động",
      key: "actions",
      width: 160,
      align: "center",
      render: (_, record) => {
        const rowLoading = loadingRows[record.id];
        const isTerminal = TERMINAL_STATUSES.has(record.status);

        return (
          <Space size={6} direction="vertical" className="w-full">
            <Popconfirm
              title="Cho thi lại?"
              description={`Tạo lượt thi mới cho "${record.user.fullName}"?`}
              okText="Xác nhận"
              cancelText="Huỷ"
              onConfirm={() => void handleReset(record)}
              disabled={rowLoading === "terminate"}
            >
              <Button
                size="small"
                type="primary"
                ghost
                block
                loading={rowLoading === "reset"}
                disabled={!!rowLoading && rowLoading !== "reset"}
              >
                Cho thi lại
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Cấm thi?"
              description={`Kết thúc vĩnh viễn lượt thi của "${record.user.fullName}"?`}
              okText="Cấm thi"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => void handleTerminate(record)}
              disabled={isTerminal || rowLoading === "reset"}
            >
              <Tooltip
                title={isTerminal ? "Lượt thi này đã kết thúc" : undefined}
              >
                <Button
                  size="small"
                  danger
                  ghost
                  block
                  loading={rowLoading === "terminate"}
                  disabled={isTerminal || (!!rowLoading && rowLoading !== "terminate")}
                >
                  Cấm thi
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <Card className="shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        {/* Header */}
        <div className="mb-6">
          <Link to="/admin/exams">
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
                  Lịch sử thi — {exam?.title ?? `Đề thi #${normalizedId}`}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Danh sách tất cả lượt thi và vi phạm của người dùng
                </p>
              </div>
              <Tooltip title="Làm mới">
                <Button
                  icon={<ReloadOutlined />}
                  loading={isValidating}
                  onClick={() => void mutate()}
                >
                  Làm mới
                </Button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Search — luôn hiển thị sau lần load đầu */}
        {!isFirstLoad && (
          <div className="mb-3 flex items-center gap-3">
            <InputSearch
              value={search}
              onSearchChange={setSearch}
              placeholder="Tìm theo tên hoặc username..."
              className="max-w-xs"
            />
            {isFetching && <Spin size="small" />}
            {!isFetching && search && (
              <Text type="secondary" className="text-xs">
                {attempts?.length ?? 0} kết quả
              </Text>
            )}
          </div>
        )}

        {/* Table area */}
        {isFirstLoad ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div
            className={
              isFetching
                ? "opacity-60 transition-opacity duration-150"
                : "transition-opacity duration-150"
            }
          >
            {!attempts || attempts.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search
                    ? `Không tìm thấy kết quả cho "${search}"`
                    : "Chưa có lượt thi nào cho đề thi này"
                }
              />
            ) : (
              <Table<ExamHistoryAttempt>
                rowKey="id"
                columns={columns}
                dataSource={attempts}
                size="middle"
                bordered
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  showTotal: (total) => `Tổng ${total} lượt thi`,
                }}
                className="overflow-hidden rounded-md"
              />
            )}
          </div>
        )}
      </Card>

      {/* Violations modal */}
      <Modal
        open={!!selectedAttempt}
        onCancel={() => setSelectedAttempt(null)}
        footer={<Button onClick={() => setSelectedAttempt(null)}>Đóng</Button>}
        title={
          <Space>
            <WarningOutlined className="text-orange-500" />
            <span>
              Danh sách vi phạm —{" "}
              <Text strong>{selectedAttempt?.user.fullName}</Text>
              <Text type="secondary" className="ml-1 text-sm">
                (lần thi #{selectedAttempt?.attemptNo})
              </Text>
            </span>
          </Space>
        }
        width={760}
        destroyOnHidden
      >
        {selectedAttempt &&
          (selectedAttempt.violations.length === 0 ? (
            <Empty
              description="Không có vi phạm nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table<ExamHistoryViolation>
              rowKey="id"
              columns={violationColumns}
              dataSource={selectedAttempt.violations}
              size="small"
              pagination={false}
              bordered
              className="mt-2 rounded-md"
            />
          ))}
      </Modal>
    </>
  );
}
