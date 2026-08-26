import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import ServiceCard from "../../components/serviceCard";
import AdSlot from "../../components/adSlot";
import { APIService } from "../../hooks/remote/apiService";
import { useSavedStylists } from "../../hooks/useSavedStylists";

const displayServiceName = (value) => {
  const label = String(value || "").trim();
  return /^b?hairstylist$/i.test(label) ? "Hair Stylist" : label;
};

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

  const isOpenNow = React.useCallback((stylist) => {
    if (!openNow) return true;
    const now = new Date();
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

  // Fetch results when params change
  useEffect(() => {
    setActiveServiceId(serviceTypeId);
    setOpenNowFilter(openNow);
    const run = async () => {
      setLoading(true);
      try {
        let results = [];

        if (lat && lng) {
          const res = await APIService.searchNearby(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(radius),
            serviceTypeId,
            city,
            { openNow }
          );
          results = res.data?.data || [];
        } else if (serviceTypeId) {
          const res = await APIService.stylersBaseOnCategory(serviceTypeId);
          results = res.data?.data || [];
        } else if (name) {
          const res = await APIService.searchForStyler(name);
          results = res.data?.data || [];
        } else if (province) {
          const res = await APIService.searchByProvince(province);
          results = res.data?.data || [];
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

        setStylists(results);
      } catch (error) {
        setStylists([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [lat, lng, radius, serviceTypeId, name, province, city, openNow, isOpenNow]);

  // Re-filter by service type from the dropdown on the results page
  const handleServiceFilter = (e) => {
    const newId = e.target.value;
    setActiveServiceId(newId);
    const params = new URLSearchParams(searchParams);
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
    if (nextValue) params.set("openNow", "true");
    else params.delete("openNow");
    navigate(`/search?${params.toString()}`);
  };

  // Remove a filter pill
  const removeFilter = (key) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
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

  return (
    <div className="min-h-screen bg-[#F4F5F7] px-4 md:px-[50px] py-10">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#9381FF] transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Home
        </Link>

        {/* Heading */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-serif text-4xl font-bold tracking-tight text-gray-900">{heading}</p>
            <p className="mt-1.5 text-sm text-gray-500">
              {loading ? "Searching…" : "Find your perfect professional and book instantly."}
            </p>
          </div>
          {!loading && stylists.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-gray-600 shadow-sm ring-1 ring-gray-100">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9381FF]" />
              {stylists.length} professional{stylists.length === 1 ? "" : "s"} found
            </span>
          )}
        </div>

        {/* Filter bar */}
        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          {/* Service type dropdown */}
          <div className="relative">
            <select
              value={activeServiceId}
              onChange={handleServiceFilter}
              className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-colors hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
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
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-brand/40">
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#9381FF]/10 py-1.5 pl-3.5 pr-2 text-xs font-bold text-[#6b5bd2] ring-1 ring-[#9381FF]/15"
            >
              {pill.label}
              <button
                onClick={() => removeFilter(pill.key)}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-[#9381FF]/15 transition-colors hover:bg-[#9381FF]/30"
                title={`Remove ${pill.label} filter`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Ad unit (renders nothing until REACT_APP_ADSENSE_CLIENT is configured) */}
        <div className="mt-8">
          <AdSlot slot="search_results_top" />
        </div>

        {/* Results */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-[#9381FF]/20 border-t-[#9381FF]" />
            <p className="mt-4 text-sm text-gray-400">Finding professionals…</p>
          </div>
        ) : stylists.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white/60 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9381FF]/10">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-[#9381FF]">
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="mt-4 text-base font-bold text-gray-700">No professionals found in this search yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Try expanding your radius, changing the service type, or removing a filter.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stylists.map((stylist) => (
              <ServiceCard
                key={stylist.stylerId || stylist.id}
                coverImg={stylist.profileImageUrl || ""}
                name={stylist.businessName || stylist.name || "Professional"}
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
        )}
      </div>
    </div>
  );
};

export default SearchResults;
