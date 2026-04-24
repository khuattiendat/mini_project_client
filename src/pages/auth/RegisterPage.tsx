// RegisterPage.tsx
import {
  LockOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, message, Divider } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../api/apiError";
import { useAuth } from "../../auth/useAuth";
import type { RegisterPayload } from "../../types/auth";

interface RegisterFormValue extends RegisterPayload {
  confirmPassword: string;
}

// ─── Shared left-panel (dùng lại cho cả Login & Register) ───────────────────
function AuthLeftPanel() {
  return (
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
          <em style={{ color: "#AFA9EC", fontStyle: "italic" }}>thông minh</em>
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
          Nền tảng giáo dục hiện đại với phân quyền linh hoạt cho Admin và người
          dùng.
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
          style={{ fontSize: 12, color: "#6b7280", fontWeight: 300, margin: 0 }}
        >
          <span style={{ color: "#d1d5db" }}>2,400+</span> giáo viên đang dùng
        </p>
      </div>
    </div>
  );
}

// ─── Shared wrapper ──────────────────────────────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
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
        <AuthLeftPanel />
        {/* Right panel */}
        <div
          style={{
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 44px",
            overflowY: "auto",
          }}
        >
          <div style={{ width: "100%", maxWidth: 340 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared label style ───────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#6b7280",
  letterSpacing: "0.02em",
};

const inputStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
};

const submitBtnStyle: React.CSSProperties = {
  height: 46,
  borderRadius: 10,
  background: "#0f1117",
  borderColor: "#0f1117",
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "0.02em",
};

// ─── RegisterPage ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const onFinish = async (values: RegisterFormValue) => {
    const { userName, fullName, password } = values;
    try {
      const user = await register({ userName, fullName, password });
      navigate(user.role === "admin" ? "/admin" : "/user", { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  };

  return (
    <AuthShell>
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: 12,
        }}
      >
        Tạo tài khoản mới
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
        Đăng ký
      </h2>

      <p
        style={{
          fontSize: 13.5,
          color: "#6b7280",
          fontWeight: 300,
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        Nhập thông tin để tạo tài khoản và bắt đầu sử dụng hệ thống
      </p>

      <Form<RegisterFormValue> layout="vertical" onFinish={onFinish}>
        <Form.Item
          label={<span style={labelStyle}>Tên đăng nhập</span>}
          name="userName"
          rules={[{ required: true, message: "Nhập tên đăng nhập" }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
            placeholder="nguyenvana"
            size="large"
            style={inputStyle}
          />
        </Form.Item>

        <Form.Item
          label={<span style={labelStyle}>Họ tên</span>}
          name="fullName"
          rules={[{ required: true, message: "Nhập họ tên" }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
            placeholder="Nguyễn Văn A"
            size="large"
            style={inputStyle}
          />
        </Form.Item>

        <Form.Item
          label={<span style={labelStyle}>Mật khẩu</span>}
          name="password"
          rules={[
            { required: true, min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
            placeholder="••••••••"
            size="large"
            style={inputStyle}
          />
        </Form.Item>

        <Form.Item
          label={<span style={labelStyle}>Xác nhận mật khẩu</span>}
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Xác nhận mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value: string) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp"),
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
            placeholder="••••••••"
            size="large"
            style={inputStyle}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16, marginTop: 4 }}>
          <Button
            htmlType="submit"
            type="primary"
            block
            loading={isLoading}
            size="large"
            icon={!isLoading ? <ArrowRightOutlined /> : undefined}
            style={submitBtnStyle}
          >
            Tạo tài khoản
          </Button>
        </Form.Item>
      </Form>

      <Divider style={{ fontSize: 12, color: "#9ca3af" }}>hoặc</Divider>

      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#6b7280",
          marginTop: 8,
        }}
      >
        Đã có tài khoản?{" "}
        <Link to="/login" style={{ color: "#534AB7", fontWeight: 500 }}>
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
