/**
 * Telling "this email already has an account" apart from every other signup
 * failure.
 *
 * Both sign-up endpoints refuse a second account on an email that is already in
 * either table, with one of two near-identical sentences:
 *
 *   - "Email Address already exists, Kindly choose another email address"
 *     (customer sign-up, /create_user_account)
 *   - "Email Address already exists, Kindly choose another email"
 *     (professional sign-up, /create_styler)
 *
 * That reply is not really an error to the person reading it: they already have
 * an account, so signing in is what they actually want. Recognising it lets the
 * screens offer that instead of a dead-end message.
 *
 * The match is anchored to the word "email" and stays inside one sentence
 * (`[^.!?]*`), so it accepts either wording above but not a *different* field's
 * clash: the backend also answers "Phone number already registered", which is
 * not solved by signing in and must keep its own message.
 */
const EMAIL_ALREADY_EXISTS = /email[^.!?]*already\s+(?:exists|registered)/i;

export function isAccountAlreadyExists(message) {
  return typeof message === "string" && EMAIL_ALREADY_EXISTS.test(message);
}
