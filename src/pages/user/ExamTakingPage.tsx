import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Empty, Result, Skeleton } from 'antd';
import { useExamTaking } from './exam-taking/hooks/useExamTaking';
import { ExamHeader } from './exam-taking/components/ExamHeader';
import { QuestionNavigator } from './exam-taking/components/QuestionNavigator';
import { QuestionCard } from './exam-taking/components/QuestionCard';

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="w-full max-w-lg">
          <Alert
            type="error"
            description={error}
            showIcon
            action={
              <Button type="primary" onClick={() => navigate('/user')}>
                Quay lại
              </Button>
            }
          />
        </div>
      </div>
    );
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
        onGoBack={handleGoBack}
        onPrev={() => setCurrentIndex((i) => i - 1)}
        onNext={() => setCurrentIndex((i) => i + 1)}
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
