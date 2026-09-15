/**
 * The sidebar quote card, in the site's quiet register: a hairline card, a
 * single brand rule as the only accent, and the attribution in the same
 * tracked uppercase used by every eyebrow. It used to be a purple gradient
 * slab with decorative circles and a scissors emoji — the exact "AI slop"
 * vocabulary the design language bans (no gradient washes, no shadow, no
 * icon-per-card).
 */
const Humour = () => {
  return (
    <div className="rounded-lg border border-black/10 bg-white px-5 py-6">
      <span aria-hidden="true" className="block h-px w-8 bg-brand"></span>
      <p className="mt-4 text-sm font-medium leading-relaxed text-onSurface">
        &ldquo;They say you can&rsquo;t buy happiness, but a fresh style comes
        pretty close.&rdquo;
      </p>
      <span className="mt-3 block text-[11px] uppercase tracking-[0.25em] text-muted font-semibold">
        RapidStylers
      </span>
    </div>
  );
};

export default Humour;
