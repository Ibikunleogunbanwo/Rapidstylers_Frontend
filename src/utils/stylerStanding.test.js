import { describe, test, expect } from "vitest";
import { profileRatingLine } from "./stylerStanding";

/**
 * The line reports the rating and nothing else. Newness is a badge now, so
 * these tests pin that the line never drifts back into claiming it.
 */
describe("the line under a professional's name", () => {
  test("states the rating and the count", () => {
    expect(profileRatingLine({ averageRating: "4.5", reviewCount: 6 }))
      .toBe("Rated 4.5 out of 5 from 6 reviews");
  });

  test("does not say 'reviews' about a single review", () => {
    expect(profileRatingLine({ averageRating: "5", reviewCount: 1 }))
      .toBe("Rated 5 out of 5 from 1 review");
  });

  test("counts a review count the API sends as a string", () => {
    expect(profileRatingLine({ averageRating: "5", reviewCount: "3" }))
      .toBe("Rated 5 out of 5 from 3 reviews");
  });

  test("a zero average with no reviews is not a rating", () => {
    // The API sends 0.0 / 0 when nothing has been reviewed; that must not be
    // rendered as "Rated 0 out of 5".
    expect(profileRatingLine({ averageRating: "0", reviewCount: 0 })).toBe("No reviews yet");
  });

  test("says there are no reviews when nobody has reviewed them", () => {
    expect(profileRatingLine({ reviewCount: 0 })).toBe("No reviews yet");
    expect(profileRatingLine({ reviewCount: "0", averageRating: null })).toBe("No reviews yet");
  });

  test("never claims newness, whatever else the payload carries", () => {
    // A join date and a booking tally used to decide this line. They must no
    // longer move it: a brand new professional reads "No reviews yet" and the
    // New badge beside their name carries that claim.
    expect(profileRatingLine({
      reviewCount: 0,
      averageRating: "0",
      dateRegistered: "2026-09-15",
      appointmentCount: "0",
    })).toBe("No reviews yet");
  });

  test("a payload that never arrived still reads honestly", () => {
    expect(profileRatingLine()).toBe("No reviews yet");
    expect(profileRatingLine({})).toBe("No reviews yet");
  });
});
