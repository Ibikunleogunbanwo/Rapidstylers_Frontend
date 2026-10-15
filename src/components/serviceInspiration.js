import { useState } from "react";

import { SERVICE_INSPIRATION } from "../utils/serviceInspiration";

export default function ServiceInspiration() {
  const [selected, setSelected] = useState(SERVICE_INSPIRATION[0].name);
  const group = SERVICE_INSPIRATION.find(service => service.name === selected);
  return (
    <div className="min-w-0" aria-label="Service style inspiration">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 md:flex-wrap md:overflow-visible" role="group" aria-label="Choose an inspiration category">
        {SERVICE_INSPIRATION.map(service => (
          <button key={service.name} type="button" aria-pressed={selected === service.name}
            onClick={() => setSelected(service.name)}
            className={`shrink-0 whitespace-nowrap min-h-11 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 ${selected === service.name ? "border-black bg-black text-white" : "border-black/20 bg-white text-black hover:border-black"}`}>
            {service.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:gap-4 max-w-sm mx-auto" aria-label={`${selected} inspiration`}>
        {group.images.slice(0, 1).map(image => (
          <figure key={image.src} className="min-w-0">
            <img src={image.src} alt={image.alt} width="800" height="800" loading="lazy" decoding="async"
              className="aspect-square w-full object-cover rounded-xl bg-black/5" />
            <figcaption className="mt-2 text-xs sm:text-sm leading-snug text-black/70">{image.alt}</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-black/55">AI generated style inspiration. These images are not examples of a professional’s work.</p>
    </div>
  );
}
