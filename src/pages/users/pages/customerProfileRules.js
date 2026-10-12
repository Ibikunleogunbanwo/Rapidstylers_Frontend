/**
 * Validation rules for the customer "Update personal information" form.
 * They mirror the shared contract the backend enforces (QA round 2026-10-12),
 * so a value the page accepts is never refused by the server afterwards.
 */

// Letters in any script (José, O'Brien, Nguyễn, 李), plus spaces, apostrophes,
// hyphens and periods after the first letter. No digits, symbols or emoji.
export const PERSON_NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]{0,49}$/u;
export const CITY_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]{0,59}$/u;
export const POSTAL_CODE_PATTERN = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export const PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "YT", name: "Yukon" },
];

/**
 * The dropdown's full name for a stored or Places-supplied province, whether it
 * arrived as a code ("AB"), a name in any case, or "Québec". Unknown values
 * come back empty so the person has to pick one.
 */
export const provinceName = (value) => {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "";
  if (key === "québec") return "Quebec";
  const match = PROVINCES.find((p) => p.code.toLowerCase() === key || p.name.toLowerCase() === key);
  return match ? match.name : "";
};

/** Digits only, so "(403) 555-0123" and "+1 403 555 0123" read the same. */
export const phoneDigits = (value) => String(value || "").replace(/\D/g, "");

/**
 * The problem with a phone value, or null when it is fine (or empty: the field
 * is optional). Extra digits are an error, never silently cut off.
 */
export const phoneProblem = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/[^\d\s()+.-]/.test(raw)) return "Use digits only, for example 403 555 0123";
  let digits = phoneDigits(raw);
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return "Enter a 10-digit phone number";
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return "Enter a valid Canadian phone number";
  return null;
};

/** The 10-digit form sent to the server ("" when the field is empty). */
export const normalizePhone = (value) => {
  const digits = phoneDigits(value);
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
};

/**
 * True for an account created with Google sign-in. Those accounts have no
 * password by design (the server refuses email/password sign-in for them), so
 * a change-password form could never succeed.
 */
export const isGoogleAccount = (...accounts) =>
  accounts.some((account) => String(account?.registrationMethod || "").toUpperCase() === "GOOGLE");
