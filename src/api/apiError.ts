import axios from "axios";
import type { ApiErrorResponse } from "../types/auth";

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return "Co loi xay ra, vui long thu lai.";
  }

  const payloadError = error.response?.data?.error;

  if (typeof payloadError === "string") {
    return payloadError;
  }

  const message = payloadError?.message;

  if (Array.isArray(message)) {
    return message[0] ?? "Co loi xay ra, vui long thu lai.";
  }

  if (typeof message === "string") {
    return message;
  }

  return error.message || "Co loi xay ra, vui long thu lai.";
}
