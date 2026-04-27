import type { ApiEnvelope } from "./auth";

export interface QuestionItem {
  id: number;
  examId: number;
  examTitle: string | null;
  content: string;
  orderIndex: number;
  choices: QuestionChoiceItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuestionChoiceItem {
  id: number;
  content: string;
  isCorrect: boolean;
}

export interface QuestionListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface QuestionListResponse {
  items: QuestionItem[];
  meta: QuestionListMeta;
}

export interface QuestionListParams {
  page?: number;
  limit?: number;
  search?: string;
  examId?: number;
}

export interface CreateQuestionPayload {
  examId: number;
  content: string;
  orderIndex?: number;
  choices: QuestionChoicePayload[];
}

export interface UpdateQuestionPayload {
  examId?: number;
  content?: string;
  orderIndex?: number;
  choices?: QuestionChoicePayload[];
}

export interface QuestionChoicePayload {
  content: string;
  isCorrect: boolean;
}

export interface DeleteQuestionResponse {
  message: string;
}

export type QuestionEnvelope<T> = ApiEnvelope<T>;
