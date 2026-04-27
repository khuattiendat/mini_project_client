import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Skeleton, Space, Tag, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { getAvailableExamsApi } from "../../api/examApi";
import { formatDateTime } from "../../lib/utils";

export default function UserHomePage() {
  const navigate = useNavigate();
  const { data: exams, isLoading, mutate } = useSWR(
    "user:available-exams",
    getAvailableExamsApi,
    { revalidateOnFocus: false },
  );

  const handleStartExam = (examId: number) => {
    // TODO: Navigate to exam taking page
    console.log("Start exam:", examId);
    // navigate(`/user/exam/${examId}`);
  };

  return (
    <div className="space-y-6">
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
