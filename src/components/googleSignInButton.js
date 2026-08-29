import React, { useEffect, useRef, useState } from "react";
import { APIService } from "../hooks/remote/apiService";

// Google Sign-In client id (public). When absent the button is hidden.
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

/**
 * "Continue with Google" button backed by Google Identity Services.
 *
 * Loads the GIS script lazily, renders the branded button, exchanges the
 * returned credential through APIService.googleSignIn and hands the full
 * response to onSuccess(res). Failures surface via onError(message).
 * Renders nothing when REACT_APP_GOOGLE_CLIENT_ID is not configured.
 */
const GoogleSignInButton = ({ onSuccess, onError, text = "continue_with", size = "large" }) => {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initializedRef.current || !containerRef.current) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current) return;
      if (!window.google?.accounts?.id) return;
      initializedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (payload) => {
          if (!payload?.credential) {
            onError?.("Google sign-in returned no credential.");
            return;
          }
          setBusy(true);
          try {
            const res = await APIService.googleSignIn(payload.credential);
            onSuccess?.(res);
          } catch (error) {
            onError?.(error?.response?.data?.message || error?.message || "Google sign in failed");
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size,
        shape: "rectangular",
        width: containerRef.current.clientWidth || 320,
        text,
      });
    };

    if (window.google?.accounts?.id) {
      render();
    } else if (document.getElementById("gsi-client")) {
      document.getElementById("gsi-client").addEventListener("load", render);
    } else {
      const script = document.createElement("script");
      script.id = "gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  if (busy) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-xl py-3">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Signing in with Google...
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
};

export default GoogleSignInButton;
