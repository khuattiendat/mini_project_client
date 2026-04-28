import { Badge, Button, Card, Radio, Typography } from 'antd';
import { RichContent } from '../../../../components/common/RichContent';
import { OPTION_COLORS, OPTION_LABELS } from '../constants';

const { Text } = Typography;

interface Choice {
  id: number;
  content: string;
}

interface Question {
  id: number;
  content: string;
  choices: Choice[];
}

interface Props {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedChoiceId: number | undefined;
  onAnswer: (choiceId: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
  answeredCount: number;
  // mobile dots
  allQuestions: { id: number }[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedChoiceId,
  onAnswer,
  onPrev,
  onNext,
  onSubmit,
  submitting,
  answeredCount,
  allQuestions,
  currentIndex,
  onSelectIndex,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Question content */}
      <Card className="shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {questionIndex + 1}
            </span>
            <Text className="text-sm text-slate-500">
              Câu {questionIndex + 1} / {totalQuestions}
            </Text>
          </div>
          <Badge
            count={selectedChoiceId ? 'Đã trả lời' : 'Chưa trả lời'}
            style={{
              backgroundColor: selectedChoiceId ? '#52c41a' : '#d9d9d9',
              color: selectedChoiceId ? '#fff' : '#595959',
              fontWeight: 500,
            }}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <RichContent html={question.content} />
        </div>
      </Card>

      {/* Choices */}
      <Card
        title={<span className="text-sm font-semibold text-slate-600">Chọn đáp án</span>}
        className="shadow-sm"
      >
        <Radio.Group
          value={selectedChoiceId ?? null}
          onChange={(e) => onAnswer(e.target.value)}
          className="w-full"
        >
          <div className="space-y-3">
            {question.choices.map((choice, idx) => {
              const label = OPTION_LABELS[idx] ?? `${idx + 1}`;
              const colorClass = OPTION_COLORS[idx] ?? OPTION_COLORS[0];
              const isSelected = selectedChoiceId === choice.id;

              return (
                <Radio key={choice.id} value={choice.id} className="w-full">
                  <div
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                        isSelected ? 'border-blue-500 bg-blue-500 text-white' : `${colorClass} border`
                      }`}
                    >
                      {label}
                    </span>
                    <div className="flex-1 pt-0.5">
                      <RichContent html={choice.content} />
                    </div>
                  </div>
                </Radio>
              );
            })}
          </div>
        </Radio.Group>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button size="large" disabled={questionIndex === 0} onClick={onPrev}>
          ← Câu trước
        </Button>

        {/* Mobile dots */}
        <div className="flex gap-1 lg:hidden">
          {allQuestions
            .slice(Math.max(0, currentIndex - 2), Math.min(totalQuestions, currentIndex + 3))
            .map((_, relIdx) => {
              const absIdx = Math.max(0, currentIndex - 2) + relIdx;
              return (
                <button
                  key={absIdx}
                  onClick={() => onSelectIndex(absIdx)}
                  className={`h-2 rounded-full transition-all ${
                    absIdx === currentIndex ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'
                  }`}
                />
              );
            })}
        </div>

        <Button
          type="primary"
          size="large"
          disabled={questionIndex === totalQuestions - 1}
          onClick={onNext}
        >
          Câu tiếp →
        </Button>
      </div>

      {/* Mobile submit */}
      <div className="lg:hidden">
        <Button type="primary" size="large" block loading={submitting} onClick={onSubmit}>
          Nộp bài ({answeredCount}/{totalQuestions})
        </Button>
        {answeredCount === 0 && (
          <Text type="secondary" className="mt-2 block text-center text-xs">
            Vui lòng trả lời ít nhất 1 câu
          </Text>
        )}
      </div>
    </div>
  );
}
