import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  HourglassOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { getAvailableExamsApi } from "../../api/examApi";
import { formatDateTime } from "../../lib/utils";
import { startAttemptApi } from "../../api/attemptApi";
import { getApiErrorMessage } from "../../api/apiError";

const { Text } = Typography;

// Hành vi bị khóa bài ngay lập tức
const LOCK_RULES = [
  "Mở DevTools (F12, Ctrl+Shift+I/J/C)",
  "Chụp màn hình (phím PrintScreen)",
  "Phát hiện công cụ tự động hóa (Puppeteer, Selenium, headless browser...)",
  "Đăng nhập từ thiết bị khác trong khi đang làm bài",
];

// Hành vi có thời gian ân hạn
const GRACE_RULES = [
  { label: "Chuyển tab hoặc thu nhỏ trình duyệt", grace: "3 giây để quay lại" },
  { label: "Chuyển sang ứng dụng khác (Alt+Tab)", grace: "5 giây để quay lại" },
];

// Hành vi bị cảnh báo (tối đa 3 lần, lần thứ 4 bị khóa)
const WARN_RULES = [
  "Sao chép (Ctrl+C), dán (Ctrl+V) hoặc cắt (Ctrl+X) — cả phím tắt lẫn chuột phải",
];

// Thông tin hệ thống
const SYSTEM_RULES = [
  "Bài thi yêu cầu chế độ toàn màn hình trong suốt quá trình làm bài.",
  "Bài thi sẽ tự động nộp khi hết thời gian, kể cả khi mất kết nối mạng.",
  "Mọi hành vi vi phạm đều được ghi lại — kể cả vi phạm chưa dẫn đến khóa bài.",
  "Bài thi bị khóa sẽ không thể tiếp tục — vui lòng liên hệ giám thị.",
  "Giám thị có thể chủ động kết thúc bài thi của bạn bất kỳ lúc nào.",
];

export default function UserHomePage() {
  const navigate = useNavigate();
  const [pendingExamId, setPendingExamId] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  const {
    data: exams,
    isLoading,
    mutate,
  } = useSWR("user:available-exams", getAvailableExamsApi, {
    revalidateOnFocus: true,
  });

  const handleStartExam = (examId: number) => {
    setPendingExamId(examId);
  };

  const handleConfirmStart = async () => {
    if (!pendingExamId) return;
    setStarting(true);
    try {
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
      }
      await startAttemptApi({ examId: pendingExamId, device_id: deviceId });
      setPendingExamId(null);
      navigate(`/user/exam?examId=${pendingExamId}`);
    } catch (error) {
      const msg = getApiErrorMessage(error);
      message.error(msg || "Không thể bắt đầu làm bài. Vui lòng thử lại.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Exam rules modal */}
      <Modal
        open={pendingExamId !== null}
        onCancel={() => setPendingExamId(null)}
        onOk={handleConfirmStart}
        okText="Tôi đã hiểu, bắt đầu thi"
        cancelText="Hủy"
        okButtonProps={{ loading: starting, type: "primary" }}
        title={
          <div className="flex items-center gap-2 text-orange-500">
            <WarningOutlined />
            <span>Quy chế thi — Vui lòng đọc trước khi bắt đầu</span>
          </div>
        }
        width={560}
      >
        <div className="space-y-4 py-2">
          <Text className="text-slate-600">
            Bằng cách nhấn <strong>"Tôi đã hiểu, bắt đầu thi"</strong>, bạn xác nhận
            đã đọc và đồng ý tuân thủ toàn bộ quy chế dưới đây.
          </Text>

          {/* Hành vi bị khóa ngay */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 font-semibold text-red-600">
              <StopOutlined />
              <span>Bị khóa bài ngay lập tức nếu:</span>
            </div>
            <ul className="space-y-1.5 pl-0" style={{ listStyle: "none" }}>
              {LOCK_RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hành vi có grace period */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 font-semibold text-yellow-700">
              <HourglassOutlined />
              <span>Có thời gian ân hạn để quay lại — quá hạn sẽ bị khóa:</span>
            </div>
            <ul className="space-y-1.5 pl-0" style={{ listStyle: "none" }}>
              {GRACE_RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-yellow-800">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
                  <span>
                    {rule.label}{" "}
                    <span className="font-medium text-yellow-700">({rule.grace})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hành vi bị cảnh báo */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 font-semibold text-orange-600">
              <ExclamationCircleOutlined />
              <span>Cảnh báo (vi phạm 3 lần sẽ bị khóa bài):</span>
            </div>
            <ul className="space-y-1.5 pl-0" style={{ listStyle: "none" }}>
              {WARN_RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Thông tin hệ thống */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 font-semibold text-blue-600">
              <SafetyCertificateOutlined />
              <span>Thông tin hệ thống:</span>
            </div>
            <ul className="space-y-1.5 pl-0" style={{ listStyle: "none" }}>
              {SYSTEM_RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-900">
            Đề thi có thể làm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách các đề thi đã mở, bạn có thể bắt đầu làm bài
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

      {/* Exams list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      ) : !exams || exams.length === 0 ? (
        <Card>
          <Empty description="Chưa có đề thi nào khả dụng" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <Card
              key={exam.id}
              className="transition-shadow hover:shadow-md"
              styles={{
                body: { padding: "20px" },
              }}
            >
              <div className="flex flex-col gap-3">
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <FileTextOutlined className="mt-1 text-lg text-blue-500" />
                    <div>
                      <h3 className="m-0 text-base font-semibold text-slate-900">
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Tag color="green">Khả dụng</Tag>
                </div>

                {/* Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  <Space size={4}>
                    <ClockCircleOutlined />
                    <span>{exam.duration} phút</span>
                  </Space>
                  <Space size={4}>
                    <CalendarOutlined />
                    <span>Mở: {formatDateTime(exam.startDate)}</span>
                  </Space>
                </div>

                {/* Action */}
                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStartExam(exam.id)}
                  >
                    Thi ngay
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
