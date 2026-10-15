import { useRef } from "react";
import { SERVICE_INSPIRATION } from "../utils/serviceInspiration";

export default function ServiceInspiration() {
  const rail = useRef(null);
  const drag = useRef(null);
  const startDrag = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.scrollSnapType = "none";
  };
  const moveDrag = (event) => {
    if (!drag.current) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
  };
  const endDrag = (event) => {
    drag.current = null;
    event.currentTarget.style.scrollSnapType = "";
  };
  const scroll = (direction) => {
    const element = rail.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: reducedMotion ? "auto" : "smooth" });
  };
  const onKeyDown = (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      scroll(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  return (
    <div className="min-w-0" aria-label="Service style inspiration">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-black/60">Explore all 11 categories</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll(-1)} aria-label="Previous styles"
            className="h-11 w-11 rounded-full border border-black/20 bg-white text-xl text-black hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">←</button>
          <button type="button" onClick={() => scroll(1)} aria-label="Next styles"
            className="h-11 w-11 rounded-full border border-black/20 bg-white text-xl text-black hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">→</button>
        </div>
      </div>
      <div ref={rail} role="region" aria-label="Browse service inspiration" tabIndex={0} onKeyDown={onKeyDown}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
        className="flex w-full cursor-grab select-none gap-4 overflow-x-auto active:cursor-grabbing overscroll-x-contain snap-x snap-proximity pb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        {SERVICE_INSPIRATION.map(group => {
          const image = group.images[0];
          return (
            <div key={group.name} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[28%]">
              <h3 className="mb-3 text-base font-medium text-onSurface">{group.name}</h3>
              <figure>
                <img draggable={false} src={image.src} alt={image.alt} width="800" height="800" loading="lazy" decoding="async"
                  className="aspect-square w-full rounded-xl bg-black/5 object-cover" />
                <figcaption className="mt-2 text-xs leading-snug text-black/70">{image.alt}</figcaption>
              </figure>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-black/55">AI generated style inspiration. These images are not examples of a professional’s work.</p>
    </div>
  );
}
