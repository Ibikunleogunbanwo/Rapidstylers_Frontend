import { getSessionRevision } from "./constant";

export const BOOKING_ATTEMPT_KEY = "rapidstylers_booking_attempt";
let memoryAttempt = null;

export const clearBookingAttempt = () => {
  memoryAttempt = null;
  try { sessionStorage.removeItem(BOOKING_ATTEMPT_KEY); } catch (_) {}
};

const readAttempt = () => {
  try {
    const stored = sessionStorage.getItem(BOOKING_ATTEMPT_KEY);
    return stored ? JSON.parse(stored) : memoryAttempt;
  } catch (_) { return memoryAttempt; }
};

const saveAttempt = (attempt) => {
  memoryAttempt = attempt;
  try { sessionStorage.setItem(BOOKING_ATTEMPT_KEY, JSON.stringify(attempt)); } catch (_) {}
};

/** Keep a Stripe token and retry key for one unchanged intent across uncertain responses. */
export const prepareBookingAttempt = async (details, collectPaymentMethod) => {
  const revision = getSessionRevision();
  const fingerprint = JSON.stringify(details);
  let attempt = readAttempt();
  if (!attempt || attempt.fingerprint !== fingerprint || attempt.revision !== revision || !attempt.key) {
    attempt = { fingerprint, revision, key: crypto.randomUUID() };
  }
  if (!Object.hasOwn(attempt, "paymentMethodId")) {
    attempt.paymentMethodId = await collectPaymentMethod();
    if (getSessionRevision() !== revision) throw new Error("Your session ended. Please sign in before booking.");
  }
  saveAttempt(attempt);
  return { key: attempt.key, payload: { ...details, paymentMethodId: attempt.paymentMethodId } };
};

export const isUncertainBookingFailure = (error) =>
  !error.response && ["ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK", "ERR_BOOKING_UNCONFIRMED"].includes(error.code)
  || error.response?.status >= 500
  // Current backend uses a business 400 while a duplicate is still pending.
  || /already being processed or was already submitted/i.test(error.response?.data?.message || "");
