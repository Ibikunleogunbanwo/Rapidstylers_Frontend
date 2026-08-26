import HeroInput from "./heroInput"
import HeroSelect from "./heroSelect";
import Buttons from "./button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { APIService } from "../hooks/remote/apiService";
import { useUserLocation } from "../context/LocationContext";

const SearchForStyler = () => {
    const [categories, setCategories] = useState([]);
    const [serviceId, setServiceId] = useState("");
    const [query, setQuery] = useState("");
    const [radius, setRadius] = useState(25);
    const [openNow, setOpenNow] = useState(false);
    const navigate = useNavigate();
    const { location: userLocation } = useUserLocation();

    useEffect(() => {
        APIService.getStylerType()
            .then((res) => {
                const items = res.data?.data || [];
                const mapped = items.map((c) => ({
                    value: c.serviceTypeId || c.id,
                    label: c.serviceTypeName || c.serviceName || c.name || c.serviceType,
                }));
                setCategories(mapped);
                // Default selection: Hairstyling when present, otherwise the first category.
                const hairstyling = mapped.find((c) => /hairstyl/i.test(c.label));
                setServiceId(hairstyling ? hairstyling.value : (mapped[0]?.value || ""));
            })
            .catch(() => {});
    }, []);

    const options = categories.length > 0
        ? categories
        : [{ value: "", label: "Select service..." }];

    const radiusOptions = [
        { value: 10, label: "Within 10 km" },
        { value: 25, label: "Within 25 km" },
        { value: 50, label: "Within 50 km" },
        { value: 100, label: "Within 100 km" },
        { value: "", label: "Anywhere" },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (serviceId) {
            params.set("serviceTypeId", serviceId);
            const selected = categories.find((c) => c.value === serviceId);
            if (selected) params.set("serviceTypeName", selected.label);
        }
        if (query.trim()) params.set("name", query.trim());
        if (openNow) params.set("openNow", "true");
        if (userLocation && radius) {
            params.set("lat", userLocation.latitude);
            params.set("lng", userLocation.longitude);
            params.set("radius", radius);
            if (userLocation.city) params.set("city", userLocation.city);
        }
        navigate(`/search?${params.toString()}`);
    };

    return (
      <form onSubmit={handleSearch} className="text-white mt-4 sm:mt-8 justify-center flex">
        <div className="bg-white p-3 sm:p-4 md:p-3 rounded-lg w-full grid md:flex items-center gap-2.5 sm:gap-3 md:gap-2 shadow-lg">
          <HeroInput
            inputType={"search"}
            placeholder={"Search for beauty professionals..."}
            inputValue={query}
            inputOnChange={(e) => setQuery(e.target.value)}
            inputName={"query"}
          />
          <HeroSelect
            selectOptions={options}
            valueKey={"value"}
            labelKey={"label"}
            selectName={"Select service"}
            selectValue={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          />
          <HeroSelect
            selectOptions={radiusOptions}
            valueKey={"value"}
            labelKey={"label"}
            selectName={"Radius"}
            selectValue={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 whitespace-nowrap px-2 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            Open now
          </label>
          <Buttons btnType={"primary"} btnText={"Search"} type={"submit"} />
        </div>
      </form>
    );
}

export default SearchForStyler;
