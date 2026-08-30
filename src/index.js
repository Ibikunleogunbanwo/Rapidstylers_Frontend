import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './hooks/local/store';
import { createChunkReloadGuard } from './utils/staleChunkGuard';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
    <App />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();

// ---- Stale-shell recovery ------------------------------------------------
// CRA code-splits routes into content-hashed chunks. After a redeploy the old
// bundle names disappear, so a visitor still running a previous deploy (cached
// index.html -> old main hash -> old chunk hashes) 404s on those chunks and the
// page bricks until a manual hard refresh. Two guards below self-heal it.
// Shared reload guard: exactly one reload per session, shared across the boot
// manifest check and the runtime chunk-error handler so they can't double-fire.
const staleShellGuard = createChunkReloadGuard();

// 1. Boot-time manifest check: fetch the LIVE // index.html (served no-store)
// and compare the canonical main-bundle URL it references to the one this page
// is running. A mismatch means we booted from a stale shell, so hard-reload to
// pick up the current asset map before any route lazy-loads old chunks.
(() => {
  const runningScript = document.querySelector('script[src*="/static/js/main."]');
  const runningMain = runningScript?.getAttribute("src") || "";
  if (!runningMain) return;
  // Guard: if this fetch races with the reload below, give it one shot total.
  window.addEventListener("load", async function bootCheck() {
    window.removeEventListener("load", bootCheck);
    if (staleShellGuard.attempted) return;
    try {
      const res = await fetch(window.location.origin + "/index.html", { cache: "no-store" });
      const html = await res.text();
      const m = html.match(/src="([^"]*\/static\/js\/main\.[^"]+?)"/);
      if (m && m[1] && m[1] !== runningMain) {
        if (staleShellGuard.claim()) window.location.reload();
      }
    } catch (_) {
      /* offline or network error: keep the running shell */
    }
  });
})();

// 2. Runtime chunk-load errors: a route lazy-load can still race a redeploy
// mid-session. When a chunk 404s, reload once for the new bundle.
window.addEventListener("error", (event) => {
  staleShellGuard.handleError(event);
});
