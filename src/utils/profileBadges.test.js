import { profileBadges, BADGE_DEFINITIONS, KNOWN_BADGE_CODES } from "./profileBadges";

describe("the badge chips a profile renders", () => {
  it("presents each earned code as a labelled chip", () => {
    const badges = profileBadges(["TOP_RATED", "FIRST_BOOKING"]);
    expect(badges.map((badge) => badge.label)).toEqual([
      "Top rated",
      "First booking completed",
    ]);
    expect(badges[0].hint).toMatch(/4\.7/);
  });

  it("keeps the server's order instead of sorting by importance", () => {
    expect(profileBadges(["NEW", "TOP_RATED"]).map((badge) => badge.code)).toEqual([
      "NEW",
      "TOP_RATED",
    ]);
  });

  it("drops a code it cannot explain rather than printing it raw", () => {
    expect(profileBadges(["TOP_RATED", "SOMETHING_NEW", ""])).toHaveLength(1);
    expect(profileBadges(["SOMETHING_NEW"])).toEqual([]);
  });

  it("handles a payload that is missing, null or not a list", () => {
    expect(profileBadges(undefined)).toEqual([]);
    expect(profileBadges(null)).toEqual([]);
    expect(profileBadges("TOP_RATED")).toEqual([]);
    expect(profileBadges([])).toEqual([]);
  });

  it("accepts a lower-case or padded code without duplicating the definition", () => {
    const [badge] = profileBadges([" top_rated "]);
    expect(badge.code).toBe("TOP_RATED");
    expect(badge.label).toBe("Top rated");
  });

  it("gives every known badge a label, a hint and a tone", () => {
    KNOWN_BADGE_CODES.forEach((code) => {
      const definition = BADGE_DEFINITIONS[code];
      expect(definition.label).toBeTruthy();
      expect(definition.hint.length).toBeGreaterThan(10);
      expect(definition.tone).toBeTruthy();
    });
  });

  it("reserves the accent colour for the strongest signal", () => {
    expect(BADGE_DEFINITIONS.TOP_RATED.tone).toContain("brand");
    expect(BADGE_DEFINITIONS.NEW.tone).not.toContain("brand");
    expect(BADGE_DEFINITIONS.FIRST_BOOKING.tone).not.toContain("brand");
  });

  it("keeps the copy free of em dashes, like the rest of the site", () => {
    KNOWN_BADGE_CODES.forEach((code) => {
      expect(BADGE_DEFINITIONS[code].hint).not.toMatch(/[—–]/);
      expect(BADGE_DEFINITIONS[code].label).not.toMatch(/[—–]/);
    });
  });
});
