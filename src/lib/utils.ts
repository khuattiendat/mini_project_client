import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

// ─── Date formatting ─────────────────────────────────────────────────────────

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return dayjs.utc(value).tz(APP_TIMEZONE).format("DD/MM/YYYY HH:mm");
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

export function isFormValidationError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errorFields" in error;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function buildSWRListKey<T extends Record<string, unknown>>(
  prefix: string,
  params: T,
): [string, ...unknown[]] {
  return [prefix, ...Object.values(params)];
}
