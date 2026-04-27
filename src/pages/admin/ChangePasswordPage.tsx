import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../api/apiError";
import { changePasswordApi } from "../../api/authApi";
import { useAuth } from "../../auth/useAuth";

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [form] = Form.useForm<ChangePasswordFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      await changePasswordApi(values.currentPassword, values.newPassword);
      messageApi.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");

      // Force re-login after password change
      setTimeout(() => {
        void logout().then(() => navigate("/login", { replace: true }));
      }, 1500);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="mx-auto max-w-lg">
        <Card className="shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <LockOutlined className="text-lg text-blue-600" />
            </div>
            <div>
              <h2 className="m-0 text-base font-semibold text-slate-900">
                Đổi mật khẩu
              </h2>
              <p className="m-0 text-xs text-slate-500">
                Sau khi đổi, bạn sẽ được đăng xuất khỏi tất cả thiết bị
              </p>
            </div>
          </div>

          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item
              label="Mật khẩu hiện tại"
              name="currentPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp"),
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button onClick={() => form.resetFields()}>Đặt lại</Button>
              <Button
                type="primary"
                loading={submitting}
                onClick={() => void handleSubmit()}
              >
                Đổi mật khẩu
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </>
  );
}
