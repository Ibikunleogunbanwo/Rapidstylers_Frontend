import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ServiceCard from "../../components/serviceCard";
import AdSlot from "../../components/adSlot";
import Footer from "../../components/footer";
import { Section, Eyebrow, PageHeading, BackHome } from "../../components/pageSections";
import { APIService } from "../../hooks/remote/apiService";
import { useSavedStylists } from "../../hooks/useSavedStylists";
import { vendorTimeZone } from "../../utils/vendorTimeZone";

const displayServiceName = (value) => {
  const label = String(value || "").trim();
  return /^b?hairstylist$/i.test(label) ? "Hair Stylist" : label;
};

// Results are paginated client-side (after filtering/enrichment) so the total
// count stays accurate and one code path serves every search type.
const PAGE_SIZE = 12;

/**
 * Search results — supports radius + city + service type + name + province.
 * Shows active filter pills and a service type dropdown for re-filtering.
 */
const SearchResults = () => {
  document.title = "Search | RapidStylers";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "25";
  const serviceTypeId = searchParams.get("serviceTypeId") || "";
  const serviceTypeName = displayServiceName(searchParams.get("serviceTypeName"));
  const name = searchParams.get("name") || "";
  const province = searchParams.get("province") || "";
  const city = searchParams.get("city") || "";
  const openNow = searchParams.get("openNow") === "true";
  // Page lives in the URL (?page=2) so refresh and back/forward navigation keep
  // the same page of results.
  const rawPage = Number.parseInt(searchParams.get("page") || "", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const isOpenNow = React.useCallback((stylist) => {
    if (!openNow) return true;
    // The vendor's hours live in the vendor's zone: read the vendor's clock,
    // not the visitor browser's. Stored zone wins; province map covers rows
    // without one. Mirrors the backend's precedence exactly.
    const zone = vendorTimeZone(stylist);
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: zone }));
    const blocked = (stylist.exceptions || []).some((exception) => exception.blockedDate === now.toISOString().slice(0, 10));
    if (blocked) return false;
    const weekday = String(now.getDay());
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (stylist.availability || []).some((slot) => {
      if (String(slot.dayOfWeek) !== weekday) return false;
      const [startHour, startMinute] = String(slot.startTime || "").split(":").map(Number);
      const [endHour, endMinute] = String(slot.endTime || "").split(":").map(Number);
      return minutes >= startHour * 60 + startMinute && minutes < endHour * 60 + endMinute;
    });
  }, [openNow]);

  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeServiceId, setActiveServiceId] = useState(serviceTypeId);
  const [openNowFilter, setOpenNowFilter] = useState(openNow);
  // Set only when the backend paginated the nearby search; null means the full
  // list was fetched and pagination happens client-side.
  const [totalCount, setTotalCount] = useState(null);
  // Set when a city search found nobody in that city and the backend widened
  // to the province; the page then says so instead of quietly relabelling.
  const [widened, setWidened] = useState(null);
  const { savedIds, loading: savedLoading, toggleSaved } = useSavedStylists();

  // Load service type categories for the filter dropdown
  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        setCategories(
          items.map((c) => ({
            value: String(c.serviceTypeId || c.id),
            label: displayServiceName(c.serviceTypeName || c.serviceName || c.name),
          }))
        );
      })
      .catch(() => {});
  }, []);

  // Fetch results when params or page change. The nearby search uses backend
  // page/pageSize only when no client-side filter is applied after the fetch
  // (the province filter is the only one that can affect the lat/lng path).
  useEffect(() => {
    setActiveServiceId(serviceTypeId);
    setOpenNowFilter(openNow);
    const run = async () => {
      setLoading(true);
      setTotalCount(null);
      setWidened(null);
      // True when the dedicated city endpoint served the results: they are
      // already city-scoped (or widened by the backend), so the client-side
      // city re-filter below must not run and strip widened rows.
      let cityScopedResponse = false;
      try {
        let results = [];

        if (lat && lng) {
          const filters = { openNow };
          if (lat && lng && !province) {
            filters.page = page;
            filters.pageSize = PAGE_SIZE;
          }
          const res = await APIService.searchNearby(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(radius),
            serviceTypeId,
            city,
            filters
          );
          const data = res.data?.data;
          if (lat && lng && !province && data && Array.isArray(data.items)) {
            // Backend already sliced this page — use its totals directly.
            results = data.items;
            if (typeof data.total === "number") setTotalCount(data.total);
            // A stale ?page= beyond the last page comes back empty — correct
            // the URL to the last valid page so the grid isn't blank.
            if (data.items.length === 0 && data.total > 0 && page > 1) {
              const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
              if (lastPage !== page) {
                const params = new URLSearchParams(searchParams);
                params.set("page", String(lastPage));
                navigate(`/search?${params.toString()}`, { replace: true });
              }
            }
          } else {
            // Older/array response or client-filter path: slice client-side.
            results = Array.isArray(data) ? data : [];
          }
        } else if (serviceTypeId) {
          const res = await APIService.stylersBaseOnCategory(serviceTypeId);
          results = res.data?.data || [];
        } else if (name) {
          const res = await APIService.searchForStyler(name);
          results = res.data?.data || [];
        } else if (province) {
          const res = await APIService.searchByProvince(province);
          results = res.data?.data || [];
        } else if (city) {
          // City with no other filters: the dedicated city search. The backend
          // widens to the city's province when the city has nobody, and marks
          // the payload so the page can say so.
          const res = await APIService.searchByCity(city);
          cityScopedResponse = true;
          const data = res.data?.data;
          if (data && !Array.isArray(data) && Array.isArray(data.items)) {
            results = data.items;
            if (data.widened) setWidened(data.widenedProvince || true);
          } else {
            results = Array.isArray(data) ? data : [];
          }
        }

        if (openNow && !(lat && lng)) {
          const detailed = await Promise.all(results.map(async (stylist) => {
            try {
              const detail = await APIService.singleStylerData(stylist.stylerId || stylist.id);
              return { ...stylist, ...(detail.data?.data?.stylerInformation || {}), ...detail.data?.data };
            } catch (_) {
              return stylist;
            }
          }));
          results = detailed.filter(isOpenNow);
        }

        // Client-side secondary filter by province
        if (province && (lat || serviceTypeId || name)) {
          const needle = province.trim().toLowerCase();
          results = results.filter(
            (s) => String(s.province || "").trim().toLowerCase() === needle
          );
        }

        // Client-side secondary filter by city. When no lat/lng is present the
        // search runs province-wide, so without this the heading would say
        // "Professionals in Calgary" while showing the whole province. The
        // dedicated city branch is exempt: it is already city-scoped, and its
        // widened payload legitimately carries rows from other cities.
        if (city && !(lat && lng) && !cityScopedResponse) {
          const needle = city.trim().toLowerCase();
          results = results.filter(
            (s) => String(s.city || "").trim().toLowerCase() === needle
          );
        }

        setStylists(results);
      } catch (error) {
        setStylists([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    // navigate/searchParams are stable (React Router v6) and the URL is the
    // source of truth for every search input, so including them is safe.
  }, [lat, lng, radius, serviceTypeId, name, province, city, openNow, page, isOpenNow, navigate, searchParams]);
  // Re-filter by service type from the dropdown on the results page
  const handleServiceFilter = (e) => {
    const newId = e.target.value;
    setActiveServiceId(newId);
    const params = new URLSearchParams(searchParams);
    params.delete("page"); // a changed filter restarts at page 1
    if (newId) {
      params.set("serviceTypeId", newId);
      const selected = categories.find((c) => c.value === newId);
      if (selected) params.set("serviceTypeName", selected.label);
    } else {
      params.delete("serviceTypeId");
      params.delete("serviceTypeName");
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleOpenNowChange = (event) => {
    const nextValue = event.target.checked;
    setOpenNowFilter(nextValue);
    const params = new URLSearchParams(searchParams);
    params.delete("page"); // a changed filter restarts at page 1
    if (nextValue) params.set("openNow", "true");
    else params.delete("openNow");
    navigate(`/search?${params.toString()}`);
  };

  // Remove a filter pill
  const removeFilter = (key) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    params.delete("page"); // a changed filter restarts at page 1
    navigate(`/search?${params.toString()}`);
  };

  // Build heading
  const heading = name
    ? `Results for "${name}"${city ? ` in ${city}` : ""}`
    : serviceTypeName
      ? `${serviceTypeName} professionals${city ? ` in ${city}` : ""}`
      : city
        ? `Professionals in ${city}`
        : province
          ? `Professionals in ${province}`
          : "Search results";

  // Active filter pills
  const pills = [];
  if (serviceTypeName) pills.push({ label: serviceTypeName, key: "serviceTypeName" });
  if (city) pills.push({ label: city, key: "city" });
  if (radius && lat) pills.push({ label: `Within ${radius} km`, key: "radius" });
  if (name) pills.push({ label: `"${name}"`, key: "name" });
  if (province) pills.push({ label: province, key: "province" });
  if (openNow) pills.push({ label: "Open now", key: "openNow" });

  const serviceOptions = [
    { value: "", label: "All services" },
    ...categories,
  ];

  // totalCount is set only when the backend paginated the nearby search;
  // otherwise the full list was fetched and pagination is client-side.
  const totalFound = totalCount ?? stylists.length;
  const totalPages = Math.max(1, Math.ceil(totalFound / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleStylists =
    totalCount === null
      ? stylists.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
      : stylists;

  const goToPage = (next) => {
    const target = Math.min(Math.max(1, next), totalPages);
    if (target === safePage) return;
    // Persist the page in the URL — refresh and back/forward keep the same
    // page, and ScrollToTop handles the scroll reset on the route change.
    const params = new URLSearchParams(searchParams);
    params.set("page", String(target));
    navigate(`/search?${params.toString()}`);
    // Belt-and-braces scroll reset for use outside the ScrollToTop shell.
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-white text-onSurface">
      <Section pad="pt-10 md:pt-14 pb-12">
        <BackHome />
        <PageHeading
          eyebrow="Find a professional"
          title={heading}
          lead={loading ? "Searching…" : "Find your perfect professional and book instantly."}
        />

        {/* Filters: hairline controls in the page register, count as quiet text */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Service type dropdown */}
          <div className="relative">
            <select
              value={activeServiceId}
              onChange={handleServiceFilter}
              className="appearance-none rounded-full border border-black/10 bg-white py-2.5 pl-5 pr-10 text-[13px] font-semibold text-onSurface outline-none transition-colors hover:border-black/30 focus:border-brand cursor-pointer"
            >
              {serviceOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-[13px] font-semibold text-onSurface transition-colors hover:border-black/30">
            <input
              type="checkbox"
              checked={openNowFilter}
              onChange={handleOpenNowChange}
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            Open now
          </label>

          {/* Active filter pills */}
          {pills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral py-1.5 pl-3.5 pr-2 text-xs font-semibold text-onSurface ring-1 ring-black/10"
            >
              {pill.label}
              <button
                onClick={() => removeFilter(pill.key)}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-black/60 transition-colors hover:bg-black/20"
                title={`Remove ${pill.label} filter`}
              >
                ✕
              </button>
            </span>
          ))}

          {!loading && totalFound > 0 && (
            <p className="ml-auto text-[13px] text-black/55">
              {totalFound} professional{totalFound === 1 ? "" : "s"} found
            </p>
          )}
        </div>
      </Section>

      <Section pad="pb-20 pt-4 md:pb-28">
        {/* Ad unit (renders nothing until REACT_APP_ADSENSE_CLIENT is configured) */}
        <div className="mb-10">
          <AdSlot slot="search_results_top" />
        </div>

        {/* The city had nobody, so the search widened to the province. Say so. */}
        {widened && !loading && stylists.length > 0 && (
          <p className="-mt-4 mb-8 text-[13px] text-black/55">
            No professionals in {city} yet. Showing{" "}
            {typeof widened === "string" ? `professionals across ${widened}` : "nearby professionals"}.
          </p>
        )}

        {/* Results */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />
            <p className="mt-4 text-[13px] text-black/55">Finding professionals…</p>
          </div>
        ) : stylists.length === 0 ? (
          <div className="border-t border-black/10 pt-16 text-center">
            <Eyebrow>No results</Eyebrow>
            <p className="mt-5 text-[15px] text-onSurface">No professionals found in this search yet</p>
            <p className="mx-auto mt-2 max-w-[440px] text-[13px] leading-[1.6] text-black/55">
              Try expanding your radius, changing the service type, or removing a filter.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleStylists.map((stylist, index) => (
                <ServiceCard
                  key={stylist.stylerId || stylist.id}
                  gridPosition={index}
                  coverImg={stylist.profileImageUrl || ""}
                  name={stylist.businessName || stylist.name || "Professional"}
                  serviceTypeName={stylist.serviceTypeName || ""}
                  rating={stylist.averageRating || "0"}
                  reviews={stylist.reviewCount || "0"}
                  status={stylist.visibilityStatus === "Online" ? "Online" : "Offline"}
                  distance={stylist.distanceKm}
                  stylerId={stylist.stylerId || stylist.id}
                  businessName={stylist.businessName || stylist.name || "Professional"}
                  isSaved={savedIds.has(String(stylist.stylerId || stylist.id))}
                  onToggleSaved={toggleSaved}
                  saveLoading={savedLoading}
                  payoutReady={stylist.payoutReady}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="rounded-full border border-black/10 px-6 py-2.5 text-[13px] font-semibold text-onSurface transition-colors hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-[13px] text-black/55">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="rounded-full border border-black/10 px-6 py-2.5 text-[13px] font-semibold text-onSurface transition-colors hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </Section>

      <Footer />
    </div>
  );
};

export default SearchResults;
