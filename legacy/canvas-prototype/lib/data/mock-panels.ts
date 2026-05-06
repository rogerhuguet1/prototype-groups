import type { Panel, PanelMembership } from "@/lib/domain/types";
import { DEFAULT_MAX_GROUP_SIZE } from "@/lib/domain/constants";

/**
 * Estado inicial del canvas: dos paneles ya creados, vacíos.
 * Así el profesor entra a una pantalla con algo que ver, no un lienzo en blanco.
 */
export const MOCK_PANELS: Panel[] = [
  { id: "pnl-001", name: "Equipo Robots", capacity: DEFAULT_MAX_GROUP_SIZE, sortOrder: 0 },
  { id: "pnl-002", name: "Equipo Drones", capacity: DEFAULT_MAX_GROUP_SIZE, sortOrder: 1 },
];

export const MOCK_INITIAL_MEMBERSHIPS: PanelMembership[] = [];
