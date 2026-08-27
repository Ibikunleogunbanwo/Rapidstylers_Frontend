import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import {
  getAuthToken,
  isAdminRole,
  clearAuthToken,
  clearAdminRole,
  showSuccessToastMessage,
} from "../../utils/constant";

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-200 text-gray-700",
};

const FILTERS = ["All", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

const AdminNav = () => (
  <div className="flex gap-4 mb-6 text-sm font-semibold">
    <Link to="/admin/categories" className="text-gray-500 hover:text-gray-800">
      Categories
    </Link>
    <Link to="/admin/blog" className="text-gray-500 hover:text-gray-800">
      Blog
    </Link>
    <Link to="/admin/stylers" className="text-brand underline">
      Stylist verification
    </Link>
    <Link to="/admin/operations" className="text-gray-500 hover:text-gray-800">
      Operations
    </Link>
  </div>
);

const ManageStylers = () => {
  document.title = "Stylist Management | RapidStylers";
  const [tab, setTab] = useState("verification"); // "verification" | "images"
  const [stylers, setStylers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null); // stylerId currently being acted on
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [busyImageId, setBusyImageId] = useState(null);

  const loadQueue = () => {
    APIService.getStylerVerificationQueue()
      .then((res) => setStylers(res.data?.data || []))
      .catch(() => setStylers([]))
      .finally(() => setLoading(false));
  };

  const loadImages = () => {
    setImagesLoading(true);
    APIService.getAllPortfolios()
      .then((res) => setImages(res.data?.data || []))
      .catch(() => setImages([]))
      .finally(() => setImagesLoading(false));
  };

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (tab === "images") loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!getAuthToken() || !isAdminRole()) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleAction = async (styler, action) => {
    setBusyId(styler.stylerId);
    try {
      await APIService.adminUpdateStylerVerification({
        stylerId: styler.stylerId,
        action,
      });
      showSuccessToastMessage(
        `${styler.businessName || styler.firstname + " " + styler.lastname} ${action.toLowerCase()}d`
      );
      loadQueue();
    } catch (error) {
      // Error toasts are handled in APIService
    } finally {
      setBusyId(null);
    }
  };

  const visible =
    filter === "All"
      ? stylers
      : stylers.filter((s) => s.verificationStatus === filter);

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-2xl font-bold text-gray-900">Stylist Management</p>
          <button
            onClick={() => {
              clearAuthToken();
              clearAdminRole();
              window.location.href = "/admin/login";
            }}
            className="text-sm text-gray-500 hover:text-gray-800 font-semibold"
          >
            Sign out
          </button>
        </div>

        <AdminNav />

        {/* Section tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("verification")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              tab === "verification"
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand"
            }`}
          >
            Verification queue
          </button>
          <button
            onClick={() => setTab("images")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              tab === "images"
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand"
            }`}
          >
            Gallery images
          </button>
        </div>

        {tab === "images" ? (
          <div>
            {imagesLoading ? (
              <p className="text-sm text-gray-500">Loading images…</p>
            ) : images.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <p className="text-sm text-gray-500">
                  No stylist portfolio images uploaded yet. They appear here once stylists add work.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="relative h-40 bg-gray-100">
                      <img
                        src={img.imageUrl}
                        alt={img.category || "Portfolio image"}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 uppercase">
                        {img.category || "—"}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {img.businessName || [img.firstname, img.lastname].filter(Boolean).join(" ") || "Stylist"}
                      </p>
                      <p className="text-xs text-gray-400 truncate mb-2">
                        {img.emailAddress || ""} · {img.createdAt || ""}
                      </p>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this image from the gallery? The stylist will be emailed.")) {
                            setBusyImageId(img.id);
                            APIService.adminDeletePortfolioImage(img.id)
                              .then(() => {
                                showSuccessToastMessage("Image removed and stylist notified");
                                loadImages();
                              })
                              .catch(() => {})
                              .finally(() => setBusyImageId(null));
                          }
                        }}
                        disabled={busyImageId === img.id}
                        className="w-full py-1.5 rounded-md bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 disabled:opacity-60"
                      >
                        {busyImageId === img.id ? "Deleting…" : "Delete image"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                    filter === f
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand"
                  }`}
                >
                  {f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                  {f !== "All" &&
                    ` (${stylers.filter((s) => s.verificationStatus === f).length})`}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : visible.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <p className="text-sm text-gray-500">
                  No stylists in this view yet. New registrations appear here as Pending.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {visible.map((s) => (
                  <div key={s.stylerId} className="bg-white rounded-2xl shadow-md p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        {s.profileImageUrl ? (
                          <img
                            src={s.profileImageUrl}
                            alt=""
                            className="h-14 w-14 rounded-full object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                            {s.firstname?.charAt(0)}
                            {s.lastname?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">
                            {s.firstname} {s.lastname}
                          </p>
                          <p className="text-sm text-gray-500">
                            {s.businessName || "—"} | {s.serviceTypeName || "Service"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {s.city ? `${s.city}, ${s.province || ""}` : s.province || "—"}
                          </p>
                          <p className="text-sm text-gray-400">
                            {s.emailAddress} | {s.phoneNumber || "—"}
                          </p>
                          {s.dateRegistered && (
                            <p className="text-xs text-gray-400">
                              Registered {s.dateRegistered}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[s.verificationStatus] || "bg-gray-100 text-gray-600"}`}
                      >
                        {s.verificationStatus || "—"}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        {s.identificationImageUrl ? (
                          <a href={s.identificationImageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand font-semibold hover:underline">
                            <img
                              src={s.identificationImageUrl}
                              alt="Identification document"
                              className="h-10 w-10 rounded object-cover bg-gray-100"
                            />
                            View identification
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No identification image uploaded
                          </span>
                        )}
                        {s.identificationId && (
                          <span className="text-sm text-gray-500">
                            ID: {s.identificationId}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {s.verificationStatus !== "APPROVED" && (
                          <button
                            onClick={() => handleAction(s, "APPROVE")}
                            disabled={busyId === s.stylerId}
                            className="py-2 px-4 bg-green-600 rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            Approve
                          </button>
                        )}
                        {s.verificationStatus !== "REJECTED" && (
                          <button
                            onClick={() => handleAction(s, "REJECT")}
                            disabled={busyId === s.stylerId}
                            className="py-2 px-4 bg-red-600 rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        )}
                        {s.verificationStatus !== "SUSPENDED" && (
                          <button
                            onClick={() => handleAction(s, "SUSPEND")}
                            disabled={busyId === s.stylerId}
                            className="py-2 px-4 bg-gray-600 rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 font-semibold">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ManageStylers;
