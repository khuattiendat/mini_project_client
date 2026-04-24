import { Spin } from "antd";
import { useEffect, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import AppRouter from "./router/AppRouter";

function App() {
  const { initialized, fetchProfile } = useAuth();
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    void fetchProfile();
  }, [fetchProfile]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
