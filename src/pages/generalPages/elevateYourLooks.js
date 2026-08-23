import Hero from "./newHeroSection";
import Footer from "../../components/footer";
import React, { useState, useEffect } from "react";
import { APIService } from "../../hooks/remote/apiService";

const CATEGORIES = [
  "Dreadlocks",
  "Buzz cut",
  "Braids",
  "Cornrows",
  "Wigs",
  "High-top fade",
  "Hair dye",
  "Nail art",
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

const ElevateLooks = () => {
  document.title = "Elevate your looks | RapidStylers";
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadImages = (category) => {
    setLoading(true);
    APIService.searchGallery(category, 12)
      .then((res) => {
        const photos = res.data?.data;
        if (Array.isArray(photos) && photos.length > 0) {
          setImages(photos.map((p) => ({
            src: p.src?.medium || p.src?.large || p.src?.original || "",
            alt: p.alt || category,
            photographer: p.photographer || "",
          })));
        } else {
          setImages(null); // fall back to static
        }
      })
      .catch(() => setImages(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadImages(activeCategory);
  }, [activeCategory]);

  const visibleImages = images || FALLBACK_IMAGES;

  return (
    <div className="grid gap-12">
      <Hero height="60vh" />

      <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-4 px-4 md:px-[50px]">
        <div className="col-span-12 lg:col-span-2">
          <div className="gap-3 md:gap-8 flex items-center overflow-x-scroll lg:grid max-h-screen py-4 lg:pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
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
          {loading && (
            <p className="text-sm text-gray-400 py-4">Loading images…</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-2 lg:gap-1">
            {visibleImages.map((img, i) => {
              const src = typeof img === "string" ? img : img.src;
              const alt = typeof img === "string" ? activeCategory : img.alt;
              return (
                <img
                  key={i}
                  src={src}
                  alt={alt}
                  className="aspect-square rounded-md object-cover"
                  loading="lazy"
                />
              );
            })}
          </div>
          {images && images.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Photos from Pexels {images[0]?.photographer ? `· ${images[0].photographer}` : ""}
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ElevateLooks;
