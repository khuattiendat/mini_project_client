import type { ApiEnvelope } from './auth';

export interface AttemptChoice {
  id: number;
  content: string;
}

export interface AttemptQuestion {
  id: number;
  content: string;
  orderIndex: number;
  choices: AttemptChoice[];
}

export interface AttemptStartResult {
  id: number;
  examId: number;
  attemptNo: number;
  status: string;
  deviceId: string | null;
  startedAt: string | null;
}

export interface AttemptInfo {
  id: number;
  examId: number;
  attemptNo: number;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface AttemptExamInfo {
  id: number;
  title: string;
  description: string | null;
  duration: number; // minutes
}

export interface AttemptDetail {
  attempt: AttemptInfo;
  exam: AttemptExamInfo;
  questions: AttemptQuestion[];
}

export interface AnswerItem {
  questionId: number;
  selectedChoiceId: number;
}

export interface SubmitAttemptPayload {
  answers: AnswerItem[];
}

export interface SubmitAttemptResult {
  attemptId: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
}

export interface PingResult {
  status: string;
  locked: boolean;
  message?: string;
}

export type AttemptEnvelope<T> = ApiEnvelope<T>;
