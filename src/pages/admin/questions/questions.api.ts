import {
  createQuestionApi,
  deleteQuestionApi,
  getQuestionApi,
  getQuestionsApi,
  updateQuestionApi,
} from "../../../api/questionApi";
import type {
  CreateQuestionPayload,
  DeleteQuestionResponse,
  QuestionItem,
  QuestionListParams,
  QuestionListResponse,
  UpdateQuestionPayload,
} from "../../../types/question";

export const QUESTIONS_LIST_KEY = "questions";

export function buildQuestionsListKey(params: QuestionListParams) {
  return [
    QUESTIONS_LIST_KEY,
    params.page ?? 1,
    params.limit ?? 10,
    params.search ?? "",
    params.examId ?? "all",
  ] as const;
}

export async function fetchQuestionsList([
  ,
  page,
  limit,
  search,
  examId,
]: readonly [
  string,
  number,
  number,
  string,
  number | "all",
]): Promise<QuestionListResponse> {
  return getQuestionsApi({
    page,
    limit,
    search: search || undefined,
    examId: examId === "all" ? undefined : examId,
  });
}

export async function fetchQuestionDetail(id: number): Promise<QuestionItem> {
  return getQuestionApi(id);
}

export async function createQuestionRequest(
  payload: CreateQuestionPayload,
): Promise<QuestionItem> {
  return createQuestionApi(payload);
}

export async function updateQuestionRequest({
  id,
  payload,
}: {
  id: number;
  payload: UpdateQuestionPayload;
}): Promise<QuestionItem> {
  return updateQuestionApi(id, payload);
}

export async function deleteQuestionRequest(
  id: number,
): Promise<DeleteQuestionResponse> {
  return deleteQuestionApi(id);
}
