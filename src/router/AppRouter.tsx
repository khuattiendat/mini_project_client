import { Skeleton } from "antd";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const ExamPreviewPage = lazy(() => import("../pages/admin/ExamPreviewPage"));
const ExamsPage = lazy(() => import("../pages/admin/ExamsPage"));
const QuestionEditorPage = lazy(() => import("../pages/admin/QuestionEditorPage"));
const QuestionsPage = lazy(() => import("../pages/admin/QuestionsPage"));
const UsersPage = lazy(() => import("../pages/admin/UsersPage"));
const ProfilePage = lazy(() => import("../pages/admin/ProfilePage"));
const ChangePasswordPage = lazy(() => import("../pages/admin/ChangePasswordPage"));
const ExamAssignPage = lazy(() => import("../pages/admin/ExamAssignPage"));
const UnauthorizedPage = lazy(() => import("../pages/common/UnauthorizedPage"));
const UserHomePage = lazy(() => import("../pages/user/UserHomePage"));
const UserHistoryPage = lazy(() => import("../pages/user/UserHistoryPage"));
const ExamTakingPage = lazy(() => import("../pages/user/ExamTakingPage"));

function PageLoader() {
  return (
    <div className="p-6">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

function LandingPageRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "admin" ? "/admin" : "/user"} replace />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
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
            <Route path="exams/:examId/assign" element={<ExamAssignPage />} />
            <Route path="exams/:examId/preview" element={<ExamPreviewPage />} />
            <Route path="exams/:examId/questions" element={<QuestionsPage />} />
            <Route path="exams/:examId/questions/new" element={<QuestionEditorPage />} />
            <Route path="exams/:examId/questions/:questionId/edit" element={<QuestionEditorPage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="questions/new" element={<QuestionEditorPage />} />
            <Route path="questions/:questionId/edit" element={<QuestionEditorPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRouter allowedRoles={["user"]} />}>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<UserHomePage />} />
            <Route path="history" element={<UserHistoryPage />} />
            <Route path="exam" element={<ExamTakingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRouter />}>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
