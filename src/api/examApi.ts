import { apiClient } from "./httpClient";
import type {
  AssignedUser,
  CreateExamPayload,
  DashboardStats,
  DeleteExamResponse,
  ExamEnvelope,
  ExamItem,
  ExamListParams,
  ExamListResponse,
  UpdateExamPayload,
  UserAttempt,
} from "../types/exam";

// ─── Exams CRUD ───────────────────────────────────────────────────────────────

export async function getExamsApi(params: ExamListParams): Promise<ExamListResponse> {
  const { data } = await apiClient.get<ExamEnvelope<ExamListResponse>>("/exams", { params });
  return data.data;
}

export async function getExamApi(id: number): Promise<ExamItem> {
  const { data } = await apiClient.get<ExamEnvelope<ExamItem>>(`/exams/${id}`);
  return data.data;
}

export async function createExamApi(payload: CreateExamPayload): Promise<ExamItem> {
  const { data } = await apiClient.post<ExamEnvelope<ExamItem>>("/exams", payload);
  return data.data;
}

export async function updateExamApi(id: number, payload: UpdateExamPayload): Promise<ExamItem> {
  const { data } = await apiClient.patch<ExamEnvelope<ExamItem>>(`/exams/${id}`, payload);
  return data.data;
}

export async function deleteExamApi(id: number): Promise<DeleteExamResponse> {
  const { data } = await apiClient.delete<ExamEnvelope<DeleteExamResponse>>(`/exams/${id}`);
  return data.data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  const { data } = await apiClient.get<ExamEnvelope<DashboardStats>>("/exams/dashboard/stats");
  return data.data;
}

// ─── User-facing ──────────────────────────────────────────────────────────────

export async function getAvailableExamsApi(): Promise<ExamItem[]> {
  const { data } = await apiClient.get<ExamEnvelope<ExamItem[]>>("/exams/available");
  return data.data;
}

export async function getMyAttemptsApi(): Promise<UserAttempt[]> {
  const { data } = await apiClient.get<ExamEnvelope<UserAttempt[]>>("/exams/my-attempts");
  return data.data;
}

// ─── User assignment ──────────────────────────────────────────────────────────

export async function getAssignedUsersApi(examId: number): Promise<AssignedUser[]> {
  const { data } = await apiClient.get<ExamEnvelope<AssignedUser[]>>(
    `/exams/${examId}/assigned-users`,
  );
  return data.data;
}

export async function assignUsersApi(
  examId: number,
  userIds: number[],
): Promise<{ message: string; count: number }> {
  const { data } = await apiClient.post<ExamEnvelope<{ message: string; count: number }>>(
    `/exams/${examId}/assign-users`,
    { userIds },
  );
  return data.data;
}

export async function unassignUserApi(
  examId: number,
  userId: number,
): Promise<{ message: string }> {
  const { data } = await apiClient.delete<ExamEnvelope<{ message: string }>>(
    `/exams/${examId}/assigned-users/${userId}`,
  );
  return data.data;
}
