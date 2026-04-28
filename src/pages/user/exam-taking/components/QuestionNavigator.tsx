import { Button, Card, Typography } from 'antd';

const { Text } = Typography;

interface Question {
  id: number;
}

interface Props {
  questions: Question[];
  answers: Record<number, number>;
  currentIndex: number;
  submitting: boolean;
  answeredCount: number;
  onSelect: (index: number) => void;
  onSubmit: () => void;
}

export function QuestionNavigator({
  questions,
  answers,
  currentIndex,
  submitting,
  answeredCount,
  onSelect,
  onSubmit,
}: Props) {
  const total = questions.length;

  return (
    <Card
      size="small"
      title={<span className="text-sm font-semibold text-slate-700">Danh sách câu hỏi</span>}
      className="shadow-sm"
    >
      {total === 0 ? (
        <Text type="secondary" className="text-xs">
          Chưa có câu hỏi
        </Text>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            return (
              <button
                key={q.id}
                onClick={() => onSelect(idx)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-all ${
                  idx === currentIndex
                    ? 'bg-blue-600 text-white shadow'
                    : isAnswered
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" />
            Câu đang xem
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-green-300 bg-green-100" />
            Đã trả lời
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-slate-100" />
            Chưa trả lời
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <Button type="primary" size="large" block loading={submitting} onClick={onSubmit}>
          Nộp bài ({answeredCount}/{total})
        </Button>
        {answeredCount === 0 && (
          <Text type="secondary" className="mt-2 block text-center text-xs">
            Vui lòng trả lời ít nhất 1 câu
          </Text>
        )}
      </div>
    </Card>
  );
}
