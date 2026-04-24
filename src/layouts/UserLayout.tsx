import {
  CalendarOutlined,
  HomeOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Layout,
  Menu,
  Space,
  Typography,
  type MenuProps,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const { Header, Content } = Layout;

const menuItems: MenuProps["items"] = [
  { key: "/user", icon: <HomeOutlined />, label: "Trang chu" },
  { key: "/user", icon: <CalendarOutlined />, label: "Lich hoc cua toi" },
];

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const selectedKey = location.pathname.startsWith("/user") ? "/user" : "";

  const onMenuClick: MenuProps["onClick"] = (event) => {
    navigate(event.key);
  };

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout className="min-h-screen bg-shell">
      <Header className="flex flex-wrap items-center justify-between gap-3 bg-ink px-4 sm:px-6">
        <Typography.Text className="text-base font-semibold text-white sm:text-lg">
          User Workspace
        </Typography.Text>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={onMenuClick}
          className="min-w-[220px] flex-1 border-none bg-transparent text-white"
          theme="dark"
        />
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Typography.Text className="hidden text-white sm:inline">
            {user?.fullName}
          </Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={onLogout}>
            Dang xuat
          </Button>
        </Space>
      </Header>

      <Content className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="rounded-2xl bg-white p-4 shadow-soft sm:p-6">
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
