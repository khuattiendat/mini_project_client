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
