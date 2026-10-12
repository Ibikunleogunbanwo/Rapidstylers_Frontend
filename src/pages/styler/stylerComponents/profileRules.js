/**
 * The field rules for the professional's own profile screens, written once so
 * the personal and business forms check exactly what the backend checks
 * (shared validation contract, QA round 2026-10-12).
 */

// Letters in any script (accents, CJK), then letters, marks, spaces,
// apostrophes, periods and hyphens. No digits, symbols, HTML or emoji.
export const PERSON_NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]{0,49}$/u;
export const PERSON_NAME_MESSAGE = "Use letters, spaces, apostrophes, periods or hyphens (up to 50)";
export const CITY_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]{0,59}$/u;
export const CITY_MESSAGE = "Enter a city name using letters only";
export const POSTAL_CODE_PATTERN = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
export const POSTAL_CODE_MESSAGE = "Enter a Canadian postal code, e.g. T2P 1B5";

export const PROVINCES = [
  { name: "Alberta", code: "AB" },
  { name: "British Columbia", code: "BC" },
  { name: "Manitoba", code: "MB" },
  { name: "New Brunswick", code: "NB" },
  { name: "Newfoundland and Labrador", code: "NL" },
  { name: "Northwest Territories", code: "NT" },
  { name: "Nova Scotia", code: "NS" },
  { name: "Nunavut", code: "NU" },
  { name: "Ontario", code: "ON" },
  { name: "Prince Edward Island", code: "PE" },
  { name: "Quebec", code: "QC" },
  { name: "Saskatchewan", code: "SK" },
  { name: "Yukon", code: "YT" },
];

/** The full province name for a stored name or code, or "" when it is not Canadian. */
export const provinceName = (value) => {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "";
  if (key === "québec") return "Quebec";
  const match = PROVINCES.find((p) => p.name.toLowerCase() === key || p.code.toLowerCase() === key);
  return match ? match.name : "";
};

// Canadian IANA zones a professional can work in, each labelled with the area
// it covers. Saskatchewan and parts of BC stay on standard time all year.
export const CANADIAN_TIME_ZONES = [
  { id: "America/St_Johns", label: "Newfoundland Time (St. John's)" },
  { id: "America/Halifax", label: "Atlantic Time (Nova Scotia, PEI)" },
  { id: "America/Glace_Bay", label: "Atlantic Time (Cape Breton)" },
  { id: "America/Moncton", label: "Atlantic Time (New Brunswick)" },
  { id: "America/Goose_Bay", label: "Atlantic Time (Labrador)" },
  { id: "America/Toronto", label: "Eastern Time (Ontario, Quebec)" },
  { id: "America/Iqaluit", label: "Eastern Time (Iqaluit)" },
  { id: "America/Winnipeg", label: "Central Time (Manitoba)" },
  { id: "America/Rankin_Inlet", label: "Central Time (Rankin Inlet)" },
  { id: "America/Regina", label: "Central Standard Time (Saskatchewan)" },
  { id: "America/Swift_Current", label: "Central Standard Time (Swift Current)" },
  { id: "America/Edmonton", label: "Mountain Time (Alberta)" },
  { id: "America/Yellowknife", label: "Mountain Time (Northwest Territories)" },
  { id: "America/Inuvik", label: "Mountain Time (Inuvik)" },
  { id: "America/Cambridge_Bay", label: "Mountain Time (Cambridge Bay)" },
  { id: "America/Dawson_Creek", label: "Mountain Standard Time (Dawson Creek)" },
  { id: "America/Fort_Nelson", label: "Mountain Standard Time (Fort Nelson)" },
  { id: "America/Creston", label: "Mountain Standard Time (Creston)" },
  { id: "America/Vancouver", label: "Pacific Time (British Columbia)" },
  { id: "America/Whitehorse", label: "Yukon Time (Whitehorse)" },
  { id: "America/Dawson", label: "Yukon Time (Dawson)" },
];

/** Every digit typed, nothing dropped: extra digits must show up as an error, not vanish. */
export const phoneDigits = (value) => String(value || "").replace(/\D/g, "");

/** The ten digits the backend stores, or null when the number is not a valid Canadian one. */
export const canadianPhone = (value) => {
  let digits = phoneDigits(value);
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? digits : null;
};

export const phoneProblem = (value) => {
  if (/[^\d\s()+.-]/.test(String(value || ""))) return "Use the digits 0-9 only, e.g. (587) 555-1234";
  const digits = phoneDigits(value);
  if (!digits) return "Phone number is required";
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return "Enter 10 digits, e.g. (587) 555-1234";
  if (!canadianPhone(value)) return "Area code and exchange cannot start with 0 or 1";
  return null;
};

/** Pretty-prints as the person types, without ever cutting digits off. */
export const formatCanadianPhone = (value) => {
  const raw = String(value || "");
  if (/[^\d\s()+.-]/.test(raw)) return raw;
  const digits = phoneDigits(raw);
  if (digits.startsWith("1") || digits.length > 10) return digits;
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
