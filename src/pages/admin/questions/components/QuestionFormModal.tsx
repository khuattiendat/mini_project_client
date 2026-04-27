import { Form, Input, Modal, Select, Spin } from "antd";
import type { FormInstance } from "antd/es/form";
import { useEffect, useMemo, useState } from "react";
import CustomEditor from "../../../../components/common/CustomEditor";
import { stripHtml } from "../utils";

export interface QuestionFormValues {
  examId: number;
  content: string;
}

interface ExamOption {
  label: string;
  value: number;
}

interface QuestionFormModalProps {
  open: boolean;
  submitting: boolean;
  isEditing: boolean;
  form: FormInstance<QuestionFormValues>;
  examOptions: ExamOption[];
  onCancel: () => void;
  onSubmit: () => void;
}

export function QuestionFormModal({
  open,
  submitting,
  isEditing,
  form,
  examOptions,
  onCancel,
  onSubmit,
}: QuestionFormModalProps) {
  const [isEditorLoading, setIsEditorLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setIsEditorLoading(true);
    }
  }, [open]);

  const editorValue = Form.useWatch("content", form) ?? "";

  const contentHelp = useMemo(() => {
    const plainText = stripHtml(editorValue);

    if (!plainText) {
      return "Nội dung câu hỏi không được để trống";
    }

    return `Đã nhập ${plainText.length} ký tự nội dung`;
  }, [editorValue]);

  const hasContent = stripHtml(editorValue).length > 0;

  return (
    <Modal
      title={isEditing ? "Cập nhật câu hỏi" : "Tạo câu hỏi mới"}
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={submitting}
      okText={isEditing ? "Lưu thay đổi" : "Tạo mới"}
      cancelText="Huỷ"
      width={900}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="Đề thi"
          name="examId"
          rules={[{ required: true, message: "Vui lòng chọn đề thi" }]}
        >
          <Select
            options={examOptions}
            showSearch
            optionFilterProp="label"
            placeholder="Chọn đề thi"
          />
        </Form.Item>

        <Form.Item
          label="Nội dung câu hỏi"
          required
          validateStatus={hasContent ? undefined : "error"}
          help={contentHelp}
        >
          <Spin spinning={isEditorLoading}>
            <CustomEditor
              value={editorValue}
              setLoadingInit={setIsEditorLoading}
              handleOnchange={(content) => {
                form.setFieldValue("content", content);
              }}
              height={280}
            />
          </Spin>
        </Form.Item>

        <Form.Item name="content" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
