/**
 * Canonical patient-age calculator.
 *
 * Date Of Birth (DOB) is the single source of truth for a patient's age.
 * The value stored in `patients.age` is a compatibility/cache field and must
 * NEVER be trusted as authoritative — it goes stale the moment a patient has a
 * birthday. All application logic must compute age through this helper.
 *
 * No timezone pitfalls: DOB strings (YYYY-MM-DD) and screening date keys are
 * parsed as calendar dates only, never as UTC timestamps, so a patient born on
 * a given calendar day can never drift a year because of UTC conversion.
 */

interface DateParts {
  year: number;
  month: number;
  day: number;
}

const DATE_ONLY_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function parseDateOnly(value: string): DateParts | null {
  const match = DATE_ONLY_RE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > maxDay) return null;
  return { year, month, day };
}

function toDateParts(value: string | Date | null | undefined): DateParts | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return parseDateOnly(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
  }
  return null;
}

/**
 * Age as of a reference calendar date.
 *
 * `dob` may be a `YYYY-MM-DD` string or a Date. `referenceDate` may be a
 * `YYYY-MM-DD` string (e.g. a screening date key) or a Date (default: today's
 * local calendar date). Returns null for a missing/invalid DOB or when the DOB
 * falls after the reference date — never an invented age.
 */
export function calculateAgeFromDob(
  dob: string | Date | null | undefined,
  referenceDate: string | Date = new Date(),
): number | null {
  const birth = toDateParts(dob);
  if (!birth) return null;
  const ref = toDateParts(referenceDate);
  if (!ref) return null;

  let age = ref.year - birth.year;
  if (age < 0) return null;
  const hasHadBirthday = ref.month > birth.month || (ref.month === birth.month && ref.day >= birth.day);
  if (!hasHadBirthday) age -= 1;
  return age;
}