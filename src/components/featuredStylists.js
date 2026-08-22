import ServiceCard from "./serviceCard";
import React, { useState, useEffect } from 'react';
import { APIService } from "../hooks/remote/apiService";

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

  const idleStylist = "bg-white/50 text-brand border border-brand py-3 px-6 rounded-md text-xs cursor-pointer";
  const activeStylist = "m-0 bg-brand text-white py-3 px-6 rounded-md text-xs cursor-pointer";

  return (
    <div className="px-4 md:px-[50px]">
      <p className="mb-4 text-3xl">Discover professionals.</p>
      <div className="flex gap-2 mb-4 text-sm font-medium flex-wrap">
        {categories.map((cat) => {
          const catId = cat.serviceTypeId || cat.id;
          const catName = cat.serviceTypeName || cat.name || cat.serviceType;
          return (
            <span
              key={catId}
              className={`${selectedId === catId ? activeStylist : idleStylist}`}
              onClick={() => setSelectedId(catId)}
            >
              {catName}
            </span>
          );
        })}
      </div>
      {loading ? (
        <div className="py-10 text-center text-black/50">Loading...</div>
      ) : stylists.length === 0 ? (
        <div className="py-10 text-center text-black/50">No professionals found in this category yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stylists.map((stylist) => (
            <ServiceCard
              key={stylist.stylerId || stylist.id}
              coverImg={stylist.logoUrl || stylist.bannerUrl || stylist.profileImageUrl || ""}
              name={stylist.businessName || stylist.restaurantName || stylist.name || "Professional"}
              rating={stylist.averageRating || stylist.rating || "0"}
              reviews={stylist.reviewCount || stylist.reviews || "0"}
              status={stylist.online ? "Online" : "Offline"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Featured;
