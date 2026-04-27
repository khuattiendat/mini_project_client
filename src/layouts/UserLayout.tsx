import {
  ClockCircleOutlined,
  HomeOutlined,
  KeyOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, type MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const { Content } = Layout;

const menuItems = [
  {
    key: "/user",
    icon: <HomeOutlined />,
    label: "Đề thi",
  },
  {
    key: "/user/history",
    icon: <ClockCircleOutlined />,
    label: "Lịch sử thi",
  },
];

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const selectedKey =
    menuItems
      .map((item) => item.key)
      .find(
        (key) =>
          location.pathname.startsWith(key) &&
          (key === "/user" ? location.pathname === "/user" : true)
      ) ?? "/user";

  const onLogout = () => {
    void logout().then(() => navigate("/login"));
  };

  const userDropdownItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ",
      onClick: () => navigate("/user/profile"),
    },
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "Đổi mật khẩu",
      onClick: () => navigate("/user/change-password"),
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
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-[Plus_Jakarta_Sans,sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-[100] h-[60px] flex items-center px-8 gap-0
        bg-gradient-to-br from-[#0f1117] via-[#1a1f2e] to-[#0d1b2a]
        border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.35)]
        relative">

        {/* Shimmer bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70
          bg-gradient-to-r from-transparent via-blue-500 to-transparent
          animate-[shimmer_4s_linear_infinite]"
          style={{
            backgroundImage: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, #06b6d4, transparent)",
            backgroundSize: "200% 100%",
          }}
        />

        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 mr-9"
          onClick={() => navigate("/user")}
        >
          <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center
            bg-gradient-to-br from-blue-500 to-violet-500
            text-white text-base font-bold tracking-tight
            shadow-[0_0_12px_rgba(139,92,246,0.4)]
            font-['DM_Serif_Display',serif]">
            ab
          </div>
          <div className="flex items-end gap-1">
            <span className="text-white font-bold text-base tracking-[0.12em] uppercase">
              EDU
            </span>
            <span className="text-[9px] font-semibold text-violet-400 tracking-[0.08em]
              bg-violet-500/10 border border-violet-500/30 rounded px-1 py-[1px]
              leading-[1.6] mb-[3px]">
              PRO
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {menuItems.map((item) => {
            const isActive = selectedKey === item.key;
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`
                  relative flex items-center gap-[7px] px-[14px] py-[6px] rounded-lg
                  cursor-pointer select-none whitespace-nowrap
                  text-[13.5px] font-medium tracking-[0.01em]
                  transition-all duration-[180ms]
                  ${isActive
                    ? "text-white bg-blue-500/15"
                    : "text-white/55 hover:text-white/90 hover:bg-white/[0.06]"
                  }
                `}
              >
                <span className={`text-sm transition-colors duration-[180ms]
                  ${isActive ? "text-blue-400" : "text-white/40"}`}>
                  {item.icon}
                </span>
                {item.label}

                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-[-1px] left-[14px] right-[14px] h-[2px]
                    rounded-t-sm bg-gradient-to-r from-blue-500 to-violet-500" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          {/* Divider */}
          <div className="w-px h-[22px] bg-white/10" />

          {/* User pill */}
          <Dropdown
            menu={{ items: userDropdownItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full
              border border-white/10 cursor-pointer
              bg-white/[0.04] transition-all duration-[180ms]
              hover:border-white/20 hover:bg-white/[0.08]">
              <Avatar
                size={28}
                icon={<UserOutlined />}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  flexShrink: 0,
                  fontSize: 13,
                }}
              />
              <span className="text-[13px] font-medium text-white/85 tracking-[0.01em] select-none
                max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                {user?.fullName ?? "User"}
              </span>
              <span className="text-[10px] text-white/35 ml-0.5">▾</span>
            </div>
          </Dropdown>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-7">
        <div className="max-w-[1200px] mx-auto bg-white rounded-[14px] p-7 min-h-[400px]
          shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}