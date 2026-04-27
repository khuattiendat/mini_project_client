import { Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import { STATUS_FORM_OPTIONS } from "../constants";

export interface UserFormValues {
  fullName: string;
  userName: string;
  password?: string;
  status: "active" | "inactive";
}

interface UserFormModalProps {
  open: boolean;
  submitting: boolean;
  isEditing: boolean;
  form: FormInstance<UserFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
}

export function UserFormModal({
  open,
  submitting,
  isEditing,
  form,
  onCancel,
  onSubmit,
}: UserFormModalProps) {
  return (
    <Modal
      title={isEditing ? "Cập nhật người dùng" : "Tạo người dùng mới"}
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
          label="Họ và tên"
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
        >
          <Input placeholder="Ví dụ: Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          label="Tên đăng nhập"
          name="userName"
          rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
        >
          <Input placeholder="Ví dụ: nguyenvana" disabled={isEditing} />
        </Form.Item>

        <Form.Item
          label={isEditing ? "Mật khẩu mới (không bắt buộc)" : "Mật khẩu"}
          name="password"
          rules={
            isEditing
              ? [{ min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }]
              : [
                  { required: true, message: "Vui lòng nhập mật khẩu" },
                  { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                ]
          }
        >
          <Input.Password placeholder="Tối thiểu 6 ký tự" />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          initialValue="active"
        >
          <Select options={STATUS_FORM_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
