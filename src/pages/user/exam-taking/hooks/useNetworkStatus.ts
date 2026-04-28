import { useEffect, useRef, useState } from "react";

const CHECK_URL = "https://www.google.com/favicon.ico";
const CHECK_INTERVAL_MS = 10_000; // kiểm tra mỗi 10s
const CHECK_TIMEOUT_MS = 5_000;   // timeout mỗi request

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    await fetch(`${CHECK_URL}?_=${Date.now()}`, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Kiểm tra ngay khi mount
    checkConnectivity().then(setOnline);

    // Kiểm tra định kỳ
    intervalRef.current = setInterval(async () => {
      const result = await checkConnectivity();
      setOnline(result);
    }, CHECK_INTERVAL_MS);

    // Lắng nghe sự kiện online/offline của browser
    const handleOnline = () => checkConnectivity().then(setOnline);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { online };
}
