type WithName = { full_name: string };

export function lastNameKey(fullName: string): string {
  const trimmed = fullName.trim();
  if (trimmed.includes(",")) {
    const before = trimmed.split(",")[0];
    return (before ?? "").trim().toLowerCase();
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed.toLowerCase();
  return parts.slice(1).join(" ").toLowerCase();
}

export function sortByLastName<T extends WithName>(students: T[]): T[] {
  return [...students].sort((a, b) =>
    lastNameKey(a.full_name).localeCompare(lastNameKey(b.full_name), "es"),
  );
}

export function displayName(fullName: string): string {
  const trimmed = fullName.trim();
  if (trimmed.includes(",")) return trimmed.toUpperCase();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return trimmed.toUpperCase();
  const [first, ...rest] = parts;
  return `${rest.join(" ")}, ${first}`.toUpperCase();
}
