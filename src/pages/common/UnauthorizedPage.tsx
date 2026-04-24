import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const onGoHome = () => {
    const targetPath = user?.role === "admin" ? "/admin" : "/user";
    navigate(targetPath);
  };

  return (
    <Result
      status="403"
      title="403"
      subTitle="Ban khong co quyen truy cap trang nay."
      extra={
        <Button type="primary" onClick={onGoHome}>
          Quay ve trang chinh
        </Button>
      }
    />
  );
}
