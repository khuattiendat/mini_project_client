import { KeyOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Menu, type MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { menuItems } from "./ui/menuItems";

const { Sider, Content } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
      label: <span className="text-red-500">Đăng xuất</span>,
      onClick: onLogout,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-[100] h-14 flex items-center justify-between px-6
        bg-[#0f1117] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">

        {/* Left placeholder */}
        <div className="w-20" />

        {/* Logo center */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/admin")}
        >
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center
            text-lg font-bold text-[#0f1117] tracking-tight
            font-['DM_Serif_Display',serif]">
            ab
          </div>
          <span className="text-white font-semibold text-[15px] tracking-[0.05em]">
            EDU
          </span>
        </div>

        {/* User dropdown */}
        <Dropdown
          menu={{ items: userDropdownItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <div className="flex items-center gap-2 cursor-pointer
            px-2 py-1 rounded-lg transition-colors duration-150
            hover:bg-white/[0.08]">
            <Avatar
              size={28}
              icon={<UserOutlined />}
              style={{ background: "#534AB7" }}
            />
            <span className="text-white text-[13px] font-medium tracking-[0.05em] select-none">
              {user?.role?.toUpperCase() ?? "ADMIN"}
            </span>
          </div>
        </Dropdown>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1">
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
            flexShrink: 0,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={onMenuClick}
            style={{ border: "none", paddingTop: 8, fontSize: 14 }}
          />
        </Sider>

        {/* ── Content ── */}
        <main className="flex-1 p-6 bg-[#f5f5f5] min-h-[calc(100vh-56px)]">
          <div className="bg-white rounded-xl p-6 min-h-[400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}