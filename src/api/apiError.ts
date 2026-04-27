import axios from "axios";
import type { ApiErrorResponse } from "../types/auth";

const FALLBACK_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return FALLBACK_MESSAGE;
  }

  const payloadError = error.response?.data?.error;

  if (typeof payloadError === "string") return payloadError;

  const message = payloadError?.message;
  if (Array.isArray(message)) return message[0] ?? FALLBACK_MESSAGE;
  if (typeof message === "string") return message;

  return error.message || FALLBACK_MESSAGE;
}
