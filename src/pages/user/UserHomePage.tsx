import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
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

const EXAM_RULES = [
  {
    icon: <StopOutlined className="text-red-500" />,
    text: "Không được chuyển tab hoặc rời khỏi trang thi trong suốt quá trình làm bài.",
  },
  {
    icon: <StopOutlined className="text-red-500" />,
    text: "Không được sử dụng nhiều thiết bị để làm cùng một bài thi.",
  },
  {
    icon: <StopOutlined className="text-red-500" />,
    text: "Không được sao chép, chụp màn hình hoặc chia sẻ nội dung đề thi.",
  },
  {
    icon: <StopOutlined className="text-red-500" />,
    text: "Không được sử dụng tài liệu hoặc công cụ hỗ trợ bên ngoài.",
  },
  {
    icon: <SafetyCertificateOutlined className="text-blue-500" />,
    text: "Bài thi sẽ tự động nộp khi hết thời gian.",
  },
  {
    icon: <SafetyCertificateOutlined className="text-blue-500" />,
    text: "Mọi hành vi vi phạm sẽ bị ghi lại và bài thi sẽ bị khóa ngay lập tức.",
  },
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
        width={520}
      >
        <div className="space-y-3 py-2">
          <Text className="text-slate-600">
            Bằng cách nhấn <strong>"Bắt đầu thi"</strong>, bạn xác nhận đã đọc
            và đồng ý tuân thủ toàn bộ quy chế dưới đây:
          </Text>
          <ul className="mt-3 space-y-2 pl-0" style={{ listStyle: "none" }}>
            {EXAM_RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 shrink-0">{rule.icon}</span>
                <span>{rule.text}</span>
              </li>
            ))}
          </ul>
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
