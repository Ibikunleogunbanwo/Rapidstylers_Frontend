import { useEffect, useState } from "react";

/** Respect reduced motion; callers can opt into video at smaller widths. */
export default function useDecorativeMotion(minWidth = 1024) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia(minWidth ? `(min-width: ${minWidth}px) and (prefers-reduced-motion: no-preference)` : "(prefers-reduced-motion: no-preference)");
    const update = () => setAllowed(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [minWidth]);
  return allowed;
}
