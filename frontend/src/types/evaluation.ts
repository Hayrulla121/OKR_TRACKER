export enum EvaluatorType {
  DIRECTOR = 'DIRECTOR',
  HR = 'HR',
  BUSINESS_BLOCK = 'BUSINESS_BLOCK'
}

export enum EvaluationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED'
}

export interface Evaluation {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorType: EvaluatorType;
  targetType: string;
  targetId: string;
  numericRating?: number;
  letterRating?: string;
  comment?: string;
  status: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationCreateRequest {
  targetType: string;
  targetId: string;
  evaluatorType: EvaluatorType;
  numericRating?: number;
  starRating?: number;
  letterRating?: string;
  comment?: string;
}

export interface DepartmentScoreResult {
  automaticOkrScore: number;
  automaticOkrPercentage: number;
  directorEvaluation?: number;
  directorStars?: number;
  directorComment?: string;
  hrEvaluationLetter?: string;
  hrEvaluationNumeric?: number;
  hrComment?: string;
  businessBlockEvaluation?: number;
  businessBlockComment?: string;
  finalCombinedScore?: number;
  finalPercentage?: number;
  scoreLevel: string;
  color: string;
  hasDirectorEvaluation: boolean;
  hasHrEvaluation: boolean;
  hasBusinessBlockEvaluation: boolean;
}
