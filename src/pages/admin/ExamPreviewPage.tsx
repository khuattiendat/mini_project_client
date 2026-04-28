import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Alert, Badge, Button, Card, Empty, Skeleton, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { getExamApi } from "../../api/examApi";
import { getQuestionsApi } from "../../api/questionApi";
import { formatDateTime } from "./questions/utils";
import { RichContent } from "../../components/common/RichContent";

const { Title, Text } = Typography;

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];
const OPTION_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-700",
  "bg-purple-50 border-purple-200 text-purple-700",
  "bg-orange-50 border-orange-200 text-orange-700",
  "bg-teal-50 border-teal-200 text-teal-700",
  "bg-pink-50 border-pink-200 text-pink-700",
  "bg-yellow-50 border-yellow-200 text-yellow-700",
];

const PAGE_SIZE = 50;


export default function ExamPreviewPage() {
  const { examId } = useParams();
  const parsedExamId = examId ? Number.parseInt(examId, 10) : undefined;
  const normalizedExamId =
    parsedExamId !== undefined && !Number.isNaN(parsedExamId)
      ? parsedExamId
      : undefined;

  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: exam, isLoading: isExamLoading } = useSWR(
    normalizedExamId !== undefined
      ? ["exam-preview:detail", normalizedExamId]
      : null,
    ([, id]) => getExamApi(Number(id)),
  );

  const {
    data: pages,
    isLoading: isQuestionsLoading,
    isValidating,
    error,
    setSize,
  } = useSWRInfinite(
    (pageIndex, previousPage) => {
      if (normalizedExamId === undefined) return null;
      if (previousPage && !previousPage.meta.hasNextPage) return null;
      return ["exam-preview:questions", normalizedExamId, pageIndex + 1];
    },
    ([, id, page]) =>
      getQuestionsApi({ page: Number(page), limit: PAGE_SIZE, examId: Number(id) }),
    { revalidateFirstPage: false },
  );

  const questions = (pages ?? [])
    .flatMap((p) => p.items)
    .slice()
    .sort((a, b) => {
      if (a.orderIndex === b.orderIndex) return a.id - b.id;
      return a.orderIndex - b.orderIndex;
    });

  const totalItems = pages?.[0]?.meta.totalItems ?? 0;
  const hasMore = questions.length < totalItems;

  // Load next page when user is within 10 questions of the loaded end
  useEffect(() => {
    if (!hasMore || isValidating) return;
    if (currentIndex >= questions.length - 10) {
      setSize((s) => s + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions.length, hasMore, isValidating]);

  if (normalizedExamId === undefined) {
    return (
      <Alert
        type="error"
        message="Mã đề thi không hợp lệ"
        description="Vui lòng quay lại danh sách đề thi và chọn lại đề cần xem preview."
      />
    );
  }

  const currentQuestion = questions[currentIndex];

  if (error) {
    return (
      <Alert
        type="error"
        message="Lỗi tải dữ liệu"
        description="Đã xảy ra lỗi khi tải thông tin đề thi. Vui lòng thử lại sau."
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              size="small"
              className="shrink-0"
            >
              <Link to={`/admin/exams/${normalizedExamId}/questions`}>
                Quay lại
              </Link>
            </Button>

            {isExamLoading ? (
              <Skeleton.Input active style={{ width: 240 }} />
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <FileTextOutlined className="text-blue-500" />
                  <Title level={5} style={{ margin: 0 }}>
                    {exam?.title ?? `Đề thi #${normalizedExamId}`}
                  </Title>
                  <Tag color="blue">Preview</Tag>
                </div>
                <div className="mt-0.5 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ClockCircleOutlined />
                    {exam?.duration ?? 0} phút
                  </span>
                  {exam?.startDate && (
                    <span>Bắt đầu: {formatDateTime(exam.startDate)}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <QuestionCircleOutlined />
                    {totalItems} câu hỏi
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isQuestionsLoading && questions.length > 0 && (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                ← Câu trước
              </Button>
              <Text className="text-sm text-slate-500">
                {currentIndex + 1} / {questions.length}
              </Text>
              <Button
                type="primary"
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
              >
                Câu tiếp →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4">
        {/* Question Navigator Sidebar */}
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            <Card
              size="small"
              title={
                <span className="text-sm font-semibold text-slate-700">
                  Danh sách câu hỏi
                </span>
              }
              className="shadow-sm"
            >
              {isQuestionsLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} title={false} />
              ) : questions.length === 0 ? (
                <Text type="secondary" className="text-xs">
                  Chưa có câu hỏi
                </Text>
              ) : (
                <div className="grid grid-cols-5 gap-1.5">
                  {questions.map((q, idx) => {
                    const hasCorrect = q.choices.some((c) => c.isCorrect);
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-all ${idx === currentIndex
                          ? "bg-blue-600 text-white shadow"
                          : hasCorrect
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                  {hasMore && (
                    <div className="col-span-5 mt-1 text-center text-xs text-slate-400">
                      Đang tải thêm...
                    </div>
                  )}
                </div>
              )}

              {!isQuestionsLoading && questions.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" />
                    Câu đang xem
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-green-100 border border-green-300" />
                    Có đáp án đúng
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isQuestionsLoading ? (
            <Card className="shadow-sm">
              <Skeleton active paragraph={{ rows: 10 }} />
            </Card>
          ) : questions.length === 0 ? (
            <Card className="shadow-sm">
              <Empty description="Đề thi chưa có câu hỏi" />
            </Card>
          ) : currentQuestion ? (
            <div className="space-y-4">
              {/* Question Card */}
              <Card className="shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {currentIndex + 1}
                    </span>
                    <Text className="text-sm text-slate-500">
                      Câu {currentIndex + 1} / {questions.length}
                    </Text>
                  </div>
                  <Badge
                    count={`ID: ${currentQuestion.id}`}
                    style={{ backgroundColor: "#e2e8f0", color: "#64748b", fontWeight: 500 }}
                  />
                </div>

                {/* Question content */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <RichContent html={currentQuestion.content} />
                </div>
              </Card>

              {/* Choices Card */}
              <Card
                title={
                  <span className="text-sm font-semibold text-slate-600">
                    Các đáp án
                  </span>
                }
                className="shadow-sm"
              >
                <div className="space-y-3">
                  {currentQuestion.choices.map((choice, choiceIndex) => {
                    const label = OPTION_LABELS[choiceIndex] ?? `${choiceIndex + 1}`;
                    const colorClass = OPTION_COLORS[choiceIndex] ?? OPTION_COLORS[0];

                    return (
                      <div
                        key={choice.id}
                        className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${choice.isCorrect
                          ? "border-green-400 bg-green-50 shadow-sm"
                          : "border-slate-200 bg-white"
                          }`}
                      >
                        {/* Option label */}
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${choice.isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : `${colorClass} border`
                            }`}
                        >
                          {label}
                        </span>

                        {/* Choice content */}
                        <div className="flex-1 pt-0.5">
                          <RichContent html={choice.content} />
                        </div>

                        {/* Correct badge */}
                        {choice.isCorrect && (
                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircleFilled />
                            Đáp án đúng
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between">
                <Button
                  size="large"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  ← Câu trước
                </Button>

                {/* Mobile question dots */}
                <div className="flex gap-1 lg:hidden">
                  {questions.slice(
                    Math.max(0, currentIndex - 2),
                    Math.min(questions.length, currentIndex + 3),
                  ).map((_, relIdx) => {
                    const absIdx = Math.max(0, currentIndex - 2) + relIdx;
                    return (
                      <button
                        key={absIdx}
                        onClick={() => setCurrentIndex(absIdx)}
                        className={`h-2 rounded-full transition-all ${absIdx === currentIndex
                          ? "w-6 bg-blue-600"
                          : "w-2 bg-slate-300"
                          }`}
                      />
                    );
                  })}
                </div>

                <Button
                  type="primary"
                  size="large"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((i) => i + 1)}
                >
                  Câu tiếp →
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
