import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ExamsPage from "../pages/admin/ExamsPage";
import UsersPage from "../pages/admin/UsersPage";
import UnauthorizedPage from "../pages/common/UnauthorizedPage";
import UserHomePage from "../pages/user/UserHomePage";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";

function LandingPageRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "admin" ? "/admin" : "/user"} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageRedirect />} />

      <Route element={<PublicRouter />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRouter allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route element={<PrivateRouter allowedRoles={["user"]} />}>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserHomePage />} />
        </Route>
      </Route>

      <Route element={<PrivateRouter />}>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
