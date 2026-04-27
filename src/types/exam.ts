import type { ApiEnvelope } from "./auth";

export interface ExamItem {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  startDate: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExamListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ExamListResponse {
  items: ExamItem[];
  meta: ExamListMeta;
}

export interface ExamListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateExamPayload {
  title: string;
  description?: string;
  duration: number;
  startDate: string;
  isPublic?: boolean;
}

export interface UpdateExamPayload {
  title?: string;
  description?: string | null;
  duration?: number;
  startDate?: string;
  isPublic?: boolean;
}

export interface DeleteExamResponse {
  message: string;
}

export interface AssignedUser {
  id: number;
  userName: string;
  fullName: string;
  status: string;
}

export type ExamEnvelope<T> = ApiEnvelope<T>;
