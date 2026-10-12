/**
 * The topics a support ticket can be filed under, as the backend names them
 * (POST /support_tickets "category"), with the words people see.
 */
export const SUPPORT_CATEGORIES = [
  ["BOOKING", "Booking"],
  ["PAYMENT", "Payment"],
  ["ACCOUNT", "Account"],
  ["TECHNICAL", "Technical"],
  ["OTHER", "Other"],
];

/** "Payment" for PAYMENT; an unknown value reads as itself, a missing one as "". */
export const supportCategoryLabel = (value) => {
  if (!value) return "";
  const match = SUPPORT_CATEGORIES.find(([key]) => key === String(value).toUpperCase());
  return match ? match[1] : String(value);
};
