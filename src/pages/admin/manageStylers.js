import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { requestError } from "../../hooks/remote/marketplaceApi";
import { cloudinaryAvatar } from "../../utils/cloudinaryImage";
import { AdminCard, AdminPage, AdminPill } from "./adminShell";
import AdminGallery from "./adminGallery";
import { digitsOf } from "./adminFormat";
import {
  getAuthToken,
  isAdminRole,
  showSuccessToastMessage,
} from "../../utils/constant";

/** Verification states as the shell's shared tones. They used to be four
 *  hand-picked colour pairs here and a different set again on the two other pages
 *  showing the same statuses. */
const STATUS_TONES = {
  PENDING: "attention",
  APPROVED: "positive",
  REJECTED: "negative",
  SUSPENDED: "neutral",
};

const FILTERS = ["All", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

const encodeSegment = value => {
  try { return encodeURIComponent(btoa(value)); } catch { return encodeURIComponent(btoa("stylist")); }
};
/** The stylist's public profile, in the same encoded form the public cards link to. */
export const publicProfilePath = styler =>
  `/stylistProfile/${encodeSegment(styler.stylerId)}/${encodeSegment(styler.businessName || [styler.firstname, styler.lastname].filter(Boolean).join(" ") || "stylist")}`;

const ManageStylers = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("section") === "images" ? "images" : "verification";
  const setTab = value => setParams(value === "images" ? {section:"images"} : {});
  const [stylers, setStylers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null); // stylerId currently being acted on
  const writeLock = useRef(false);
  const [actionError, setActionError] = useState("");
  const [openingId, setOpeningId] = useState(null);
  const writing = busyId !== null;

  const loadQueue = () => {
    setLoading(true);
    setLoadError("");
    APIService.getStylerVerificationQueue()
      .then((res) => setStylers(res.data?.data || []))
      .catch(() => setLoadError("Unable to load stylists."))
      .finally(() => setLoading(false));
  };

  /**
   * ID photos are private: the stored URL no longer opens, so each view asks
   * the backend for a signed link that expires after a few minutes. The tab is
   * opened before the request so the browser does not block it as a pop-up.
   */
  const viewIdentification = async (styler) => {
    if (openingId) return;
    setActionError("");
    setOpeningId(styler.stylerId);
    const win = window.open("", "_blank");
    try {
      const result = await AdminAPI.identificationImage(styler.stylerId);
      if (!result?.url) throw new Error("No identification link was returned.");
      if (win) { win.opener = null; win.location.href = result.url; }
      else window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (win) win.close();
      setActionError(`Unable to open the identification document. ${requestError(error)}`);
    } finally {
      setOpeningId(null);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const visible = filter === "All" ? stylers : stylers.filter(s => s.verificationStatus === filter);
  const list = useAdminList(visible, s => [s.firstname, s.lastname, s.businessName, s.emailAddress, s.phoneNumber, digitsOf(s.phoneNumber), s.city, s.serviceTypeName].filter(Boolean).join(" "));

  if (!getAuthToken() || !isAdminRole()) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleAction = async (styler, action) => {
    if (writeLock.current) return;
    const name = styler.businessName || [styler.firstname, styler.lastname].filter(Boolean).join(" ") || "this stylist";
    if (action !== "APPROVE" && !window.confirm(`${action === "REJECT" ? "Reject" : "Suspend"} ${name}? This changes their verification status and may prevent bookings.`)) return;
    writeLock.current = true;
    setActionError("");
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
      setActionError(error?.response?.data?.message || error?.message || "Unable to update stylist.");
    } finally {
      writeLock.current = false;
      setBusyId(null);
    }
  };

  return (
    <AdminPage eyebrow="Admin" title={tab === "images" ? "Gallery" : "Stylists"}>
        {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}
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
          <AdminGallery />
        ) : (
          <>
            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); list.setPage(1); }}
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

            <AdminListControls list={list} label="Search stylists" />
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : loadError ? (
            <div role="alert">{loadError} <button type="button" onClick={loadQueue}>Retry</button></div>
          ) : list.filteredCount === 0 && list.search.trim() ? (
              <AdminCard pad="p-8" className="text-center"><AdminNoMatches list={list} noun="stylists" /></AdminCard>
            ) : list.filteredCount === 0 ? (
              <AdminCard pad="p-8" className="text-center">
                <p className="text-sm text-gray-500">
                  No stylists in this view yet. New registrations appear here as Pending.
                </p>
              </AdminCard>
            ) : (
              <div className="grid gap-4">
                {list.visibleItems.map((s) => (
                  <AdminCard key={s.stylerId} pad="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        {s.profileImageUrl ? (
                          <img
                            src={cloudinaryAvatar(s.profileImageUrl)}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-full object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="h-14 w-14 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                            {s.firstname?.charAt(0)}
                            {s.lastname?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 break-words">
                          <p className="text-gray-900">
                            {s.firstname} {s.lastname}
                          </p>
                          <p className="text-sm text-gray-500">
                            {s.businessName || "-"} | {s.serviceTypeName || "Service"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {s.city ? `${s.city}, ${s.province || ""}` : s.province || "-"}
                          </p>
                          {/* Customers travel to this address, and approval is
                              refused without one, so it belongs on the card. */}
                          {s.businessAddress ? (
                            <p className="text-sm text-gray-500">{s.businessAddress}</p>
                          ) : (
                            <p className="text-sm font-semibold text-amber-700">
                              No business address yet
                            </p>
                          )}
                          <p className="text-sm text-gray-400 break-all">
                            {s.emailAddress} | {s.phoneNumber || "-"}
                          </p>
                          {s.dateRegistered && (
                            <p className="text-xs text-gray-400">
                              Registered {s.dateRegistered}
                            </p>
                          )}
                        </div>
                      </div>
                      <AdminPill tone={STATUS_TONES[s.verificationStatus] || "neutral"}>
                        {s.verificationStatus || "-"}
                      </AdminPill>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex flex-wrap items-center gap-3">
                        {s.identificationImageUrl ? (
                          <button type="button" onClick={() => viewIdentification(s)} disabled={openingId !== null} className="text-sm text-brand font-semibold hover:underline disabled:opacity-60">
                            {openingId === s.stylerId ? "Opening…" : "View identification"}
                          </button>
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
                      <div className="flex flex-wrap gap-2">
                        <Link to={publicProfilePath(s)} target="_blank" rel="noreferrer" className="py-2 px-4 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 hover:border-brand">
                          View profile
                        </Link>
                        {s.verificationStatus !== "APPROVED" && (
                          <button
                            onClick={() => handleAction(s, "APPROVE")}
                            // Approval needs somewhere to send the customer: the
                            // backend refuses without an address, so the button
                            // says so up front instead of failing on click.
                            disabled={writing || s.addressOnFile === false}
                            title={
                              s.addressOnFile === false
                                ? "Ask this professional for their business address first. Approving without one would leave them unlisted and unbookable."
                                : ""
                            }
                            className="py-2 px-4 bg-green-600 rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            Approve
                          </button>
                        )}
                        {/* Reject is an application decision; an approved stylist is suspended instead. */}
                        {s.verificationStatus !== "REJECTED" && s.verificationStatus !== "APPROVED" && (
                          <button
                            onClick={() => handleAction(s, "REJECT")}
                            disabled={writing}
                            className="py-2 px-4 bg-red-600 rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        )}
                        {s.verificationStatus !== "SUSPENDED" && (
                          <button
                            onClick={() => handleAction(s, "SUSPEND")}
                            disabled={writing}
                            className="py-2 px-4 bg-gray-600 rounded-md text-sm text-white font-semibold hover:opacity-90 disabled:opacity-60"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  </AdminCard>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-800 font-semibold">
            ← Admin dashboard
          </Link>
        </div>
    </AdminPage>
  );
};

export default ManageStylers;
