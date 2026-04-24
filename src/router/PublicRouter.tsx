import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function PublicRouter() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const landingPath = user.role === "admin" ? "/admin" : "/user";
    return <Navigate to={landingPath} replace />;
  }

  return <Outlet />;
}
