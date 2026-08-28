import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// React Router does not reset scroll position on navigation, so a click near
// the bottom of a long page (e.g. a blog card) lands on the next page still
// scrolled to the bottom — showing only the footer. We manage scrolling:
//   - PUSH (link click / redirect): scroll to top, or to the hash target.
//   - POP (back/forward buttons): restore the position saved for that entry,
//     so pressing Back returns you to exactly where you were.
// Native browser scroll restoration is disabled so it cannot fight this.
const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();

  // history entry key -> scrollY, captured continuously as the user scrolls so
  // the outgoing page's position is already saved the moment navigation fires.
  const positions = useRef({});
  const currentKey = useRef(key);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      positions.current[currentKey.current] = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    currentKey.current = key;

    const scrollToTop = () => window.scrollTo(0, 0);

    // Hash target (e.g. "/#blog"): scroll the element into view. Lazy pages
    // render after mount, so retry until the element exists.
    if (hash) {
      const id = hash.slice(1);
      let tries = 0;
      const attempt = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: "start" });
        } else if (tries < 20) {
          tries += 1;
          setTimeout(attempt, 100);
        }
      };
      setTimeout(attempt, 0);
      return;
    }

    if (navigationType === "POP") {
      const saved = positions.current[key];
      if (typeof saved === "number") {
        // The lazy page may not be tall enough yet — keep re-applying until
        // the document can actually reach the saved position.
        let tries = 0;
        const attempt = () => {
          window.scrollTo(0, saved);
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          if (tries < 15 && maxScroll < saved) {
            tries += 1;
            setTimeout(attempt, 100);
          }
        };
        attempt();
        return;
      }
    }

    scrollToTop();
  }, [pathname, hash, key, navigationType]);

  return null;
};

export default ScrollToTop;
