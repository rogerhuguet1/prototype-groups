/**
 * Lista oficial de nombres de grupos para el prototipo.
 *
 * Los grupos se identifican únicamente por nombre textual (en mayúsculas).
 * No hay emojis. El orden es estable y se asigna por posición:
 *   pod-1 → GROUP_NAMES[0] = ORION
 *   pod-2 → GROUP_NAMES[1] = APOLLO
 *   ...
 *
 * Motivo del orden:
 *  1. Nombres reconocibles para los primeros grupos (uso más frecuente).
 *  2. Conceptos espaciales amplios y visuales.
 *  3. Planetas / cuerpos celestes cortos.
 *  4. Nombres de reserva.
 */
export const GROUP_NAMES = [
  "ORION",
  "APOLLO",
  "VOYAGER",
  "ARTEMIS",
  "ECLIPSE",
  "COSMOS",
  "GALAXY",
  "SUPERNOVA",
  "NEBULA",
  "ASTRO",
  "SATURN",
  "JUPITER",
  "MARS",
  "VENUS",
  "SUN",
  "PEGASUS",
  "PLUTO",
] as const;

export type GroupName = (typeof GROUP_NAMES)[number];

/**
 * Máximo de grupos permitidos. Tope duro: 15 (el proyecto limita a este número
 * desde versiones anteriores; mantenemos consistencia). GROUP_NAMES tiene 17
 * nombres, los 2 últimos son reserva.
 */
export const MAX_PODS = 15;

/**
 * Devuelve el nombre asignado a un pod por su índice (0-based).
 * Si excede el rango de nombres, cae a "GRUPO N" como fallback defensivo.
 */
export function groupNameForIndex(index: number): string {
  return GROUP_NAMES[index] ?? `GRUPO ${index + 1}`;
}
