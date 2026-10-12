import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import SearchForStyler from "../../components/searchForStyler";
import PublicHeader from "../../components/publicHeader";
import { APIService } from "../../hooks/remote/apiService";
import useDecorativeMotion from "../../hooks/useDecorativeMotion";
import heroPoster from "../../assets/images/hero-poster.jpg";
import largeVideo from "../../assets/Videos/hero-loop.mp4";

const Hero = ({ height, homepage }) => {
  const isLanding = useLocation().pathname === "/";
  const [services, setServices] = useState([]);
  const allowHeroMotion = useDecorativeMotion(0);

  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        // Ids ride along so each service pill can deep-link into a pre-filtered search.
        setServices(
          items
            .map((c) => ({
              id: String(c.serviceTypeId ?? c.id ?? ""),
              name: c.serviceTypeName || c.serviceName || c.name || c.serviceType || "",
            }))
            .filter((c) => c.id && c.name)
        );
      })
      .catch(() => {});
  }, []);

  return (
    /* Below lg the fixed header floats over the page, so the hero reserves its
       height (64px phones, 76px md+) on a black strip that continues into the
       video; at lg the header is meant to float over the full-bleed video. */
    <div className="relative z-10 bg-black pt-16 md:pt-[76px] lg:bg-transparent lg:pt-0 lg:h-[var(--hero-h)]" style={{ "--hero-h": height }}>
      <div className="w-full lg:h-full overflow-hidden">
        <div className="w-full lg:h-full relative">
          {/* Landing */}
          <div className={`relative flex flex-col w-full lg:block lg:h-full ${isLanding ? "" : "hidden"}`}>
            {/* Reduced-motion visits retain the poster on every screen size. */}
            <div className="relative w-full aspect-video shrink-0 overflow-hidden lg:aspect-auto lg:h-full">
              {homepage?.heroImageUrl && /^https:\/\//.test(homepage.heroImageUrl) ? <img src={homepage.heroImageUrl} alt="" className="h-full w-full object-cover" /> : allowHeroMotion && isLanding ? (
                <video autoPlay loop muted playsInline preload="metadata" poster={heroPoster} src={largeVideo} className="h-full w-full object-cover object-center">
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img src={heroPoster} alt="Beauty tools ready for your appointment" fetchpriority="high" className="h-full w-full object-cover object-center" />
              )}
              {/* On large screens the copy sits on the photo, so darken it from the
                  text side: the chips and subtitle stay readable over the
                  bright part of the image. */}
              <div className="pointer-events-none absolute inset-0 hidden lg:block bg-gradient-to-t from-black/85 via-black/45 to-black/10" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 hidden lg:block bg-gradient-to-r from-black/60 via-black/25 to-transparent" aria-hidden="true" />
              {/* Soft blend into the dark text section below (stacked layout only) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/90 to-transparent lg:hidden" aria-hidden="true" />
            </div>
            {/* Text: below the image on small/medium; overlaid on the video on large */}
            <div className="grow bg-black lg:bg-transparent lg:grow-0 lg:absolute lg:inset-0 lg:flex lg:items-end lg:justify-start">
              <div className="px-4 py-10 sm:px-8 md:px-12 text-center lg:w-[72%] xl:w-[55%] lg:px-0 lg:ps-20 lg:pb-20 lg:text-start">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 text-center lg:text-start">
                  What you can book today
                </p>
                <h1 className="mt-4 text-[clamp(1.9rem,4.5vw,2.75rem)] font-normal leading-[1.08] tracking-[-0.02em] text-white text-center lg:text-start">
                  {homepage?.heroTitle || <>Beauty services <span className="text-brand">at home or at a stylist’s location</span></>}
                </h1>
                <p className="mt-4 text-white/70 text-sm sm:text-base text-center lg:text-start max-w-md mx-auto lg:mx-0 leading-relaxed">
                  {homepage?.heroSubtitle || "Compare local professionals, choose a time, and book a home visit or an appointment at the stylist’s salon or studio."}
                </p>
                {homepage?.ctaText && /^(\/(?!\/)|https:\/\/)/.test(homepage.ctaLink || "") && <a href={homepage.ctaLink} className="mt-5 inline-block rounded-full bg-brand px-5 py-3 text-white">{homepage.ctaText}</a>}
                {services.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-2.5">
                    {services.map((service) => (
                      <Link
                        key={service.id}
                        to={`/search?serviceTypeId=${encodeURIComponent(service.id)}&serviceTypeName=${encodeURIComponent(service.name)}`}
                        className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:border-brand hover:bg-brand/20"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                )}
                <SearchForStyler />
              </div>
            </div>
          </div>

        </div>
      </div>

      <PublicHeader />
    </div>
  );
};

export default Hero;
