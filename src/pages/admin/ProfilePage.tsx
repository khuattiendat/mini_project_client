import { UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Form, Input, Skeleton, message } from "antd";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../api/apiError";
import { updateProfileApi } from "../../api/authApi";
import { useAuth } from "../../auth/useAuth";

interface ProfileFormValues {
  fullName: string;
}

export default function ProfilePage() {
  const { user, fetchProfile } = useAuth();
  const [form] = Form.useForm<ProfileFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({ fullName: user.fullName });
    }
  }, [form, user]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      await updateProfileApi(values.fullName);
      await fetchProfile();
      messageApi.success("Cập nhật hồ sơ thành công");
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
          <div className="mb-6 flex flex-col items-center gap-3 border-b border-slate-100 pb-6">
            <Avatar
              size={72}
              icon={<UserOutlined />}
              style={{ background: "#534AB7", fontSize: 32 }}
            />
            {user ? (
              <>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {user.fullName}
                  </div>
                  <div className="text-sm text-slate-500">@{user.userName}</div>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold uppercase text-blue-700">
                  {user.role}
                </span>
              </>
            ) : (
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: 160 }} />
            )}
          </div>

          <h2 className="mb-4 text-base font-semibold text-slate-700">
            Thông tin cá nhân
          </h2>

          {!user ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : (
            <Form form={form} layout="vertical" requiredMark={false}>
              <Form.Item label="Tên đăng nhập">
                <Input value={user.userName} disabled />
              </Form.Item>

              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[
                  { required: true, message: "Vui lòng nhập họ và tên" },
                  { max: 255, message: "Tối đa 255 ký tự" },
                ]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <div className="flex justify-end">
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={() => void handleSubmit()}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
    </>
  );
}
