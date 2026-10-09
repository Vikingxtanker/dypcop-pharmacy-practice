export interface Participant2026 {
  id: string;
  name: string;
  phone: string | null;
  prefix: string | null;
}

export const PARTICIPANTS_2026_LIMIT = 10;

export function buildParticipantDisplayName(row: Pick<Participant2026, "name" | "prefix">): string {
  return `${row.prefix ? row.prefix + " " : ""}${row.name}`.trim();
}

export function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function filterParticipants2026(
  rows: Participant2026[],
  query: string,
  limit: number = PARTICIPANTS_2026_LIMIT,
): Participant2026[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const queryDigits = normalizePhone(trimmed);
  const queryWithoutCountryCode = queryDigits.startsWith("91") && queryDigits.length > 10 ? queryDigits.slice(2) : "";
  const matches: Participant2026[] = [];

  for (const row of rows) {
    const nameLower = buildParticipantDisplayName(row).toLowerCase();
    const nameMatch = tokens.every((token) => nameLower.includes(token));
    const phoneDigits = normalizePhone(row.phone);
    const phoneMatch =
      queryDigits.length > 0 &&
      (phoneDigits.includes(queryDigits) || (queryWithoutCountryCode.length > 0 && phoneDigits.includes(queryWithoutCountryCode)));
    if (!nameMatch && !phoneMatch) continue;

    matches.push(row);
    if (matches.length >= limit) break;
  }

  return matches;
}
