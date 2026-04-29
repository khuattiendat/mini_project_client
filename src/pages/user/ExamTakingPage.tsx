import { useNavigate } from 'react-router-dom';
import { Button, Card, Empty, Result, Skeleton, Alert } from 'antd';
import {
  HomeOutlined,
  LockOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useExamTaking } from './exam-taking/hooks/useExamTaking';
import { ExamHeader } from './exam-taking/components/ExamHeader';
import { QuestionNavigator } from './exam-taking/components/QuestionNavigator';
import { QuestionCard } from './exam-taking/components/QuestionCard';

// Phân loại lỗi để hiển thị UI phù hợp
function classifyError(msg: string): 'violation' | 'terminated' | 'submitted' | 'general' {
  if (msg.includes('vi phạm') || msg.includes('khóa')) return 'violation';
  if (msg.includes('kết thúc')) return 'terminated';
  if (msg.includes('đã được nộp')) return 'submitted';
  return 'general';
}

function ExamErrorScreen({ error }: { error: string }) {
  const navigate = useNavigate();
  const type = classifyError(error);

  if (type === 'violation') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100 px-4">
        {/* Icon vùng */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
          <LockOutlined className="text-5xl text-red-500" />
        </div>

        {/* Nội dung */}
        <div className="w-full max-w-md text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Bài thi đã bị khóa</h2>
          <p className="mb-1 text-slate-500">{error}</p>
          <p className="text-sm text-slate-400">
            Mọi hành vi vi phạm đã được ghi lại trong hệ thống.
          </p>
        </div>

        {/* Card thông tin liên hệ */}
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <WarningOutlined />
            <span>Cần hỗ trợ?</span>
          </div>
          <p className="text-red-600">
            Vui lòng liên hệ giám thị hoặc quản trị viên để được giải quyết.
            Không tự ý làm mới trang hoặc thử lại.
          </p>
        </div>

        <Button
          size="large"
          icon={<HomeOutlined />}
          onClick={() => navigate('/user')}
        >
          Về trang chủ
        </Button>
      </div>
    );
  }

  if (type === 'terminated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <Result
          status="warning"
          icon={<StopOutlined className="text-orange-400" />}
          title="Bài thi đã bị kết thúc"
          subTitle={error}
          extra={
            <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/user')}>
              Về trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  if (type === 'submitted') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <Result
          status="info"
          title="Bài thi đã được nộp"
          subTitle="Bạn đã hoàn thành bài thi này. Không thể làm lại."
          extra={
            <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/user')}>
              Về trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  // Lỗi kỹ thuật thông thường
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <Result
          status="error"
          title="Không thể tải bài thi"
          subTitle={error}
          extra={[
            <Button
              key="retry"
              type="primary"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>,
            <Button key="home" icon={<HomeOutlined />} onClick={() => navigate('/user')}>
              Về trang chủ
            </Button>,
          ]}
        />
      </div>
    </div>
  );
}

export default function ExamTakingPage() {
  const navigate = useNavigate();
  const {
    loading,
    submitting,
    error,
    detail,
    answers,
    timeLeft,
    result,
    online,
    currentIndex,
    pendingOfflineSubmit,
    isFullscreen,
    enterFullscreen,
    setCurrentIndex,
    handleSubmit,
    handleGoBack,
    setAnswer,
    answeredCount,
    totalQuestions,
    currentQuestion,
  } = useExamTaking();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Card className="w-full max-w-lg shadow-sm">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  if (error) {
    return <ExamErrorScreen error={error} />;
  }

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Result
          status={result.score >= 50 ? 'success' : 'warning'}
          title={`Điểm của bạn: ${result.score}/100`}
          subTitle={`Trả lời đúng ${result.correct}/${result.total} câu`}
          extra={
            <Button type="primary" onClick={() => navigate('/user')}>
              Về danh sách đề thi
            </Button>
          }
        />
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <ExamHeader
        title={detail.exam.title}
        timeLeft={timeLeft}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        currentIndex={currentIndex}
        online={online}
        isFullscreen={isFullscreen}
        onGoBack={handleGoBack}
        onPrev={() => setCurrentIndex((i) => i - 1)}
        onNext={() => setCurrentIndex((i) => i + 1)}
        onEnterFullscreen={enterFullscreen}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4">
        {/* Sidebar */}
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            <QuestionNavigator
              questions={detail.questions}
              answers={answers}
              currentIndex={currentIndex}
              submitting={submitting}
              answeredCount={answeredCount}
              onSelect={setCurrentIndex}
              onSubmit={() => handleSubmit(false)}
            />
          </div>
        </div>

        {/* Main */}
        <div className="flex-1">
          {/* Banner pending offline submit */}
          {pendingOfflineSubmit && (
            <Alert
              type="warning"
              showIcon
              className="mb-3"
              message="Đang chờ nộp bài"
              description={
                online
                  ? "Đang nộp bài thi của bạn..."
                  : "Mất kết nối mạng — bài làm đã được lưu lại. Hệ thống sẽ tự nộp khi có kết nối trở lại."
              }
            />
          )}

          {totalQuestions === 0 ? (
            <Card className="shadow-sm">
              <Empty description="Đề thi chưa có câu hỏi" />
            </Card>
          ) : currentQuestion ? (
            <QuestionCard
              question={currentQuestion}
              questionIndex={currentIndex}
              totalQuestions={totalQuestions}
              selectedChoiceId={answers[currentQuestion.id]}
              onAnswer={(choiceId) => setAnswer(currentQuestion.id, choiceId)}
              onPrev={() => setCurrentIndex((i) => i - 1)}
              onNext={() => setCurrentIndex((i) => i + 1)}
              onSubmit={() => handleSubmit(false)}
              submitting={submitting}
              answeredCount={answeredCount}
              allQuestions={detail.questions}
              currentIndex={currentIndex}
              onSelectIndex={setCurrentIndex}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
