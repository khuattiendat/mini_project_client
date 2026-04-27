export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function isFormValidationError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errorFields" in error;
}
