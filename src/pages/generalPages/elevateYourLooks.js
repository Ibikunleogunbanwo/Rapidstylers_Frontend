import Hero from "./newHeroSection";
import Footer from "../../components/footer";
import AdSlot from "../../components/adSlot";
import React, { useState, useEffect } from "react";
import { APIService } from "../../hooks/remote/apiService";

// Must stay in sync with the backend GALLERY_CATEGORIES allowlist.
const CATEGORIES = [
  "Dreadlocks",
  "Buzz cut",
  "Braids",
  "Cornrows",
  "Wigs",
  "High-top fade",
  "Hair dye",
  "Nail tech",
  "Makeup",
  "Eyelash extensions",
];

// Static fallback for when the backend is unreachable
const FALLBACK_IMAGES = [
  "https://img.freepik.com/free-photo/ai-generated-cute-girl-pic_23-2150649916.jpg?t=st=1703594682~exp=1703598282~hmac=73526701750bbf321b834567f522149fc132a315987dd64567366c01a2be4836&w=360",
  "https://img.freepik.com/free-photo/young-adult-woman-with-curly-brown-hair-smiling-generated-by-ai_188544-39044.jpg?t=st=1703595330~exp=1703598930~hmac=238e53df5c36bc1b7219af2f043fea17f6bb9eebcdb6ef11107f66f2719f0957&w=1060",
  "https://img.freepik.com/free-photo/portrait-person-daily-life-new-york-city_23-2150820012.jpg?t=st=1703594718~exp=1703598318~hmac=eb7455451f857b4b11684113482fe85ab7182b74123ea6c781874420e26667cc&w=1060",
  "https://img.freepik.com/free-photo/close-up-beautiful-girl-portrait_23-2150799905.jpg?t=st=1703594724~exp=1703598324~hmac=0a4b6d64e8377b4e9f5259f752476a627b156b51653fa76480baff4508c11947&w=740",
  "https://img.freepik.com/free-photo/beautiful-fashion-model-with-long-curly-blond-hair-elegance-generated-by-artificial-intelligence_25030-62882.jpg?t=st=1703594727~exp=1703598327~hmac=0e889a84417724acfbadef154a79e9fba78a4e24abfbab6ee30a04e470533547&w=1060",
  "https://img.freepik.com/free-photo/close-up-beautiful-girl-portrait_23-2150799885.jpg?t=st=1703590977~exp=1703594577~hmac=87441f4d6826feabf08c8b51120f0ec62748bb75a912236d8e56d5b547f03b9d&w=740",
  "https://img.freepik.com/premium-photo/happy-woman-with-beautiful-hair-background-blooming-garden-generative-ai_272595-3958.jpg?w=900",
  "https://img.freepik.com/free-photo/ai-generated-cute-girl-pic_23-2150649916.jpg?t=st=1703594682~exp=1703598282~hmac=73526701750bbf321b834567f522149fc132a315987dd64567366c01a2be4836&w=360",
  "https://img.freepik.com/free-photo/young-adult-woman-with-curly-brown-hair-smiling-generated-by-ai_188544-39044.jpg?t=st=1703595330~exp=1703598930~hmac=238e53df5c36bc1b7219af2f043fea17f6bb9eebcdb6ef11107f66f2719f0957&w=1060",
  "https://img.freepik.com/free-photo/portrait-person-daily-life-new-york-city_23-2150820012.jpg?t=st=1703594718~exp=1703598318~hmac=eb7455451f857b4b11684113482fe85ab7182b74123ea6c781874420e26667cc&w=1060",
  "https://img.freepik.com/free-photo/close-up-beautiful-girl-portrait_23-2150799905.jpg?t=st=1703594724~exp=1703598324~hmac=0a4b6d64e8377b4e9f5259f752476a627b156b51653fa76480baff4508c11947&w=740",
  "https://img.freepik.com/free-photo/beautiful-fashion-model-with-long-curly-blond-hair-elegance-generated-by-artificial-intelligence_25030-62882.jpg?t=st=1703594727~exp=1703598327~hmac=0e889a84417724acfbadef154a79e9fba78a4e24abfbab6ee30a04e470533547&w=1060",
];

const PER_PAGE = 12;

