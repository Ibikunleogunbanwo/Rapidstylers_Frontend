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
  "Natural hair",
  "Locs",
];

const MAX_IMAGES = 30;

const MyWork = () => {
  document.title = "My Work | RapidStylers";
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (item) => {
    if (deletingId) return;
    if (!window.confirm("Remove this photo from your portfolio? It will disappear from the gallery.")) return;
    setDeletingId(item.id);
    try {
      await APIService.deleteOwnPortfolioImage(item.id);
      showSuccessToastMessage("Photo removed from your portfolio");
      loadPortfolio();
    } catch (error) {
      // Error toasts are handled inside APIService.
    } finally {
      setDeletingId(null);
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
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  aria-label={`Delete ${item.name || item.category || "photo"}`}
                  title="Remove photo"
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-40"
                >
                  {deletingId === item.id ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWork;
