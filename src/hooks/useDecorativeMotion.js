import { useEffect, useState } from "react";

/** Avoid creating video sources on mobile or when visitors request less motion. */
export default function useDecorativeMotion() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const update = () => setAllowed(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return allowed;
}
