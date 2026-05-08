import type { Pod } from "@/lib/pods/create-pods";

export type PodEvaluationRating = "green" | "amber" | "red";

export type PodEvaluation = {
  podId: string;
  rating: PodEvaluationRating;
};

export type HistoryEntry = {
  id: string;
  timestamp: string;
  classId: string | null;
  presentStudents: number;
  robotCount: number;
  seed: string;
  pods: Pod[];
  isFavorite: boolean;
  evaluations: PodEvaluation[];
  evaluatedAt: string | null;
  lockedStudentIds: string[];
  label?: string;
};
