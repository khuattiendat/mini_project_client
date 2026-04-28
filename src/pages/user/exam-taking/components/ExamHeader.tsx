import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { Button, Tag, Tooltip, Typography } from 'antd';

const { Title, Text } = Typography;

interface Props {
  title: string;
  timeLeft: number;
  answeredCount: number;
  totalQuestions: number;
  currentIndex: number;
  online: boolean;
  onGoBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ExamHeader({
  title,
  timeLeft,
  answeredCount,
  totalQuestions,
  currentIndex,
  online,
  onGoBack,
  onPrev,
  onNext,
}: Props) {
  const isWarning = timeLeft < 300 && timeLeft > 0;
  const isDanger = timeLeft < 60;

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Left: back + exam info */}
        <div className="flex items-center gap-3">


          <div>
            <div className="flex items-center gap-2">
              <FileTextOutlined className="text-blue-500" />
              <Title level={5} style={{ margin: 0 }}>
                {title}
              </Title>
              <Tag color="processing">Đang làm bài</Tag>
            </div>

            <div className="mt-0.5 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ClockCircleOutlined />
                <Text type={isDanger ? 'danger' : undefined} strong={isWarning}>
                  {formatTime(timeLeft)}
                </Text>
                {isWarning && (
                  <Text type="danger" className="text-xs">
                    (Sắp hết giờ!)
                  </Text>
                )}
              </span>

              <span className="flex items-center gap-1">
                <CheckCircleOutlined />
                {answeredCount}/{totalQuestions} câu đã trả lời
              </span>

              <span className="flex items-center gap-1">
                <QuestionCircleOutlined />
                {totalQuestions} câu hỏi
              </span>

              <Tooltip title={online ? 'Đã kết nối' : 'Mất kết nối — kiểm tra lại mạng'}>
                <span
                  className={`flex items-center gap-1 font-medium ${online ? 'text-green-600' : 'text-red-500'
                    }`}
                >
                  {online ? (
                    <WifiOutlined />
                  ) : (
                    <DisconnectOutlined className="animate-pulse" />
                  )}
                  {online ? 'Đã kết nối' : 'Mất kết nối'}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {totalQuestions > 0 && (
          <div className="hidden items-center gap-2 sm:flex">
            <Button disabled={currentIndex === 0} onClick={onPrev}>
              ← Câu trước
            </Button>
            <Text className="text-sm text-slate-500">
              {currentIndex + 1} / {totalQuestions}
            </Text>
            <Button type="primary" disabled={currentIndex === totalQuestions - 1} onClick={onNext}>
              Câu tiếp →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
