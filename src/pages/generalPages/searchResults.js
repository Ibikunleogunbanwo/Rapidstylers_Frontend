import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import ServiceCard from "../../components/serviceCard";
import HeroSelect from "../../components/heroSelect";
import { APIService } from "../../hooks/remote/apiService";

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
  const serviceTypeName = searchParams.get("serviceTypeName") || "";
  const name = searchParams.get("name") || "";
  const province = searchParams.get("province") || "";
  const city = searchParams.get("city") || "";

  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeServiceId, setActiveServiceId] = useState(serviceTypeId);

  // Load service type categories for the filter dropdown
  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        setCategories(
          items.map((c) => ({
            value: String(c.serviceTypeId || c.id),
            label: c.serviceTypeName || c.serviceName || c.name,
          }))
        );
      })
      .catch(() => {});
  }, []);

  // Fetch results when params change
  useEffect(() => {
    setActiveServiceId(serviceTypeId);
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
            city
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
  }, [lat, lng, radius, serviceTypeId, name, province, city]);

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

  const serviceOptions = [
    { value: "", label: "All services" },
    ...categories,
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 md:px-[50px] py-10">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
          ← Home
        </Link>

        {/* Heading */}
        <p className="text-3xl font-bold text-gray-900 mt-6">{heading}</p>
        <p className="text-sm text-gray-500 mt-1">
          {loading
            ? "Searching..."
            : stylists.length === 0
              ? "No professionals found. Try adjusting your search area or filters."
              : `${stylists.length} professional${stylists.length === 1 ? "" : "s"} found`}
        </p>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          {/* Service type dropdown */}
          <div className="w-48">
            <HeroSelect
              selectOptions={serviceOptions}
              valueKey="value"
              labelKey="label"
              selectName="Filter by service"
              selectValue={activeServiceId}
              onChange={handleServiceFilter}
            />
          </div>

          {/* Active filter pills */}
          {pills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 text-brand text-xs font-medium rounded-full"
            >
              {pill.label}
              <button
                onClick={() => removeFilter(pill.key)}
                className="hover:text-brand/60 transition-colors"
                title={`Remove ${pill.label} filter`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="py-16 text-center text-black/50">Loading...</div>
        ) : stylists.length === 0 ? (
          <div className="py-16 text-center text-black/50">
            <p className="text-lg mb-2">No professionals found in this search yet.</p>
            <p className="text-sm text-gray-400">
              Try expanding your radius or changing the service type.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {stylists.map((stylist) => (
              <ServiceCard
                key={stylist.stylerId || stylist.id}
                coverImg={stylist.profileImageUrl || ""}
                name={stylist.businessName || stylist.name || "Professional"}
                rating={stylist.averageRating || "0"}
                reviews={stylist.reviewCount || "0"}
                status={stylist.visibilityStatus === "Online" ? "Online" : "Offline"}
                distance={stylist.distanceKm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
