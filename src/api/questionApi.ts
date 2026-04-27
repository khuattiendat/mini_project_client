import { apiClient } from "./httpClient";
import type {
  CreateQuestionPayload,
  DeleteQuestionResponse,
  QuestionEnvelope,
  QuestionItem,
  QuestionListParams,
  QuestionListResponse,
  UpdateQuestionPayload,
} from "../types/question";

export async function getQuestionApi(id: number): Promise<QuestionItem> {
  const { data } = await apiClient.get<QuestionEnvelope<QuestionItem>>(
    `/questions/${id}`,
  );

  return data.data;
}

export async function getQuestionsApi(
  params: QuestionListParams,
): Promise<QuestionListResponse> {
  const { data } = await apiClient.get<QuestionEnvelope<QuestionListResponse>>(
    "/questions",
    {
      params,
    },
  );

  return data.data;
}

export async function createQuestionApi(
  payload: CreateQuestionPayload,
): Promise<QuestionItem> {
  const { data } = await apiClient.post<QuestionEnvelope<QuestionItem>>(
    "/questions",
    payload,
  );

  return data.data;
}

export async function updateQuestionApi(
  id: number,
  payload: UpdateQuestionPayload,
): Promise<QuestionItem> {
  const { data } = await apiClient.patch<QuestionEnvelope<QuestionItem>>(
    `/questions/${id}`,
    payload,
  );

  return data.data;
}

export async function deleteQuestionApi(
  id: number,
): Promise<DeleteQuestionResponse> {
  const { data } = await apiClient.delete<
    QuestionEnvelope<DeleteQuestionResponse>
  >(`/questions/${id}`);

  return data.data;
}
