import { Spin } from "antd";
import { useEffect, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { SWRConfig } from "swr";
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
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 2000,
        keepPreviousData: true,
        shouldRetryOnError: false,
      }}
    >
      <BrowserRouter>
        <NuqsAdapter>
          <AppRouter />
        </NuqsAdapter>
      </BrowserRouter>
    </SWRConfig>
  );
}

export default App;
