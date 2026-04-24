import {
  AppstoreOutlined,
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Menu, type MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { menuItems } from "./ui/menuItems";

const { Header, Sider, Content } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Match selected key by current path
  const selectedKey =
    menuItems!
      .filter((item): item is { key: string } => !!item && "key" in item)
      .map((item) => item.key)
      .find((key) => location.pathname === key) ?? "/admin";

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
  };

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const userDropdownItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ",
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "Đổi mật khẩu",
      onClick: () => navigate("/admin/change-password"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined style={{ color: "#ef4444" }} />,
      label: <span style={{ color: "#ef4444" }}>Đăng xuất</span>,
      onClick: onLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ── Header ── */}
      <Header
        style={{
          background: "#0f1117",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 56,
        }}
      >
        {/* Left placeholder — keeps logo centered */}
        <div style={{ width: 80 }} />

        {/* Logo center */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin")}
        >
          {/* Lighthouse icon placeholder — swap with your <img> */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "#0f1117",
              fontFamily: "'DM Serif Display', serif",
              letterSpacing: -1,
            }}
          >
            ab
          </div>
          <span
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: "0.05em",
            }}
          >
            EDU
          </span>
        </div>

        {/* User dropdown — right */}
        <Dropdown
          menu={{ items: userDropdownItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
              transition: "background .15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,255,255,0.08)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                "transparent")
            }
          >
            <Avatar
              size={28}
              icon={<UserOutlined />}
              style={{ background: "#534AB7" }}
            />
            <span
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.05em",
              }}
            >
              {user?.role?.toUpperCase() ?? "ADMIN"}
            </span>
          </div>
        </Dropdown>
      </Header>

      <Layout>
        {/* ── Sidebar ── */}
        <Sider
          width={220}
          breakpoint="lg"
          collapsedWidth={0}
          style={{
            background: "#fff",
            borderRight: "1px solid #f0f0f0",
            height: "calc(100vh - 56px)",
            position: "sticky",
            top: 56,
            overflow: "auto",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={onMenuClick}
            style={{
              border: "none",
              paddingTop: 8,
              fontSize: 14,
            }}
          />
        </Sider>

        {/* ── Content ── */}
        <Layout
          style={{
            padding: "24px",
            background: "#f5f5f5",
            minHeight: "calc(100vh - 56px)",
          }}
        >
          <Content
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              minHeight: 400,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
