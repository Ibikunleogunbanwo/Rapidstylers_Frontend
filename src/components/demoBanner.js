import { useEffect } from "react";

/** True on the demo showroom build (demo.rapidstylers.ca), set in its Vercel env. */
export const IS_DEMO = process.env.REACT_APP_DEMO_MODE === "true";
export const LIVE_SITE_URL = process.env.REACT_APP_LIVE_SITE_URL || "https://rapidstylers.ca";

/**
 * The strip across the top of the demo showroom. The demo shows sample
 * stylists for adverts; signing up and booking happen on the live site, so the
 * banner says so before a visitor tries. It also tells search engines not to
 * index the demo, so it never competes with the real site in results.
 * Renders nothing on the live site.
 */
const DemoBanner = ({ demo = IS_DEMO, liveUrl = LIVE_SITE_URL }) => {
  useEffect(() => {
    if (!demo) return undefined;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [demo]);

  if (!demo) return null;
  return (
    <div role="note" className="bg-violet-700 px-4 py-2 text-center text-xs text-white sm:text-sm">
      You are viewing the RapidStylers demo with sample stylists.{" "}
      <a href={liveUrl} className="font-semibold underline underline-offset-2">
        Sign up or book on rapidstylers.ca
      </a>
    </div>
  );
};

export default DemoBanner;
