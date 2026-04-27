export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function isFormValidationError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errorFields" in error;
}
