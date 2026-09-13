import React, { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile challenge for the sign-in forms, paired with the
 * backend's TURNSTILE_SECRET_KEY check (audit check 12).
 *
 * Renders nothing when REACT_APP_TURNSTILE_SITE_KEY is unset, so the login pages
 * keep working while the keys are being set up — the backend treats a missing
 * configured challenge the same way, so the two stay in step.
 *
 * `resetSignal`: increment it after a failed sign-in. Turnstile tokens are
 * single use, so a retry carrying the previous token is rejected outright; the
 * reset issues a fresh challenge and clears the stale token.
 */
const TURNSTILE_SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY || "";
const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const TurnstileWidget = ({ onVerify, resetSignal = 0, siteKey = TURNSTILE_SITE_KEY }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        // A challenge that expires or errors must clear the token rather than
        // leave a stale one behind — otherwise the form submits a token the
        // backend will reject with a confusing "complete the challenge" error.
        callback: (token) => onVerify?.(token || ""),
        "expired-callback": () => onVerify?.(""),
        "error-callback": () => onVerify?.(""),
      });
    };

    if (window.turnstile) {
      render();
    } else if (document.getElementById(SCRIPT_ID)) {
      document.getElementById(SCRIPT_ID).addEventListener("load", render);
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {
          // The widget is already gone — nothing to tear down.
        }
        widgetIdRef.current = null;
      }
    };
  }, [onVerify]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onVerify?.("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="mt-1" />;
};

export default TurnstileWidget;
