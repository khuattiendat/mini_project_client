import { ArrowLeftOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  InputNumber,
  Radio,
  Select,
  Skeleton,
  Space,
  Spin,
  Tooltip,
  message,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import {
  createQuestionApi,
  getQuestionApi,
  updateQuestionApi,
} from "../../api/questionApi";
import { getApiErrorMessage } from "../../api/apiError";
import { getExamsApi } from "../../api/examApi";
import { useDebounce } from "../../hooks/useDebounce";
import CustomEditor from "../../components/common/CustomEditor";
import type {
  CreateQuestionPayload,
  QuestionChoiceItem,
  UpdateQuestionPayload,
} from "../../types/question";
import { isFormValidationError, stripHtml } from "./questions/utils";

interface ChoiceField {
  content: string;
}

interface QuestionEditorFormValues {
  examId?: number;
  content: string;
  orderIndex?: number;
  choices: ChoiceField[];
  correctChoiceIndex: number;
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const DEFAULT_CHOICE_COUNT = 4;
const MIN_CHOICES = 2;
const MAX_CHOICES = 8;

function makeEmptyChoices(count: number): ChoiceField[] {
  return Array.from({ length: count }, () => ({ content: "" }));
}

function buildChoicesFromQuestion(choices: QuestionChoiceItem[]): ChoiceField[] {
  return choices.map((c) => ({ content: c.content }));
}

function getCorrectChoiceIndex(choices: QuestionChoiceItem[]): number {
  const index = choices.findIndex((c) => c.isCorrect);
  return index >= 0 ? index : 0;
}

// Sub-component: single choice editor to avoid re-render issues
function ChoiceEditor({
  index,
  label,
  initialValue,
  onChange,
}: {
  index: number;
  label: string;
  initialValue: string;
  onChange: (content: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const valueRef = useRef(initialValue);

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="mb-1.5 text-xs font-semibold text-slate-500">
        Đáp án {label}
      </div>
      <Spin spinning={loading} size="small">
        <CustomEditor
          value={valueRef.current}
          setLoadingInit={setLoading}
          handleOnchange={(content) => {
            valueRef.current = content;
            onChange(content);
          }}
          height={160}
        />
      </Spin>
    </div>
  );
}

export default function QuestionEditorPage() {
  const navigate = useNavigate();
  const { examId, questionId } = useParams();
  const [form] = Form.useForm<QuestionEditorFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [isQuestionEditorLoading, setIsQuestionEditorLoading] = useState(true);
  const [choiceCount, setChoiceCount] = useState(DEFAULT_CHOICE_COUNT);
  const [submitting, setSubmitting] = useState(false);
  const [examSearch, setExamSearch] = useState("");

  const lockedExamId = examId ? Number.parseInt(examId, 10) : undefined;
  const normalizedLockedExamId =
    lockedExamId !== undefined && !Number.isNaN(lockedExamId) ? lockedExamId : undefined;

  const parsedQuestionId = questionId ? Number.parseInt(questionId, 10) : undefined;
  const normalizedQuestionId =
    parsedQuestionId !== undefined && !Number.isNaN(parsedQuestionId) ? parsedQuestionId : undefined;
  const isEditing = normalizedQuestionId !== undefined;

  const debouncedExamSearch = useDebounce(examSearch);

  const { data: examsData, isLoading: isExamsLoading } = useSWR(
    ["question-editor:exams", debouncedExamSearch],
    ([, search]) => getExamsApi({ page: 1, limit: 20, search: search || undefined }),
  );

  const { data: questionData, isLoading: isQuestionLoading } = useSWR(
    isEditing ? ["question-editor:question", normalizedQuestionId] : null,
    ([, id]) => getQuestionApi(Number(id)),
  );

  const examOptions = useMemo(
    () => (examsData?.items ?? []).map((exam) => ({ label: exam.title, value: exam.id })),
    [examsData],
  );

  const listPath = useMemo(() => {
    if (normalizedLockedExamId !== undefined) return `/admin/exams/${normalizedLockedExamId}/questions`;
    if (questionData?.examId !== undefined) return `/admin/exams/${questionData.examId}/questions`;
    return "/admin/questions";
  }, [normalizedLockedExamId, questionData?.examId]);

  // Init form
  useEffect(() => {
    if (!isEditing) {
      form.setFieldsValue({
        examId: normalizedLockedExamId,
        content: "",
        orderIndex: undefined,
        choices: makeEmptyChoices(DEFAULT_CHOICE_COUNT),
        correctChoiceIndex: 0,
      });
      setChoiceCount(DEFAULT_CHOICE_COUNT);
      setIsQuestionEditorLoading(false);
      return;
    }

    if (questionData) {
      const count = questionData.choices.length || DEFAULT_CHOICE_COUNT;
      setChoiceCount(count);
      form.setFieldsValue({
        examId: questionData.examId,
        content: questionData.content,
        orderIndex: questionData.orderIndex,
        choices: buildChoicesFromQuestion(questionData.choices),
        correctChoiceIndex: getCorrectChoiceIndex(questionData.choices),
      });
      setIsQuestionEditorLoading(false);
    }
  }, [form, isEditing, normalizedLockedExamId, questionData]);

  const contentValue = Form.useWatch("content", form) ?? "";
  const correctChoiceIndex = Form.useWatch("correctChoiceIndex", form) ?? 0;

  const handleAddChoice = () => {
    if (choiceCount >= MAX_CHOICES) return;
    const current = form.getFieldValue("choices") as ChoiceField[];
    form.setFieldValue("choices", [...current, { content: "" }]);
    setChoiceCount((n) => n + 1);
  };

  const handleRemoveChoice = (index: number) => {
    if (choiceCount <= MIN_CHOICES) return;
    const current = form.getFieldValue("choices") as ChoiceField[];
    const next = current.filter((_, i) => i !== index);
    form.setFieldValue("choices", next);

    // Adjust correctChoiceIndex if needed
    const currentCorrect = form.getFieldValue("correctChoiceIndex") as number;
    if (currentCorrect === index) {
      form.setFieldValue("correctChoiceIndex", 0);
    } else if (currentCorrect > index) {
      form.setFieldValue("correctChoiceIndex", currentCorrect - 1);
    }

    setChoiceCount((n) => n - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const examValue = values.examId ?? normalizedLockedExamId;

      if (examValue === undefined) {
        messageApi.error("Vui lòng chọn đề thi");
        return;
      }

      if (!stripHtml(values.content)) {
        messageApi.error("Nội dung câu hỏi không được để trống");
        return;
      }

      const choices = values.choices.map((choice, index) => ({
        content: choice.content,
        isCorrect: index === values.correctChoiceIndex,
      }));

      if (choices.some((c) => !stripHtml(c.content))) {
        messageApi.error("Vui lòng nhập đầy đủ nội dung tất cả đáp án");
        return;
      }

      const payload: CreateQuestionPayload | UpdateQuestionPayload = {
        examId: examValue,
        content: values.content,
        orderIndex: values.orderIndex,
        choices,
      };

      if (isEditing && normalizedQuestionId !== undefined) {
        await updateQuestionApi(normalizedQuestionId, payload);
        messageApi.success("Cập nhật câu hỏi thành công");
      } else {
        await createQuestionApi(payload as CreateQuestionPayload);
        messageApi.success("Tạo câu hỏi thành công");
      }

      navigate(listPath, { replace: true });
    } catch (error) {
      if (isFormValidationError(error)) return;
      messageApi.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const isPageLoading = isEditing && (isQuestionLoading || isQuestionEditorLoading);

  return (
    <>
      {contextHolder}
      <Card className="bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(listPath)} className="mb-3">
              Quay lại
            </Button>
            <h1 className="m-0 text-2xl font-semibold text-slate-900">
              {isEditing ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {normalizedLockedExamId !== undefined
                ? `Câu hỏi thuộc đề thi #${normalizedLockedExamId}`
                : "Chọn đề thi và nhập nội dung câu hỏi, sau đó xác định đáp án đúng"}
            </p>
          </div>
        </div>

        {isPageLoading ? (
          <div className="space-y-6">
            <Skeleton active paragraph={{ rows: 2 }} />
            <Skeleton active paragraph={{ rows: 6 }} />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton active paragraph={{ rows: 4 }} />
              <Skeleton active paragraph={{ rows: 4 }} />
              <Skeleton active paragraph={{ rows: 4 }} />
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          </div>
        ) : (
          <Form<QuestionEditorFormValues> form={form} layout="vertical" requiredMark={false}>
            {/* Exam select */}
            <Form.Item
              label="Đề thi"
              name="examId"
              rules={[{ required: true, message: "Vui lòng chọn đề thi" }]}
            >
              <Select
                disabled={normalizedLockedExamId !== undefined}
                placeholder="Chọn đề thi"
                options={examOptions}
                showSearch
                filterOption={false}
                onSearch={setExamSearch}
                loading={isExamsLoading}
                notFoundContent={isExamsLoading ? "Đang tìm..." : "Không tìm thấy đề thi"}
              />
            </Form.Item>

            {/* Question content */}
            <Form.Item
              label="Nội dung câu hỏi"
              name="content"
              rules={[{ required: true, message: "Vui lòng nhập nội dung câu hỏi" }]}
            >
              <div className="rounded-md border border-slate-200 p-3">
                <CustomEditor
                  value={contentValue}
                  setLoadingInit={setIsQuestionEditorLoading}
                  handleOnchange={(content) => form.setFieldValue("content", content)}
                  height={280}
                />
              </div>
            </Form.Item>

            {/* Order index */}
            <Form.Item
              label="Thứ tự câu hỏi (order_index)"
              name="orderIndex"
              rules={[{ type: "number", min: 1, message: "Phải lớn hơn hoặc bằng 1" }]}
              extra="Để trống để hệ thống tự gán thứ tự tiếp theo"
            >
              <InputNumber min={1} className="w-40" />
            </Form.Item>

            {/* Choices section */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-700">
                  Các đáp án
                </span>
                <span className="ml-2 text-xs text-slate-400">
                  ({choiceCount} đáp án · tối thiểu {MIN_CHOICES}, tối đa {MAX_CHOICES})
                </span>
              </div>
              <Tooltip title={choiceCount >= MAX_CHOICES ? `Tối đa ${MAX_CHOICES} đáp án` : ""}>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddChoice}
                  disabled={choiceCount >= MAX_CHOICES}
                >
                  Thêm đáp án
                </Button>
              </Tooltip>
            </div>

            {/* Correct answer radio */}
            <Form.Item
              label="Đáp án đúng"
              name="correctChoiceIndex"
              rules={[{ required: true }]}
              className="mb-4"
            >
              <Radio.Group>
                <Space wrap>
                  {Array.from({ length: choiceCount }, (_, i) => (
                    <Radio key={i} value={i}>
                      Đáp án {OPTION_LABELS[i] ?? i + 1}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* Choice editors */}
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: choiceCount }, (_, index) => {
                const label = OPTION_LABELS[index] ?? `${index + 1}`;
                const isCorrect = correctChoiceIndex === index;

                return (
                  <div
                    key={index}
                    className={`relative rounded-lg border-2 p-1 transition-colors ${
                      isCorrect ? "border-green-400 bg-green-50/40" : "border-transparent"
                    }`}
                  >
                    {isCorrect && (
                      <span className="absolute right-2 top-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        ✓ Đúng
                      </span>
                    )}
                    <Form.Item
                      name={["choices", index, "content"]}
                      rules={[{ required: true, message: `Vui lòng nhập đáp án ${label}` }]}
                      className="mb-0"
                    >
                      <ChoiceEditor
                        index={index}
                        label={label}
                        initialValue={
                          (form.getFieldValue(["choices", index, "content"]) as string | undefined) ?? ""
                        }
                        onChange={(content) => {
                          form.setFieldValue(["choices", index, "content"], content);
                        }}
                      />
                    </Form.Item>

                    {choiceCount > MIN_CHOICES && (
                      <div className="mt-1 flex justify-end">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => handleRemoveChoice(index)}
                        >
                          Xoá đáp án {label}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">
              <Button onClick={() => navigate(listPath)}>Huỷ</Button>
              <Button
                type="primary"
                loading={submitting}
                onClick={() => void handleSubmit()}
              >
                {isEditing ? "Lưu thay đổi" : "Tạo mới"}
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </>
  );
}
