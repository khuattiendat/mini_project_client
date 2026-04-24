import {
  LockOutlined,
  UserOutlined,
  ArrowRightOutlined,
  GoogleOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, message, Divider } from "antd";
import { Link, useNavigate } from "react-router-dom";
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f4f0",
        padding: "2rem",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          minHeight: 580,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        {/* ───── Left panel ───── */}
        <div
          style={{
            position: "relative",
            background: "#0f1117",
            color: "#fff",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          {/* Glow top-right */}
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -60,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(83,74,183,0.4) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          {/* Glow bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(29,158,117,0.28) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Brand */}

          {/* Main content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(83,74,183,0.15)",
                color: "#AFA9EC",
                fontSize: 11,
                padding: "3px 12px",
                borderRadius: 20,
                fontWeight: 500,
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#AFA9EC",
                  display: "inline-block",
                }}
              />
              Hệ thống mới 2025
            </div>

            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 38,
                lineHeight: 1.2,
                fontWeight: 400,
                color: "#fff",
                margin: "0 0 20px",
              }}
            >
              Quản trị
              <br />
              trường học
              <br />
              <em style={{ color: "#AFA9EC", fontStyle: "italic" }}>
                thông minh
              </em>
            </h1>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: "#9ca3af",
                fontWeight: 300,
                maxWidth: 280,
                margin: 0,
              }}
            >
              Nền tảng giáo dục hiện đại với phân quyền linh hoạt cho Admin và
              người dùng.
            </p>
          </div>

          {/* Footer avatars */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex" }}>
              {[
                { initials: "AT", bg: "#534AB7", color: "#CECBF6" },
                { initials: "ML", bg: "#0F6E56", color: "#9FE1CB" },
                { initials: "PH", bg: "#993C1D", color: "#F5C4B3" },
              ].map((a, i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: a.bg,
                    color: a.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 500,
                    border: "2px solid #0f1117",
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex: 3 - i,
                    position: "relative",
                  }}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                fontWeight: 300,
                margin: 0,
              }}
            >
              <span style={{ color: "#d1d5db" }}>2,400+</span> giáo viên đang
              dùng
            </p>
          </div>
        </div>

        {/* ───── Right panel ───── */}
        <div
          style={{
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 44px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 340 }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: 12,
              }}
            >
              Chào mừng trở lại
            </p>

            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 30,
                fontWeight: 400,
                color: "#111827",
                margin: "0 0 6px",
              }}
            >
              Đăng nhập
            </h2>

            <p
              style={{
                fontSize: 13.5,
                color: "#6b7280",
                fontWeight: 300,
                marginBottom: 32,
                lineHeight: 1.6,
              }}
            >
              Nhập tài khoản để truy cập đúng giao diện theo vai trò của bạn
            </p>

            <Form<LoginPayload> layout="vertical" onFinish={onFinish}>
              <Form.Item
                label={
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#6b7280",
                      letterSpacing: "0.02em",
                    }}
                  >
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
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#6b7280",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Mật khẩu
                  </span>
                }
                name="password"
                rules={[
                  {
                    required: true,
                    min: 6,
                    message: "Mật khẩu tối thiểu 6 ký tự",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="••••••••"
                  size="large"
                  style={{ height: 44, borderRadius: 10 }}
                />
              </Form.Item>

              <div
                style={{ textAlign: "right", marginTop: -12, marginBottom: 20 }}
              >
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 12, color: "#534AB7" }}
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Form.Item style={{ marginBottom: 16 }}>
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

            <Divider style={{ fontSize: 12, color: "#9ca3af" }}>hoặc</Divider>

            <Button
              block
              size="large"
              icon={<GoogleOutlined />}
              style={{
                height: 44,
                borderRadius: 10,
                borderColor: "#e5e7eb",
                color: "#374151",
                fontSize: 13.5,
              }}
            >
              Tiếp tục với Google
            </Button>

            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#6b7280",
                marginTop: 24,
              }}
            >
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                style={{ color: "#534AB7", fontWeight: 500 }}
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
