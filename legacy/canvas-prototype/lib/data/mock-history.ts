import type { HistorySession } from "@/lib/domain/types";

export const MOCK_HISTORY: HistorySession[] = [
  {
    id: "ses-2026-01",
    name: "Proyecto Robótica · 4ºESO",
    date: "2026-04-12T09:00:00.000Z",
    panelCount: 5,
    assignedStudentCount: 25,
    status: "archived",
  },
  {
    id: "ses-2026-02",
    name: "Trabajo cooperativo · Bio",
    date: "2026-04-22T11:30:00.000Z",
    panelCount: 6,
    assignedStudentCount: 28,
    status: "archived",
  },
  {
    id: "ses-2026-03",
    name: "Hackathon STEAM · 1ºBatx",
    date: "2026-04-29T08:15:00.000Z",
    panelCount: 4,
    assignedStudentCount: 16,
    status: "archived",
  },
  {
    id: "ses-2026-04",
    name: "Mini-proyecto Drones",
    date: "2026-05-03T15:00:00.000Z",
    panelCount: 3,
    assignedStudentCount: 12,
    status: "locked",
  },
];
