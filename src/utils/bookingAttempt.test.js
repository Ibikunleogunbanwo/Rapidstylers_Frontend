import { prepareBookingAttempt, clearBookingAttempt, BOOKING_ATTEMPT_KEY, isUncertainBookingFailure } from "./bookingAttempt";
import { clearAllSessionTokens } from "./constant";

const details = { stylerId: "s1", subServiceId: "ss1", appointmentDate: "2030-04-05", arrivalTime: "16:00", serviceTime: "visitBarber", noOfPeople: "1", travelDistanceKm: 0 };
beforeEach(() => { sessionStorage.clear(); clearBookingAttempt(); });

test("unchanged retry restores the key and Stripe reference without collecting another card", async () => {
  const first = await prepareBookingAttempt(details, async () => "pm-first");
  const retry = await prepareBookingAttempt(details, async () => { throw new Error("card should be reused"); });
  expect(retry).toEqual(first);
  expect(JSON.parse(sessionStorage.getItem(BOOKING_ATTEMPT_KEY)).key).toBe(first.key);
});

test("changing the party or slot creates a distinct booking key", async () => {
  const first = await prepareBookingAttempt(details, async () => "pm-first");
  const changed = await prepareBookingAttempt({ ...details, noOfPeople: "2" }, async () => "pm-next");
  expect(changed.key).not.toBe(first.key);
  expect(changed.payload.paymentMethodId).toBe("pm-next");
});

test("logout drops a saved booking attempt", async () => {
  await prepareBookingAttempt(details, async () => "pm-first");
  clearAllSessionTokens();
  expect(sessionStorage.getItem(BOOKING_ATTEMPT_KEY)).toBeNull();
});

test("logout during card collection cannot persist or send the old attempt", async () => {
  let finish;
  const pending = prepareBookingAttempt(details, () => new Promise(resolve => { finish = resolve; }));
  clearAllSessionTokens();
  finish("pm-old");
  await expect(pending).rejects.toThrow(/session ended/i);
  expect(sessionStorage.getItem(BOOKING_ATTEMPT_KEY)).toBeNull();
});

test("in-progress duplicates and malformed confirmations preserve the retry intent", () => {
  expect(isUncertainBookingFailure({ code: "ERR_BOOKING_UNCONFIRMED" })).toBe(true);
  expect(isUncertainBookingFailure({ response: { status: 400, data: { message: "This booking request is already being processed or was already submitted" } } })).toBe(true);
  expect(isUncertainBookingFailure({ response: { status: 400, data: { message: "Appointment date cannot be in the past" } } })).toBe(false);
});