const ElevateLooks = () => {
  document.title = "Elevate your looks | RapidStylers";
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [images, setImages] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Search box: the input updates immediately, the committed query debounces 400ms.
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // True when the keyword had no text-level match and the API returned closest matches.
  const [fuzzy, setFuzzy] = useState(false);

  const loadImages = (category, pageNum, append, query) => {
    const setter = append ? setLoadingMore : setLoading;
    setter(true);
    APIService.searchGallery(category, PER_PAGE, pageNum, query)
      .then((res) => {
        const photos = res.data?.data;
        if (Array.isArray(photos) && photos.length > 0) {
          let mapped = photos.map((p) => ({
            src: p.src?.medium || p.src?.large || p.src?.original || "",
            alt: p.alt || category,
            photographer: p.photographer || "",
            stylerId: p.stylerId || "",
            source: p.source || "pexels",
          }));
          // Pexels returns relevance-ranked results even for gibberish, so a strict
          // text pass keeps the keyword visibly meaningful: exact matches win, and
          // only when none exist do we fall back to the API's closest matches.
          const needle = (query || "").trim().toLowerCase();
          let isFuzzy = false;
          if (needle) {
            const strict = mapped.filter((p) =>
              `${p.alt} ${p.photographer}`.toLowerCase().includes(needle)
            );
            if (strict.length > 0) {
              mapped = strict;
            } else {
              isFuzzy = true;
            }
          }
          setFuzzy(isFuzzy);
          setImages((prev) => (append && Array.isArray(prev) ? [...prev, ...mapped] : mapped));
          // A full page means there may be more — a short page means we reached the end.
          setHasMore(photos.length >= PER_PAGE);
        } else if (!append) {
          // An active search with no matches shows the empty state ([]);
          // no search at all falls back to the static grid (null).
          setFuzzy(false);
          setImages(query && query.trim() ? [] : null);
          setHasMore(false);
        }
      })
      .catch(() => {
        if (!append) setImages(null);
        setHasMore(false);
      })
      .finally(() => setter(false));
  };

  // Debounce the typed keyword into a committed query.
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== searchQuery) setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Load whenever the category or the committed query changes (always page 1).
  useEffect(() => {
    setPage(1);
    setImages(null);
    setHasMore(false);
    setFuzzy(false);
    loadImages(activeCategory, 1, false, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchQuery]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadImages(activeCategory, nextPage, true, searchQuery);
  };

  const switchCategory = (cat) => {
    setActiveCategory(cat);
    setSearchInput("");
    setSearchQuery("");
  };

  const visibleImages = images || FALLBACK_IMAGES;
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Keyboard navigation while the lightbox is open.
  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % visibleImages.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + visibleImages.length) % visibleImages.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, visibleImages.length]);

  return (
    <div className="grid gap-12">
      <Hero height="60vh" />

      {/* Ad unit (renders nothing until REACT_APP_ADSENSE_CLIENT is configured) */}
      <div className="px-4 md:px-[50px] max-w-5xl mx-auto w-full">
        <AdSlot slot="gallery_top" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-4 px-4 md:px-[50px]">
        <div className="col-span-12 lg:col-span-2">
          <div className="gap-3 md:gap-8 flex items-center overflow-x-scroll lg:grid max-h-screen py-4 lg:pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => switchCategory(cat)}
                className={
                  activeCategory === cat
                    ? "bg-brand text-white p-3 rounded-md text-sm text-left"
                    : "px-3 py-4 rounded-md text-sm text-slate-500 hover:text-gray-800 text-left flex-shrink-0"
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-10">
          {/* Search within the active category */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={`Search ${activeCategory.toLowerCase()}…`}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/15">
                {fuzzy
                  ? `No exact matches for "${searchQuery}". Showing closest results.`
                  : `Results for "${searchQuery}" in ${activeCategory}`}
              </span>
            )}
          </div>

          {loading && (
            <p className="text-sm text-gray-400 py-4">Loading images…</p>
          )}
          {!loading && images !== null && images.length === 0 && searchQuery && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-16 text-center">
              <p className="text-base font-bold text-gray-700">No results for "{searchQuery}"</p>
              <p className="mt-1 text-sm text-gray-400">
                Try a different keyword, or clear the search to browse all {activeCategory} looks.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-2 lg:gap-1">
            {visibleImages.map((img, i) => {
              const src = typeof img === "string" ? img : img.src?.medium || img.src?.large || img.src?.original || img.src || "";
              const alt = typeof img === "string" ? activeCategory : img.alt;
              const isStylerWork = !(typeof img === "string") && img.source === "stylist";
              return (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="relative aspect-[4/5] rounded-md overflow-hidden bg-gray-100 cursor-zoom-in group"
                  aria-label={`View ${alt}`}
                >
                  <img
                    src={src}
                    alt={alt}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {isStylerWork && (
                    <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wide text-white bg-black/60 backdrop-blur rounded-full px-2 py-0.5">
                      By {img.photographer || "a stylist"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {images && images.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Photos from Pexels {images[0]?.photographer ? `· ${images[0].photographer}` : ""}
            </p>
          )}
          {images && hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-md bg-brand text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
          {images && !hasMore && images.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-8">
              You've reached the end of this category.
            </p>
          )}
        </div>
      </div>

      {lightboxIndex != null && visibleImages.length > 0 && (
        <Lightbox
          images={visibleImages}
          index={lightboxIndex}
          category={activeCategory}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + visibleImages.length) % visibleImages.length)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % visibleImages.length)}
        />
      )}
      <Footer />
    </div>
  );
};

/** Full-size viewer for a gallery photo with prev/next and close. */
const Lightbox = ({ images, index, category, onClose, onPrev, onNext }) => {
  const img = images[index];
  const src = typeof img === "string" ? img : img.src?.large || img.src?.medium || img.src?.original || img.src || "";
  const alt = typeof img === "string" ? category : img.alt || category;
  const photographer = typeof img === "string" ? "" : img.photographer || "";
  const stylerId = typeof img === "string" ? "" : img.stylerId || "";
  const isStylerWork = !(typeof img === "string") && img.source === "stylist";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} full view`}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 text-white/80 hover:text-white text-3xl leading-none w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl md:text-5xl w-12 h-12 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl md:text-5xl w-12 h-12 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Next photo"
          >
            ›
          </button>
        </>
      )}

      <figure className="max-h-full max-w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
        <figcaption className="mt-4 text-white/80 text-sm text-center">
          {photographer && (
            <span>{isStylerWork ? "Work by " : "Photo by "}<span className="text-white font-medium">{photographer}</span> · </span>
          )}
          <span>{alt}</span>
          {isStylerWork && stylerId && (
            <span className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`/stylistProfile/${btoa(stylerId)}/${btoa(photographer || "stylist")}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-colors hover:bg-brand/90"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75zm2.5 2.5a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                Book with {photographer || "this stylist"}
              </a>
              <a
                href={`/stylistProfile/${btoa(stylerId)}/${btoa(photographer || "stylist")}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-white/60 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                View profile
              </a>
            </span>
          )}
        </figcaption>
      </figure>
    </div>
  );
};

export default ElevateLooks;
