import { useEffect } from "react";

const ADSENSE_CLIENT = process.env.REACT_APP_ADSENSE_CLIENT || "";

/**
 * Google AdSense unit, safe for an SPA.
 *
 * Renders NOTHING and loads NO scripts until REACT_APP_ADSENSE_CLIENT is set
 * in .env (after the site is approved by AdSense). On first use it injects the
 * AdSense loader script once; every mount then pushes a fresh fill request —
 * because the component remounts on route changes, ads refresh as the user
 * navigates.
 *
 * Usage: <AdSlot slot="1234567890" />  (slot = the AdSense ad unit id)
 */
const AdSlot = ({ slot, format = "auto", responsive = true, style }) => {
  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot) return;

    const push = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Ad blocker or duplicate push — nothing to do.
      }
    };

    if (!window.adsbygoogle) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      script.crossOrigin = "anonymous";
      script.onload = push;
      document.head.appendChild(script);
      return;
    }
    push();
    // ADSENSE_CLIENT is a module constant — it can never change at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  if (!ADSENSE_CLIENT || !slot) return null;

  return (
    <div className="overflow-hidden" style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default AdSlot;
