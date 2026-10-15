/** True on the demo showroom build (demo.rapidstylers.ca), set in its Vercel env. */
export const IS_DEMO = process.env.REACT_APP_DEMO_MODE === "true";
export const LIVE_SITE_URL = process.env.REACT_APP_LIVE_SITE_URL || "https://rapidstylers.ca";
/** The live API, used by the demo only for newsletter sign-ups (the demo API is read-only). */
export const LIVE_API_BASE_URL = process.env.REACT_APP_LIVE_API_BASE_URL || "https://api.rapidstylers.ca/rapid_stylers";

/**
 * On the demo a visitor can open the booking form and pick a time, but cannot
 * submit it until launch. After launch, set REACT_APP_DEMO_BOOKING_OPEN=true
 * on the demo project and the submit button sends visitors to the live site.
 */
/** Send a demo visitor to a page on the live site (sign-up and anything else that needs an account). */
export const goToLiveSite = (path = "/") => window.location.assign(`${LIVE_SITE_URL}${path}`);

export const DEMO_BOOKING_OPEN = process.env.REACT_APP_DEMO_BOOKING_OPEN === "true";

/** What the demo booking submit button does: "closed", "live" (go to the live site), or null off the demo. */
export const demoBooking = (demo = IS_DEMO, open = DEMO_BOOKING_OPEN) => (!demo ? null : open ? "live" : "closed");
