import { apiClient } from "./httpClient";
import type { AttemptDetail, AttemptEnvelope, AttemptStartResult, PingResult, SubmitAttemptPayload, SubmitAttemptResult } from "../types/attempt";

export async function startAttemptApi(payload: {
  examId: number;
  device_id: string;
}): Promise<AttemptStartResult> {
  const { data } = await apiClient.post<AttemptEnvelope<AttemptStartResult>>(
    "/attempts/start",
    payload,
  );
  return data.data;
}
export async function getAttemptByExamApi(
  examId: number,
  deviceId: string,
): Promise<AttemptDetail> {
  const { data } = await apiClient.get<AttemptEnvelope<AttemptDetail>>(
    `/attempts/exam/${examId}`,
    { params: { device_id: deviceId } },
  );
  return data.data;
}

export async function getAttemptDetailApi(
  attemptId: number,
): Promise<AttemptDetail> {
  const { data } = await apiClient.get<AttemptEnvelope<AttemptDetail>>(
    `/attempts/${attemptId}`,
  );
  return data.data;
}

export async function submitAttemptApi(
  attemptId: number,
  payload: SubmitAttemptPayload,
): Promise<SubmitAttemptResult> {
  const { data } = await apiClient.post<AttemptEnvelope<SubmitAttemptResult>>(
    `/attempts/${attemptId}/submit`,
    payload,
  );
  return data.data;
}

export async function pingAttemptApi(
  attemptId: number,
  deviceId: string,
): Promise<PingResult> {
  const { data } = await apiClient.post<AttemptEnvelope<PingResult>>(
    `/attempts/${attemptId}/ping`,
    { device_id: deviceId },
  );
  return data.data;
}

export async function lockAttemptApi(
  attemptId: number,
  deviceId: string,
  violationType: string,
  message: string,
): Promise<{ locked: boolean; status: string }> {
  const { data } = await apiClient.post<AttemptEnvelope<{ locked: boolean; status: string }>>(
    `/attempts/${attemptId}/lock`,
    { device_id: deviceId, violation_type: violationType, message },
  );
  return data.data;
}

/**
 * Ghi log vi phạm lên server mà không thay đổi trạng thái bài thi.
 * Dùng cho grace period violations và COPY_PASTE warnings.
 * Trả về violationId để có thể resolve sau.
 */
export async function logViolationApi(
  attemptId: number,
  violationType: string,
  message: string,
  metadata?: Record<string, unknown>,
): Promise<{ violationId: number }> {
  const { data } = await apiClient.post<AttemptEnvelope<{ violationId: number }>>(
    `/attempts/${attemptId}/violation-log`,
    { violation_type: violationType, message, metadata },
  );
  return data.data;
}

/**
 * Đánh dấu vi phạm đã được giải quyết (thí sinh quay lại trong grace period).
 */
export async function resolveViolationApi(
  attemptId: number,
  violationId: number,
): Promise<void> {
  await apiClient.post(
    `/attempts/${attemptId}/violation-log/${violationId}/resolve`,
  );
}
