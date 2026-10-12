/**
 * The sign-up field rules, written once for every sign-up form (customer and
 * professional) and matching the backend's rules for the same fields. A value
 * the browser accepts here is a value the server accepts at the end of the
 * flow, so nobody learns at the last step that their name was "rejected".
 */

/** Letters (any script), then letters, accents, spaces, apostrophes, hyphens and periods. */
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]{0,49}$/u;
export const CITY_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]{0,59}$/u;
export const POSTAL_CODE_PATTERN = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
export const NAME_MAX = 50;
export const CITY_MAX = 60;

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
export const PROVINCE_NAMES = PROVINCES.map((p) => p.name);

/**
 * The dropdown's full name for whatever an address lookup or an old draft
 * produced ("AB", "alberta", "Québec"), or "" when it is not a Canadian
 * province or territory.
 */
export const toProvinceName = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text === "québec") return "Quebec";
  if (text === "yukon territory") return "Yukon";
  const match = PROVINCES.find((p) => p.code.toLowerCase() === text || p.name.toLowerCase() === text);
  return match ? match.name : "";
};

const describe = (label) => label.charAt(0).toUpperCase() + label.slice(1);

/** Error text for a person's name, or "" when it is fine. `optional` allows an empty value. */
export const nameError = (value, label = "name", { optional = false } = {}) => {
  const text = String(value || "").trim();
  if (!text) return optional ? "" : `${describe(label)} is required`;
  if (text.length > NAME_MAX) return `${describe(label)} must be ${NAME_MAX} characters or fewer`;
  if (!NAME_PATTERN.test(text)) {
    return `${describe(label)} can only contain letters, spaces, apostrophes, hyphens and periods`;
  }
  return "";
};

export const cityError = (value, { optional = false } = {}) => {
  const text = String(value || "").trim();
  if (!text) return optional ? "" : "City is required";
  if (text.length > CITY_MAX) return `City must be ${CITY_MAX} characters or fewer`;
  if (!CITY_PATTERN.test(text)) return "City can only contain letters, spaces, apostrophes, hyphens and periods";
  return "";
};

export const provinceError = (value, { optional = false } = {}) => {
  const text = String(value || "").trim();
  if (!text) return optional ? "" : "Select a province or territory";
  return toProvinceName(text) ? "" : "Select a Canadian province or territory";
};

export const postalCodeError = (value, { optional = false } = {}) => {
  const text = String(value || "").trim();
  if (!text) return optional ? "" : "Postal code is required";
  return POSTAL_CODE_PATTERN.test(text) ? "" : "Enter a valid Canadian postal code, e.g. T2P 1B5";
};

/** "t2p1b5" -> "T2P 1B5", leaving anything that is not a postal code as typed. */
export const formatPostalCode = (value) => {
  const text = String(value || "").trim().toUpperCase();
  const match = /^([A-Z]\d[A-Z])[ -]?(\d[A-Z]\d)$/.exec(text);
  return match ? `${match[1]} ${match[2]}` : text;
};

/* ── Phone ───────────────────────────────────────────────────────────── */

// Digit blocks that phones and keyboards commonly type instead of 0-9:
// Arabic-Indic, Extended Arabic-Indic (Persian/Urdu), Devanagari, Bengali and full-width.
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x0966, 0x09e6, 0xff10];

/** Rewrites other scripts' digits as 0-9 so "٥٨٧٥٥٥١٢٣٤" reads as a number. */
export const toAsciiDigits = (value) =>
  String(value || "").replace(/\p{Nd}/gu, (ch) => {
    const code = ch.codePointAt(0);
    const zero = DIGIT_ZEROS.find((z) => code >= z && code <= z + 9);
    return zero === undefined ? ch : String(code - zero);
  });

/** Every digit typed, in order, without dropping any. */
export const allPhoneDigits = (value) => toAsciiDigits(value).replace(/\D/g, "");

/** The 10-digit national number: a leading country code 1 is removed, nothing else is. */
export const phoneDigits = (value) => allPhoneDigits(value).replace(/^1(?=\d{10}$)/, "");

export const PHONE_EXAMPLE = "(587) 555-1234";

/** Error text for a Canadian phone number, or "" when it is fine. */
export const phoneError = (value, { optional = false } = {}) => {
  const raw = String(value || "").trim();
  if (!raw) return optional ? "" : "Phone number is required";
  const digits = phoneDigits(raw);
  if ([...toAsciiDigits(raw)].some((ch) => /\p{Nd}/u.test(ch) && !/[0-9]/.test(ch))) {
    return "Use the digits 0-9 for your phone number";
  }
  if (!digits) return `Enter a valid Canadian phone number, e.g. ${PHONE_EXAMPLE}`;
  if (digits.length > 10) return `Too many digits. Enter a 10-digit Canadian number, e.g. ${PHONE_EXAMPLE}`;
  if (digits.length < 10) return `Enter all 10 digits of a Canadian number, e.g. ${PHONE_EXAMPLE}`;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) {
    return "That is not a valid Canadian number: the area code and the next three digits cannot start with 0 or 1";
  }
  return "";
};

/**
 * Formats a number as (587) 555-1234 while it is being typed. A value with more
 * digits than a Canadian number holds is left as the digits typed, never cut
 * short, so the person sees the extra digit and the error explaining it.
 */
export const formatCanadianPhone = (value) => {
  const all = allPhoneDigits(value);
  const digits = all.replace(/^1(?=\d{10}$)/, "");
  if (digits.length > 10) return all;
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/** Collapses inner runs of spaces and trims, which is what is sent for a name. */
export const cleanName = (value) => String(value || "").trim().replace(/\s+/g, " ");
