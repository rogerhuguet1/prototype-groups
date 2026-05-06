type ClassValue = string | number | null | false | undefined;

/** Concat condicional ligero, sin dependencias. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
