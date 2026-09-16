/**
 * The single line under a professional's name: their rating when they have one,
 * and otherwise a plain statement that nobody has reviewed them.
 *
 * This line used to have a second job, claiming "New on RapidStylers" for a
 * profile that could support it. That claim has moved to the New badge
 * (utils/profileBadges, earned on the server by ProfileBadgeRules), for two
 * reasons: newness is now stated exactly once on the page instead of twice in
 * two voices, and a badge can carry the explanation of what earned it, which a
 * sentence in the header cannot.
 *
 * So the line says one thing. A professional with a rating gets it; a
 * professional without one reads "No reviews yet", and whether they are new is
 * answered by the badge beside their name, or by nothing at all.
 */

/** A count that may arrive from the API as a string, or not at all. */
function asCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function profileRatingLine(info = {}) {
  const reviews = asCount(info.reviewCount);
  if (info.averageRating != null && reviews > 0) {
    return `Rated ${info.averageRating} out of 5 from ${reviews} review${reviews === 1 ? "" : "s"}`;
  }
  return "No reviews yet";
}

export default profileRatingLine;
