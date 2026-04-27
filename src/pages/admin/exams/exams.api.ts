import {
  createExamApi,
  deleteExamApi,
  getExamsApi,
  updateExamApi,
} from "../../../api/examApi";
import type {
  CreateExamPayload,
  DeleteExamResponse,
  ExamItem,
  ExamListParams,
  ExamListResponse,
  UpdateExamPayload,
} from "../../../types/exam";

export const EXAMS_LIST_KEY = "exams";

export function buildExamsListParams({
  page,
  limit,
  search,
}: ExamListParams): ExamListParams {
  return {
    page,
    limit,
    search,
  };
}

export function buildExamsListKey(params: ExamListParams) {
  return [
    EXAMS_LIST_KEY,
    params.page ?? 1,
    params.limit ?? 10,
    params.search ?? "",
  ] as const;
}

export async function fetchExamsList([, page, limit, search]: readonly [
  string,
  number,
  number,
  string,
]): Promise<ExamListResponse> {
  return getExamsApi({
    page,
    limit,
    search: search || undefined,
  });
}

export async function createExamRequest(
  payload: CreateExamPayload,
): Promise<ExamItem> {
  return createExamApi(payload);
}

export async function updateExamRequest({
  id,
  payload,
}: {
  id: number;
  payload: UpdateExamPayload;
}): Promise<ExamItem> {
  return updateExamApi(id, payload);
}

export async function deleteExamRequest(
  id: number,
): Promise<DeleteExamResponse> {
  return deleteExamApi(id);
}
