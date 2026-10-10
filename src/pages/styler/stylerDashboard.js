// src/components/CalendarDashboard.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GoodToKnow from "../../components/goodToKnow";
import { APIService } from "../../hooks/remote/apiService";
import { humanizeConnectReason, showErrorToastMessage } from "../../utils/constant";

const ALLOWED_ONBOARDING_HOSTS = ["connect.stripe.com", "connect.stripe.ca"];

const StylerDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");
  const loadAppointments = async () => {
    setLoadingAppointments(true);
    setAppointmentError("");
    try {
      const response = await APIService.stylerAppointments();
      if (!Array.isArray(response.data?.data)) throw new Error("Invalid appointments");
      setAppointments(response.data.data.filter(item => ["1", "3"].includes(item.statusCode))
        .sort((a, b) => `${a.appointmentDate} ${a.arrivalTime}`.localeCompare(`${b.appointmentDate} ${b.arrivalTime}`)));
    } catch { setAppointmentError("Could not load your appointments."); }
    finally { setLoadingAppointments(false); }
  };
  useEffect(() => { loadAppointments(); }, []);

  // Stripe Connect payouts — "Get paid" setup for the stylist.
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectReason, setConnectReason] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const [connectError, setConnectError] = useState("");
  const loadConnectStatus = async () => {
    setConnectStatus(null);
    setConnectError("");
    try {
      const response = await APIService.getStylerConnectStatus();
      if (!response.data?.data?.status) throw new Error("Missing status");
      setConnectStatus(response.data.data.status);
      setConnectReason(response.data.data.disabledReason || null);
    } catch { setConnectError("Could not load payout status."); }
  };
  useEffect(() => { loadConnectStatus(); }, []);

  const startConnect = async () => {
    if (connecting || !connectStatus || connectError) return;
    setConnecting(true);
    try {
      const dashboardUrl = `${window.location.origin}/styler-dashboard`;
      const { data } = await APIService.createStylerConnectAccount({
        returnUrl: `${dashboardUrl}?connect=done`,
        refreshUrl: dashboardUrl,
      });
      if (data?.statusCode !== "200") {
        // The backend answers HTTP 200 with the error in the body (no
        // exception thrown), so surface it explicitly instead of failing silent.
        showErrorToastMessage(data?.message || "Could not start Stripe Connect. Please try again.");
        return;
      }
      if (data?.data?.onboardingUrl) {
        const onboardingUrl = new URL(data.data.onboardingUrl);
        if (onboardingUrl.protocol !== "https:" || !ALLOWED_ONBOARDING_HOSTS.includes(onboardingUrl.hostname)) {
          showErrorToastMessage("Invalid onboarding URL. Please try again.");
        } else {
          window.location.href = data.data.onboardingUrl;
        }
      } else if (data?.data?.status) {
        setConnectStatus(data.data.status);
      }
    } catch (error) {
      showErrorToastMessage(error?.response?.data?.message || "Could not start Stripe Connect. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const payoutBadge = connectStatus === "COMPLETE"
    ? { label: "Ready for payouts", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : connectStatus === "REJECTED"
      ? { label: "Needs attention", cls: "bg-red-50 text-red-700 border-red-200" }
      : connectStatus === "PENDING"
        ? { label: "Setup in progress", cls: "bg-amber-50 text-amber-700 border-amber-200" }
        : { label: "Not connected", cls: "bg-gray-50 text-gray-600 border-gray-200" };

  return (
    <>
    <div className='border border-black/10 rounded-lg relative'>
      <div className="border-b border-black/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-t-lg">
        <div>
          <p className="text-sm font-semibold">Get paid</p>
          <p className="text-xs text-black/50 mt-0.5">
            {connectStatus === "COMPLETE"
              ? "Payouts are enabled. Your share of each completed appointment is paid to your connected Stripe account."
              : connectStatus === "REJECTED"
                ? "Stripe could not verify your payout account."
                : "Connect a Stripe account to receive payouts for completed appointments. Your ID and bank details are collected securely by Stripe."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connectError ? <div role="alert"><p>{connectError}</p><button type="button" onClick={loadConnectStatus}>Retry payout status</button></div> : connectStatus ? <span className={`text-xs font-medium border rounded-full px-3 py-1 ${payoutBadge.cls}`}>{payoutBadge.label}</span> : <p role="status">Loading payout status…</p>}
          {connectStatus && !connectError && connectStatus !== "COMPLETE" && (
            <button
              type="button"
              onClick={startConnect}
              disabled={connecting}
              className={`text-xs text-white rounded-md px-4 py-2 ${connectStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700" : "bg-brand"}`}
            >
              {connecting ? "Opening Stripe..." : connectStatus === "PENDING" ? "Continue setup" : connectStatus === "REJECTED" ? "Reconnect" : "Connect to get paid"}
            </button>
          )}
        </div>
      </div>
      {connectStatus === "REJECTED" && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <p className="font-semibold flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-red-600" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            Rejection reason: <span className="font-medium">{humanizeConnectReason(connectReason)}</span>
          </p>
          <p className="mt-0.5 text-red-700/80">Reconnect to re-enter your details. Your earnings stay safe until it's sorted.</p>
        </div>
      )}
      <div className="border-b border-black/10 p-4 flex flex-wrap justify-between gap-3">
        <h2 className="text-sm font-semibold">Active appointments</h2>
        <Link to="/styler-dashboard/calendar" className="text-sm text-brand underline">Open calendar</Link>
      </div>
      <div className="p-4 text-sm">
        <p className="mb-3 text-black/60">Oldest first. Pending and confirmed appointments stay here until resolved.</p>
        {loadingAppointments ? <p role="status">Loading appointments…</p> : appointmentError ? <div role="alert"><p>{appointmentError}</p><button type="button" onClick={loadAppointments} className="mt-2 text-brand underline">Retry appointments</button></div> : appointments.length === 0 ? <p>No active appointments.</p> : <ul className="divide-y divide-black/10">
          {appointments.slice(0, 5).map(item => <li key={item.appointmentId} className="py-3">
            <p className="font-semibold">{[item.userData?.firstname, item.userData?.lastname].filter(Boolean).join(" ") || "Client"}</p>
            <p>{item.subServiceData?.name || "Appointment"}</p>
            <p className="text-black/60">{item.appointmentDate} · {item.arrivalTime} {item.stylerData?.timeZone || ""}</p>
            <p>{item.statusCode === "1" ? "Awaiting your response" : "Confirmed"}</p>
          </li>)}
        </ul>}
        <Link to="/styler-dashboard/appointments" className="inline-block mt-4 text-brand underline">Manage appointments</Link>
      </div>
    </div>
    {/* Pricing & cancellation basics — right under the get-paid card. */}
    <div className="mt-4">
      <GoodToKnow variant="styler" />
    </div>
    </>
  );
};

export default StylerDashboard;
