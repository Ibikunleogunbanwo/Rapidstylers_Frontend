/** True on the demo showroom build (demo.rapidstylers.ca), set in its Vercel env. */
export const IS_DEMO = process.env.REACT_APP_DEMO_MODE === "true";
export const LIVE_SITE_URL = process.env.REACT_APP_LIVE_SITE_URL || "https://rapidstylers.ca";

/**
 * On the demo a visitor can open the booking form and pick a time, but cannot
 * submit it until launch. After launch, set REACT_APP_DEMO_BOOKING_OPEN=true
 * on the demo project and the submit button sends visitors to the live site.
 */
export const DEMO_BOOKING_OPEN = process.env.REACT_APP_DEMO_BOOKING_OPEN === "true";

/** What the demo booking submit button does: "closed", "live" (go to the live site), or null off the demo. */
export const demoBooking = (demo = IS_DEMO, open = DEMO_BOOKING_OPEN) => (!demo ? null : open ? "live" : "closed");
