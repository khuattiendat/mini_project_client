import { DatePicker, Form, Input, InputNumber, Modal, Switch } from "antd";
import type { FormInstance } from "antd/es/form";
import type { Dayjs } from "dayjs";

export interface ExamFormValues {
  title: string;
  description?: string;
  duration: number;
  startDate: Dayjs;
  isPublic: boolean;
}

interface ExamFormModalProps {
  open: boolean;
  submitting: boolean;
  isEditing: boolean;
  form: FormInstance<ExamFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ExamFormModal({
  open,
  submitting,
  isEditing,
  form,
  onCancel,
  onSubmit,
}: ExamFormModalProps) {
  return (
    <Modal
      title={isEditing ? "Cập nhật đề thi" : "Tạo đề thi mới"}
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={submitting}
      okText={isEditing ? "Lưu thay đổi" : "Tạo mới"}
      cancelText="Huỷ"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề đề thi" }]}
        >
          <Input
            placeholder="Ví dụ: Kiểm tra giữa kỳ Toán 12"
            maxLength={255}
          />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea
            rows={3}
            placeholder="Mô tả ngắn cho đề thi (không bắt buộc)"
            maxLength={1000}
          />
        </Form.Item>

        <Form.Item
          label="Thời lượng (phút)"
          name="duration"
          rules={[
            { required: true, message: "Vui lòng nhập thời lượng" },
            { type: "number", min: 1, message: "Thời lượng phải lớn hơn 0" },
          ]}
        >
          <InputNumber className="w-full" min={1} placeholder="Ví dụ: 45" />
        </Form.Item>

        <Form.Item
          label="Thời điểm bắt đầu"
          name="startDate"
          rules={[
            { required: true, message: "Vui lòng chọn thời gian bắt đầu" },
          ]}
        >
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format="DD/MM/YYYY HH:mm"
            placeholder="Chọn ngày và giờ"
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          label="Công khai"
          name="isPublic"
          valuePropName="checked"
          extra="Bật để tất cả người dùng đều thấy đề thi này"
        >
          <Switch checkedChildren="Công khai" unCheckedChildren="Riêng tư" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
