import ServiceCard from "./serviceCard";
import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { APIService } from "../hooks/remote/apiService";

/**
 * Card-shaped placeholders matching the ServiceCard grid, shown while a
 * category's stylists load. Mirroring the grid's shape (4/3 cover, text
 * block) keeps the section's height stable across tab switches instead of
 * collapsing to a one-line "Loading...".
 */
const CardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-black/10 bg-white" aria-hidden="true">
    <div className="aspect-[4/3] w-full animate-pulse bg-neutral" />
    <div className="p-4">
      <div className="h-4 w-2/3 animate-pulse rounded bg-neutral" />
      <div className="mt-2.5 h-3 w-1/3 animate-pulse rounded bg-neutral" />
    </div>
  </div>
);

// One grid row's worth of cards is all a homepage teaser shows; everything
// beyond it lives behind the "See more" link, so a full category can stretch
// the /search page instead of the homepage.
const MAX_VISIBLE = 4;

// The /search page reads serviceTypeId + serviceTypeName from the query, so
// "See more" lands on the same category the tile came from.
const buildServiceQuery = (id, name) => {
  const params = new URLSearchParams();
  if (id != null) params.set("serviceTypeId", String(id));
  if (name) params.set("serviceTypeName", name);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const Featured = () => {
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories on mount → render tabs dynamically
  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        setCategories(items);
        if (items.length > 0) {
          setSelectedId(items[0].serviceTypeId || items[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch stylists whenever the selected category changes
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    APIService.stylersBaseOnCategory(selectedId)
      .then((res) => {
        setStylists(res.data?.data || []);
      })
      .catch(() => { setStylists([]); })
      .finally(() => setLoading(false));
  }, [selectedId]);

  // The selected category's display name, for the empty state's sentence.
  const activeName = categories.reduce((found, cat) => {
    const id = cat.serviceTypeId || cat.id;
    return id === selectedId
      ? cat.serviceTypeName || cat.serviceName || cat.name || cat.serviceType
      : found;
  }, null);

  // Empty-state nudge: move to the next category with content, wrapping around.
  const pickAnother = () => {
    const ids = categories.map((c) => c.serviceTypeId || c.id);
    if (ids.length < 2) return;
    const at = ids.indexOf(selectedId);
    setSelectedId(ids[(at + 1) % ids.length]);
  };

  const idleStylist =
    "border border-black/15 text-black/60 py-2.5 px-5 rounded-full text-xs cursor-pointer " +
    "transition-colors hover:border-brand/40 hover:text-onSurface";
  const activeStylist = "m-0 bg-brand/10 text-brand font-semibold py-2.5 px-5 rounded-full text-xs cursor-pointer";

  return (
    <div className="px-4 md:px-[50px]">
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Discover professionals</p>
      <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
        Top-rated stylists, ready when you are
      </h2>
      <div
        className="mt-8 flex gap-2 mb-4 text-sm font-medium flex-wrap"
        role="tablist"
        aria-label="Discover professionals"
      >
        {categories.map((cat) => {
          const catId = cat.serviceTypeId || cat.id;
          const catName = cat.serviceTypeName || cat.serviceName || cat.name || cat.serviceType;
          return (
            <span
              key={catId}
              role="tab"
              aria-selected={selectedId === catId}
              className={`${selectedId === catId ? activeStylist : idleStylist}`}
              onClick={() => setSelectedId(catId)}
            >
              {catName}
            </span>
          );
        })}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading professionals">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : stylists.length === 0 ? (
        <div className="mt-2 border-t border-black/10 py-12 text-center">
          <p className="text-[15px] text-onSurface">
            No {activeName || "professionals"} available here yet.
          </p>
          <p className="mt-2 text-[13px] leading-[1.55] text-black/55">
            New professionals join every week. Try another category, or browse
            everyone with the full search.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={pickAnother}
              disabled={categories.length < 2}
              className="rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Browse another category
            </button>
            <Link
              to="/search"
              className="rounded-full border border-black/15 px-5 py-2.5 text-xs font-semibold text-black/60 transition-colors hover:border-brand/40 hover:text-onSurface"
            >
              Use full search
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {stylists.slice(0, MAX_VISIBLE).map((stylist, index) => (
              <ServiceCard
                key={stylist.stylerId || stylist.id}
                gridPosition={index}
                coverImg={stylist.logoUrl || stylist.bannerUrl || stylist.profileImageUrl || ""}
                name={stylist.businessName || stylist.restaurantName || stylist.name || "Professional"}
                serviceTypeName={stylist.serviceTypeName || ""}
                rating={stylist.averageRating || stylist.rating || "0"}
                reviews={stylist.reviewCount || stylist.reviews || "0"}
                status={stylist.online ? "Online" : "Offline"}
                payoutReady={stylist.payoutReady}
                stylerId={stylist.stylerId || stylist.id}
                businessName={stylist.businessName || stylist.restaurantName || stylist.name || "Professional"}
              />
            ))}
          </div>
          {stylists.length > MAX_VISIBLE && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <p className="text-[13px] text-black/55">
                Showing {MAX_VISIBLE} of {stylists.length} in {activeName || "this category"}
              </p>
              <Link
                to={{ pathname: "/search", search: buildServiceQuery(selectedId, activeName) }}
                className="rounded-full border border-black/15 px-5 py-2.5 text-xs font-semibold text-black/60 transition-colors hover:border-brand/40 hover:text-onSurface"
              >
                See more
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Featured;
