/**
 * The badge chips a profile can carry, and what each one means to a visitor.
 *
 * The rules that *earn* a badge live on the server (ProfileBadgeRules), because
 * the facts behind them — approved reviews, finished bookings, the join date —
 * are the server's to know, and because every surface that shows a profile
 * should read one answer. This module only decides how an earned badge is
 * presented, so the copy can be tuned without touching what qualifies.
 *
 * Two properties matter here:
 *
 *   - A code the server sends that this file does not know is dropped, never
 *     printed raw. A badge nobody can explain is worse than no badge.
 *   - The hint states what earned the badge. A chip on a profile is a claim made
 *     about a real person, so a visitor should be able to see its basis rather
 *     than trust a decoration.
 *
 * Only Top rated carries the accent colour. The other two are quiet chips: they
 * set expectations or note an early milestone, and dressing them up like the
 * strongest signal on the page would flatten the difference between them.
 */

export const BADGE_DEFINITIONS = {
  TOP_RATED: {
    label: "Top rated",
    hint: "Rated 4.7 or higher from 10 or more reviews.",
    tone: "border-brand/40 text-brand",
  },
  FIRST_BOOKING: {
    label: "First booking completed",
    hint: "Has finished a booking here, and has no reviews yet.",
    tone: "border-black/10 text-black/55",
  },
  NEW: {
    label: "New",
    hint: "Joined in the last three months, with no bookings or reviews yet.",
    tone: "border-black/10 text-black/55",
  },
};

/** Every code the client can render, for guards and tests. */
export const KNOWN_BADGE_CODES = Object.keys(BADGE_DEFINITIONS);

/**
 * Turns the payload's badge codes into chips to render, preserving the server's
 * order. Anything unknown, missing or malformed yields no chip at all.
 */
export function profileBadges(codes) {
  if (!Array.isArray(codes)) return [];
  return codes
    .map((code) => {
      const definition = BADGE_DEFINITIONS[String(code || "").trim().toUpperCase()];
      return definition ? { code: String(code).trim().toUpperCase(), ...definition } : null;
    })
    .filter(Boolean);
}

export default profileBadges;
