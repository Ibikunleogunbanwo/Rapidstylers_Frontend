const Humour = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl px-6 py-8 text-white bg-gradient-to-br from-brand via-[#7B5CF0] to-[#5B3FD6] shadow-md">
      {/* decorative shapes */}
      <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/10"></div>
      <div className="absolute top-6 right-8 h-2 w-2 rounded-full bg-white/25"></div>

      <div className="relative grid gap-4 text-center">
        <span className="justify-self-center grid place-items-center h-12 w-12 rounded-full bg-white/15 text-2xl">
          &#9986;
        </span>
        <p className="text-sm font-medium leading-relaxed text-white/95">
          &ldquo;They say you can&rsquo;t buy happiness, but a fresh style comes
          pretty close.&rdquo;
        </p>
        <span className="text-[11px] uppercase tracking-[0.25em] text-white/70 font-semibold">
          RapidStylers
        </span>
      </div>
    </div>
  );
};

export default Humour;
