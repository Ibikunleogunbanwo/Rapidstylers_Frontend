import {
  straightLineKm,
  roughDriveMinutes,
  formatDistance,
  formatDriveTime,
  proximityPhrase,
  travelLine,
} from "./travelEstimate";

const CALGARY = { latitude: 51.0447, longitude: -114.0719 };
// Roughly the north end of Calgary, about 14 km from downtown.
const NORTH_CALGARY = { latitude: 51.1537, longitude: -114.1797 };
const EDMONTON = { latitude: 53.5461, longitude: -113.4938 };

describe("straightLineKm", () => {
  it("measures the straight line between two points", () => {
    // Calgary to Edmonton is about 280 km in a straight line.
    const km = straightLineKm(CALGARY, EDMONTON);
    expect(km).toBeGreaterThan(275);
    expect(km).toBeLessThan(285);
  });

  it("rounds to the same precision the travel fee quotes", () => {
    expect(straightLineKm(CALGARY, CALGARY)).toBe(0);
    const km = straightLineKm(CALGARY, EDMONTON);
    expect(km).toBe(Math.round(km * 10) / 10);
  });

  it("accepts coordinates that arrive as strings", () => {
    const from = { latitude: "51.0447", longitude: "-114.0719" };
    expect(straightLineKm(from, EDMONTON)).toBe(straightLineKm(CALGARY, EDMONTON));
  });

  it("returns null when either point is incomplete", () => {
    expect(straightLineKm(CALGARY, { latitude: 53.5461 })).toBeNull();
    expect(straightLineKm(null, EDMONTON)).toBeNull();
    expect(straightLineKm(CALGARY, { latitude: null, longitude: null })).toBeNull();
  });

  it("treats a null coordinate as missing rather than as zero", () => {
    // Number(null) is 0, which would silently place the customer off West
    // Africa and report a distance of thousands of kilometres.
    const km = straightLineKm({ latitude: null, longitude: null }, EDMONTON);
    expect(km).toBeNull();
  });

  it("still accepts a genuine zero at the equator", () => {
    const km = straightLineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });
});

describe("roughDriveMinutes", () => {
  it("returns null when there is no distance to work from", () => {
    expect(roughDriveMinutes(null)).toBeNull();
    expect(roughDriveMinutes(undefined)).toBeNull();
    expect(roughDriveMinutes(NaN)).toBeNull();
  });

  it("allows for roads being longer than the straight line", () => {
    // 10 km straight line is 12.9 km of road, about 19 minutes at 40 km/h.
    expect(roughDriveMinutes(10)).toBe(19);
  });

  it("keeps a city trip priced at city speed", () => {
    // A cross-town 14 km is still 40 km/h: 18 km of road, 27 minutes.
    expect(roughDriveMinutes(14.3)).toBe(27);
  });

  it("moves toward highway speed as the trip leaves the city", () => {
    // 300 km straight line is 345 km of road, about 3 h 50 min at highway speed.
    // A city average here would claim five and a half hours.
    expect(roughDriveMinutes(300)).toBe(230);
    expect(formatDriveTime(roughDriveMinutes(300))).toBe("3 h 50 min");
  });

  it("grows with distance at every step", () => {
    const minutes = [1, 5, 20, 50, 120, 300, 700].map(roughDriveMinutes);
    for (let i = 1; i < minutes.length; i += 1) {
      expect(minutes[i]).toBeGreaterThan(minutes[i - 1]);
    }
  });

  it("never reports a zero-minute drive", () => {
    expect(roughDriveMinutes(0)).toBe(1);
  });
});

describe("formatDistance", () => {
  it("keeps a whole kilometre for short distances", () => {
    expect(formatDistance(6.4)).toBe("6 km");
    expect(formatDistance(19.5)).toBe("20 km");
  });

  it("rounds long distances to ten kilometres", () => {
    expect(formatDistance(324)).toBe("320 km");
    expect(formatDistance(1280)).toBe("1,280 km");
  });

  it("says under a kilometre rather than a decimal", () => {
    expect(formatDistance(0.4)).toBe("under 1 km");
    expect(formatDistance(0)).toBe("under 1 km");
  });

  it("says nothing without a distance", () => {
    expect(formatDistance(null)).toBe("");
    expect(formatDistance(-5)).toBe("");
  });
});

describe("formatDriveTime", () => {
  it("rounds up to five minutes below an hour", () => {
    expect(formatDriveTime(23)).toBe("25 min");
    expect(formatDriveTime(5)).toBe("5 min");
  });

  it("never says less than five minutes", () => {
    expect(formatDriveTime(1)).toBe("5 min");
    expect(formatDriveTime(0)).toBe("5 min");
  });

  it("rolls into hours rather than printing 60 minutes", () => {
    expect(formatDriveTime(59)).toBe("1 h");
    expect(formatDriveTime(60)).toBe("1 h");
    expect(formatDriveTime(105)).toBe("1 h 50 min");
  });

  it("rounds long drives up to ten minutes", () => {
    expect(formatDriveTime(334)).toBe("5 h 40 min");
    expect(formatDriveTime(214)).toBe("3 h 40 min");
    expect(formatDriveTime(200)).toBe("3 h 20 min");
  });

  it("says nothing without a time", () => {
    expect(formatDriveTime(null)).toBe("");
  });
});

describe("proximityPhrase", () => {
  it("describes a sub-kilometre trip without a decimal", () => {
    // "About under 1 km away" is what reusing formatDistance produced here.
    expect(proximityPhrase(0.4)).toBe("Less than 1 km away");
    expect(proximityPhrase(0)).toBe("Less than 1 km away");
  });

  it("reads as a distance for anything a kilometre or more", () => {
    expect(proximityPhrase(1)).toBe("About 1 km away");
    expect(proximityPhrase(14.3)).toBe("About 14 km away");
  });

  it("says nothing without a distance", () => {
    expect(proximityPhrase(null)).toBe("");
    expect(proximityPhrase(-3)).toBe("");
  });
});

describe("travelLine", () => {
  it("reads as one sentence for a trip of a few hundred metres", () => {
    expect(travelLine(0.4)).toBe("Less than 1 km away, roughly 5 min by road.");
  });

  it("reads as one sentence with distance and rough drive time", () => {
    // 10 km straight line, 13 km of road, 19.5 minutes at 40 km/h, said as 20.
    expect(travelLine(10)).toBe("About 10 km away, roughly 20 min by road.");
  });

  it("sizes up a real cross-town trip in figures a customer would recognise", () => {
    // Downtown Calgary to the north end: 14.3 km straight line, 18 km of road,
    // 27 minutes, said as 30.
    expect(travelLine(straightLineKm(CALGARY, NORTH_CALGARY))).toBe(
      "About 14 km away, roughly 30 min by road."
    );
  });

  it("sizes up a cross-province trip without overstating it", () => {
    // Calgary to Edmonton is about 280 km in a straight line and a three-hour
    // drive. The estimate has to land near that, or a customer reads a five-hour
    // journey and gives up on a professional who is genuinely reachable.
    expect(travelLine(straightLineKm(CALGARY, EDMONTON))).toBe(
      "About 280 km away, roughly 3 h 40 min by road."
    );
  });

  it("names a coarse position instead of letting it pass as measured", () => {
    expect(travelLine(10, { approximate: true })).toBe(
      "About 10 km away, roughly 20 min by road. Based on your approximate location."
    );
  });

  it("says nothing at all when there is no distance", () => {
    expect(travelLine(null)).toBeNull();
    expect(travelLine(undefined)).toBeNull();
    expect(travelLine(-1)).toBeNull();
  });
});
