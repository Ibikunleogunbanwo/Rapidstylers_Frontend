/**
 * How far away a professional is, in terms a customer can act on.
 *
 * The customer's coordinates are already collected for the home-service travel
 * fee, and the professional's come from the geocoded business address. Those two
 * points answer the question a visitor to the booking modal actually has — "is
 * this realistically near me?" — without asking for a location a second time.
 *
 * Everything here is deliberately an estimate, and the wording never pretends
 * otherwise. The distance is a straight line between two points, not a routed
 * drive, and no traffic data is involved, so the time is a rough figure rather
 * than a promise. Coarse positions (IP or app default) are labelled separately,
 * because a city-centroid guess can be tens of kilometres out and a customer who
 * reads it as a real distance will be misled about the trip.
 */

const EARTH_RADIUS_KM = 6371;

// Road distance is never shorter than the straight line, and how much longer
// falls as a trip gets longer: a cross-town drive wanders, a highway run does
// not. Speed rises for the same reason — a trip long enough to leave the city
// spends most of its time at highway speed, and pricing it at a city average
// would turn Calgary to Edmonton into a five-hour journey nobody would drive.
const NEAR_DETOUR = 1.3;
const FAR_DETOUR = 1.15;
const BLEND_KM = 100;   // straight-line distance beyond which the far factor applies
const NEAR_ROAD_KM = 25;
const FAR_ROAD_KM = 100;
const NEAR_KMH = 40;
const FAR_KMH = 90;

/** Coordinates may arrive as JSON numbers or strings; absent values are absent,
 *  not zero. `Number(null)` is 0, which would put the customer in the Gulf of
 *  Guinea and report a distance of thousands of kilometres. */
const asCoordinate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

/**
 * Straight-line distance in kilometres, rounded to 100 m — the precision the
 * home-service travel fee is quoted at, so both surfaces report the same figure.
 * Returns null when either point is incomplete, which is the caller's signal to
 * say nothing rather than to guess.
 */
export function straightLineKm(from, to) {
  const fromLat = asCoordinate(from?.latitude);
  const fromLng = asCoordinate(from?.longitude);
  const toLat = asCoordinate(to?.latitude);
  const toLng = asCoordinate(to?.longitude);
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === null)) return null;

  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const km = EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(km * 10) / 10;
}

/** Longer trips deviate from the straight line proportionally less. */
const detourFor = (km) =>
  km >= BLEND_KM
    ? FAR_DETOUR
    : NEAR_DETOUR - (NEAR_DETOUR - FAR_DETOUR) * (km / BLEND_KM);

/** Blended average speed, rising from city to highway as the road distance grows. */
const speedFor = (roadKm) => {
  if (roadKm <= NEAR_ROAD_KM) return NEAR_KMH;
  if (roadKm >= FAR_ROAD_KM) return FAR_KMH;
  return NEAR_KMH + (FAR_KMH - NEAR_KMH) * ((roadKm - NEAR_ROAD_KM) / (FAR_ROAD_KM - NEAR_ROAD_KM));
};

/**
 * A rough drive time in minutes from that straight-line distance. Returns null
 * for a missing or negative distance so callers never render "0 min".
 */
export function roughDriveMinutes(km) {
  const distance = asCoordinate(km);
  if (distance === null || distance < 0) return null;
  const roadKm = distance * detourFor(distance);
  return Math.max(1, Math.round((roadKm / speedFor(roadKm)) * 60));
}

/**
 * A distance a person can read. Small figures keep a whole kilometre, because
 * a decimal on a straight line implies precision the number does not have;
 * anything past 100 km rounds to ten, since that is as close as a city-level
 * position honestly gets.
 */
export function formatDistance(km) {
  const distance = asCoordinate(km);
  if (distance === null || distance < 0) return "";
  if (distance < 1) return "under 1 km";
  const rounded = distance < 100 ? Math.max(1, Math.round(distance)) : Math.round(distance / 10) * 10;
  return `${rounded.toLocaleString("en-CA")} km`;
}

/**
 * A drive time a person can read, in multiples of five minutes below an hour
 * and in ten-minute steps above it. Anything tighter would dress up a guess,
 * and both paths round up so the figure never understates a journey.
 */
export function formatDriveTime(minutes) {
  const total = asCoordinate(minutes);
  if (total === null || total < 0) return "";
  const nearest = Math.max(5, Math.ceil(total / 5) * 5);
  if (nearest < 60) return `${nearest} min`;
  const rounded = Math.ceil(total / 10) * 10;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded - hours * 60;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

/**
 * How to say the distance out loud. Below a kilometre this deliberately stops
 * reusing {@link formatDistance}: "About under 1 km away" is not a sentence, and
 * a straight-line figure that small is better described as less than a
 * kilometre than dressed up with a decimal.
 */
export function proximityPhrase(km) {
  const distance = asCoordinate(km);
  if (distance === null || distance < 0) return "";
  if (distance < 1) return "Less than 1 km away";
  return `About ${formatDistance(distance)} away`;
}

/**
 * The one line the booking modal shows under the professional's address, so the
 * sentence lives here with its wording pinned by tests rather than inside a
 * component. Null when there is nothing to say — no complete pair of points,
 * which is the common case for a visitor who has not shared a location.
 *
 * `approximate` marks a position derived from IP or the app default rather than
 * GPS, and names that in the copy instead of letting a coarse guess pass for a
 * measured one.
 */
export function travelLine(km, { approximate = false } = {}) {
  const proximity = proximityPhrase(km);
  const drive = formatDriveTime(roughDriveMinutes(km));
  if (!proximity || !drive) return null;
  const basis = approximate ? " Based on your approximate location." : "";
  return `${proximity}, roughly ${drive} by road.${basis}`;
}
