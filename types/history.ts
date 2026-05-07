import type { Pod } from "@/lib/pods/create-pods";

export type HistoryEntry = {
  id: string;
  timestamp: string;
  classId: string | null;
  presentStudents: number;
  robotCount: number;
  seed: string;
  pods: Pod[];
  isFavorite: boolean;
  label?: string;
};
