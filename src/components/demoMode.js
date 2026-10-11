import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { IS_DEMO, LIVE_SITE_URL } from "../utils/demo";

/**
 * Pages a demo visitor may browse. Everything else (sign-up, login, booking,
 * dashboards, the support form) belongs to real accounts, so the demo hands
 * the visitor to the same page on the live site. Admin pages stay, so the
 * showroom can be curated.
 */
const DEMO_BROWSE = [
  /^\/$/,
  /^\/search\/?$/,
  /^\/elevate-your-looks\/?$/,
  /^\/blog(\/.*)?$/,
  /^\/about\/?$/,
  /^\/terms-and-conditions\/?$/,
  /^\/privacy-policy\/?$/,
  /^\/faqs\/?$/,
  /^\/stylist\/.+/,
  /^\/stylistProfile\/.+/,
  /^\/admin(\/.*)?$/,
];

const leaveForLiveSite = (url) => window.location.replace(url);

export const isDemoBrowsePath = (pathname) => DEMO_BROWSE.some((re) => re.test(pathname));

/**
 * Demo showroom behaviour, invisible on the live site. On the demo it keeps
 * search engines away (noindex) and sends any account action to the live
 * site, so real sign-ups always land in the live database.
 */
const DemoMode = ({ demo = IS_DEMO, liveUrl = LIVE_SITE_URL, goTo = leaveForLiveSite }) => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!demo) return undefined;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [demo]);

  useEffect(() => {
    if (demo && !isDemoBrowsePath(pathname)) goTo(`${liveUrl}${pathname}${search}`);
  }, [demo, liveUrl, pathname, search, goTo]);

  return null;
};

export default DemoMode;
