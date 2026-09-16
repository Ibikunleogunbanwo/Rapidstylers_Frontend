import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// React Router does not reset scroll position on navigation, so a click near
// the bottom of a long page lands the next page still scrolled to the bottom.
// We manage scrolling ourselves:
//   - PUSH (link click / redirect): go to the top, or to the hash target.
//   - POP (back/forward): restore the offset saved for that history entry.
// Native browser scroll restoration is disabled so it cannot fight this.
//
// Two things the naive version gets wrong, both visible as "Back did not put me
// where I was":
//
//   1. Recording. The offset was captured from every scroll event, attributed
//      to whatever entry was current. Events fired by the *layout* — the next
//      page clamping a taller scroll offset, images decoding, async sections
//      mounting — are not the user's doing, and recording them overwrites the
//      position the user actually left behind.
//   2. Restoring once. The landing page renders short and grows as its images
//      and data arrive. Applying the saved offset a single time (or only while
//      the document is shorter than the target) lets Chrome's scroll anchoring
//      carry the viewport off to a new offset as the content above grows, so
//      the visitor returns hundreds of pixels from where they clicked even
//      though the document ends up exactly as tall as before.
//
// So a navigation now *freezes* recording, and the target is re-applied every
// frame until the document has held its height for a quiet period. Real user
// input — scrolling, tapping, typing — releases the hold immediately, because
// intent beats restoration.
//
// The quiet period is measured, not guessed: on this landing page the document
// keeps changing height for a few hundred milliseconds after the route mounts
// (async sections, image decode), and Chrome re-anchors the offset *after* its
// own layout pass — so a window that closes on the first stable frame loses the
// target again ~75ms later.
const SETTLE_QUIET_MS = 700;
const SETTLE_LIMIT_MS = 4000;

const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();

  // history entry key -> scroll offset the user last left there.
  const positions = useRef({});
  const currentKey = useRef(key);
  // True from the moment a navigation starts until the destination's layout
  // settles: scroll events are layout noise, and the target keeps being applied.
  const holding = useRef(false);
  const frame = useRef(0);
  const releaseTimer = useRef(0);

  const stopHolding = () => {
    holding.current = false;
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    if (releaseTimer.current) {
      window.clearTimeout(releaseTimer.current);
      releaseTimer.current = 0;
    }
  };

  // Applies `apply` every frame until it reports success and the document stops
  // changing height for a quiet period, or until the limit is reached.
  // Re-applying is what defeats scroll anchoring: the browser may move the
  // offset, but it cannot outlast a write on the following frame.
  const holdTarget = (apply) => {
    stopHolding();
    holding.current = true;
    const startedAt = performance.now();
    let lastHeight = -1;
    let lastChangeAt = startedAt;

    apply();

    const step = () => {
      if (!holding.current) return;
      const satisfied = apply();
      const now = performance.now();
      const height = document.documentElement.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        lastChangeAt = now;
      }
      const quiet = now - lastChangeAt >= SETTLE_QUIET_MS;
      if ((satisfied && quiet) || now - startedAt > SETTLE_LIMIT_MS) {
        stopHolding();
        return;
      }
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
  };

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Record the user's own scrolling only.
  useEffect(() => {
    const onScroll = () => {
      if (holding.current) return;
      positions.current[currentKey.current] = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Freeze the outgoing entry's position the instant a navigation begins.
  // Without this, the mounting page clamps a taller offset to its own height
  // (or the Suspense fallback clamps it to one screen) and the scroll event
  // that follows is attributed to the entry we are leaving, destroying the very
  // position Back is supposed to restore.
  useEffect(() => {
    const freeze = () => {
      if (holding.current) return;
      positions.current[currentKey.current] = window.scrollY;
      holding.current = true;
      const frozenKey = currentKey.current;
      // If no navigation followed (a modified click, an intercepted link, a pop
      // that led nowhere), stop suppressing the user's scrolling again.
      releaseTimer.current = window.setTimeout(() => {
        releaseTimer.current = 0;
        if (currentKey.current === frozenKey) holding.current = false;
      }, 800);
    };

    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.origin !== window.location.origin) return;
      freeze();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", freeze, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", freeze, true);
    };
  }, []);

  // User intent always wins: releasing the hold re-enables recording and stops
  // re-applying the target mid-gesture.
  useEffect(() => {
    const interrupt = () => stopHolding();
    const events = ["wheel", "touchstart", "pointerdown", "keydown"];
    events.forEach((name) => window.addEventListener(name, interrupt, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, interrupt));
  }, []);

  useLayoutEffect(() => {
    currentKey.current = key;

    // Hash target (e.g. "/#blog"): scroll the element into view. Lazy pages
    // render after mount, so keep trying until it exists.
    if (hash) {
      const id = hash.slice(1);
      holdTarget(() => {
        const el = document.getElementById(id);
        if (!el) return false;
        el.scrollIntoView({ block: "start" });
        return true;
      });
      return stopHolding;
    }

    if (navigationType === "POP") {
      const saved = positions.current[key];
      if (typeof saved === "number") {
        holdTarget(() => {
          window.scrollTo(0, saved);
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          // Satisfied on arriving at the offset, or on being pinned to the
          // bottom of a document that is still too short to reach it.
          return Math.abs(window.scrollY - saved) <= 1 || window.scrollY >= maxScroll - 1;
        });
        return stopHolding;
      }
    }

    holdTarget(() => {
      window.scrollTo(0, 0);
      return window.scrollY <= 1;
    });
    return stopHolding;
  }, [pathname, hash, key, navigationType]);

  return null;
};

export default ScrollToTop;
