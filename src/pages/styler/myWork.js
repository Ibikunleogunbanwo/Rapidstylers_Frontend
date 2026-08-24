import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import {
  getAuthToken,
  showSuccessToastMessage,
} from "../../utils/constant";

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

const MAX_IMAGES = 30;

const MyWork = () => {
  document.title = "My Work | RapidStylers";
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadPortfolio = () => {
    APIService.getOwnPortfolio()
      .then((res) => setPortfolio(res.data?.data || []))
      .catch(() => setPortfolio([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    try {
      // 1. Upload the file to Cloudinary (backend-signed).
      const { url } = await uploadToCloudinary(file, "portfolio");
      // 2. Save it to the portfolio with its gallery category.
      await APIService.createPortfolio({
        imageUrl: url,
        name: category,
        category,
      });
      showSuccessToastMessage("Work added. It now appears in the gallery.");
      setFile(null);
      e.target.reset();
      loadPortfolio();
    } catch (error) {
      // Error toasts are handled inside APIService / uploadToCloudinary throws.
    } finally {
      setUploading(false);
    }
  };

  const remaining = MAX_IMAGES - portfolio.length;

  return (
    <div className="grid gap-6">
      <div className="bg-white rounded-2xl border border-[#1d1d1d0a] shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-lg font-bold">My Work</p>
            <p className="text-sm text-gray-400">
              Showcase your work. Approved photos appear in the public gallery.
            </p>
          </div>
          <span className="text-sm font-semibold text-brand">
            {portfolio.length} / {MAX_IMAGES} images
          </span>
        </div>

        {/* Upload form */}
        <form onSubmit={handleUpload} className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto] items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              required
              disabled={remaining <= 0}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-brand/10 file:text-brand file:font-semibold file:cursor-pointer hover:file:bg-brand/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={uploading || remaining <= 0}
            className="py-2.5 px-6 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload work"}
          </button>
        </form>
        {remaining <= 0 && (
          <p className="text-sm text-amber-600 mt-2">
            You've reached the {MAX_IMAGES}-image limit. Remove some to add more.
          </p>
        )}
      </div>

      {/* Portfolio grid */}
      <div className="bg-white rounded-2xl border border-[#1d1d1d0a] shadow-sm p-6">
        <p className="text-sm font-semibold mb-4">Your photos</p>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : portfolio.length === 0 ? (
          <p className="text-sm text-gray-400">
            No work uploaded yet. Add your first photo above.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {portfolio.map((item, i) => (
              <div key={i} className="group relative aspect-[4/5] rounded-md overflow-hidden bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.name || item.category}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wide text-white bg-black/60 backdrop-blur rounded-full px-2 py-0.5">
                  {item.category || "Work"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWork;
