import {
  LockOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../api/apiError";
import { useAuth } from "../../auth/useAuth";
import type { LoginPayload } from "../../types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const onFinish = async (values: LoginPayload) => {
    try {
      const user = await login(values);
      navigate(user.role === "admin" ? "/admin" : "/user", { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0] p-8 font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-[960px] min-h-[580px] grid grid-cols-2 rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)]">

        {/* ───── Left panel ───── */}
        <div className="relative bg-[#0f1117] text-white p-12 flex flex-col justify-between overflow-hidden">

          {/* Glow top-right */}
          <div className="absolute -top-20 -right-16 w-[280px] h-[280px] rounded-full pointer-events-none
            bg-[radial-gradient(circle,rgba(83,74,183,0.4)_0%,transparent_70%)]" />

          {/* Glow bottom-left */}
          <div className="absolute -bottom-10 -left-10 w-[200px] h-[200px] rounded-full pointer-events-none
            bg-[radial-gradient(circle,rgba(29,158,117,0.28)_0%,transparent_70%)]" />

          {/* Main content */}
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[rgba(83,74,183,0.15)] text-[#AFA9EC]
              text-[11px] font-medium px-3 py-1 rounded-full mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#AFA9EC] inline-block" />
              Hệ thống mới 2025
            </div>

            <h1 className="font-['DM_Serif_Display',serif] text-[38px] leading-[1.2] font-normal text-white m-0 mb-5">
              Quản trị
              <br />
              trường học
              <br />
              <em className="text-[#AFA9EC] italic">thông minh</em>
            </h1>

            <p className="text-sm leading-[1.75] text-[#9ca3af] font-light max-w-[280px] m-0">
              Nền tảng giáo dục hiện đại với phân quyền linh hoạt cho Admin và người dùng.
            </p>
          </div>

          {/* Footer avatars */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex">
              {[
                { initials: "AT", bg: "#534AB7", color: "#CECBF6" },
                { initials: "ML", bg: "#0F6E56", color: "#9FE1CB" },
                { initials: "PH", bg: "#993C1D", color: "#F5C4B3" },
              ].map((a, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center
                    text-[11px] font-medium border-2 border-[#0f1117] relative"
                  style={{
                    background: a.bg,
                    color: a.color,
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex: 3 - i,
                  }}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6b7280] font-light m-0">
              <span className="text-[#d1d5db]">2,400+</span> giáo viên đang dùng
            </p>
          </div>
        </div>

        {/* ───── Right panel ───── */}
        <div className="bg-white flex items-center justify-center p-12">
          <div className="w-full max-w-[340px]">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#9ca3af] mb-3">
              Chào mừng trở lại
            </p>

            <h2 className="font-['DM_Serif_Display',serif] text-[30px] font-normal text-[#111827] m-0 mb-1.5">
              Đăng nhập
            </h2>

            <p className="text-[13.5px] text-[#6b7280] font-light mb-8 leading-[1.6]">
              Nhập tài khoản để truy cập đúng giao diện theo vai trò của bạn
            </p>

            <Form<LoginPayload> layout="vertical" onFinish={onFinish}>
              <Form.Item
                label={
                  <span className="text-xs font-medium text-[#6b7280] tracking-[0.02em]">
                    Tên đăng nhập
                  </span>
                }
                name="userName"
                rules={[{ required: true, message: "Nhập tên đăng nhập" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="Nhập tên đăng nhập"
                  size="large"
                  style={{ height: 44, borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-medium text-[#6b7280] tracking-[0.02em]">
                    Mật khẩu
                  </span>
                }
                name="password"
                rules={[{ required: true, min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="••••••••"
                  size="large"
                  style={{ height: 44, borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item className="!mb-4">
                <Button
                  htmlType="submit"
                  type="primary"
                  block
                  loading={isLoading}
                  size="large"
                  icon={!isLoading ? <ArrowRightOutlined /> : undefined}
                  style={{
                    height: 46,
                    borderRadius: 10,
                    background: "#0f1117",
                    borderColor: "#0f1117",
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                  }}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}