import { useState } from "react";
import Modal from "../../../components/modals";

const PendingAppointments = ({
  appointment,
  onclose,
  onAccept,
  onDecline,
  onComplete,
  actionLoading = false,
}) => {
  const user = appointment?.userData || {};
  const subService = appointment?.subServiceData || {};
  const clientName = [user.firstname, user.lastname].filter(Boolean).join(" ") || user.emailAddress || "Client";
  const delivery = appointment?.serviceTime === "homeService" ? "Home service" : "Visit the stylist";
  const statusCode = appointment?.statusCode;
  const isHome = appointment?.serviceTime === "homeService";
  const [decisionNote, setDecisionNote] = useState("");
  const distanceKm = appointment?.travelDistanceKm;
  const withinFreeRadius =
    isHome && distanceKm != null && appointment?.includedTravelKm != null && distanceKm <= appointment.includedTravelKm;
  // Drive time is an estimate from straight-line km (roads run ~1.3x; city pace ~35 km/h).
  const approxDriveMin =
    isHome && distanceKm != null ? Math.max(5, Math.round(((distanceKm * 1.3) / 35) * 60)) : null;

  return (
    <Modal isVisible onClose={onclose} modalTitle="Appointment details" width="md:w-1/2 lg:w-1/3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
          <div className="text-sm md:col-span-2">
            <div className="text-gray-400">Client name:</div>
            <div>
              {clientName}
              {appointment?.noOfPeople && appointment.noOfPeople !== "1" && (
                <span className="text-gray-600 font-medium text-xs">
                  {" "}
                  (+{appointment.noOfPeople} guests)
                </span>
              )}
            </div>
          </div>
          <div className="text-sm md:col-span-2">
            <div className="text-gray-400">Service name:</div>
            <div>{subService.name || "Service"}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-400">Service delivery:</div>
            <div>{delivery}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-400">Date / time:</div>
            <div>
              {appointment?.appointmentDate}
              {appointment?.arrivalTime ? ", " + appointment.arrivalTime : ""}
            </div>
          </div>
          {user.address && (
            <div className="text-sm md:col-span-2">
              <div className="text-gray-400">Home address:</div>
              <div>{user.address}</div>
            </div>
          )}
          <div className="text-sm">
            <div className="text-gray-400">Service price:</div>
            <div>{appointment?.servicePrice ? `$${appointment.servicePrice}` : appointment?.price ? `$${appointment.price}` : "—"}</div>
          </div>
          <div className="text-sm">
            <div className="text-gray-400">Travel fee:</div>
            <div>
              {appointment?.travelFee ? `$${appointment.travelFee}` : "$0.00"}
              {appointment?.serviceTime === "homeService" && (
                <span className="block text-xs text-gray-500">
                  Free within {appointment.includedTravelKm || 15}km, then a flat home-visit fee
                </span>
              )}
            </div>
          </div>
          <div className="text-sm">
            <div className="text-gray-400">Total estimate:</div>
            <div>{appointment?.price ? `$${appointment.price}` : "—"}</div>
          </div>
          {isHome && distanceKm != null && (
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Travel to client</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{distanceKm} km</span>
                    {approxDriveMin != null && (
                      <span className="text-sm font-medium text-gray-600">· ~{approxDriveMin} min drive</span>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    withinFreeRadius ? "bg-emerald-100 text-emerald-700" : "bg-amber-200 text-amber-800"
                  }`}
                >
                  {withinFreeRadius ? "Within free radius" : "Flat fee applies"}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {withinFreeRadius
                  ? `No travel fee — within ${appointment.includedTravelKm}km.`
                  : `Flat home-visit fee of $${appointment?.baseTravelFee || "0.00"} applies (beyond ${appointment.includedTravelKm || 15}km).`}
                {" "}Drive time is an estimate from straight-line distance.
              </p>
            </div>
          )}
          <div className="text-sm">
            <div className="text-gray-400">Home visit fee:</div>
            <div>${appointment?.baseTravelFee || "0.00"}</div>
          </div>
          {statusCode === "1" && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Note for your records (optional)
              </label>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={
                  isHome
                    ? "e.g. Accepted anyway — far but worth it · declined — too far for this one"
                    : "e.g. Accepted this request · declined for now"
                }
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand focus:outline-none"
              />
            </div>
          )}
          <div className="text-sm">
            <div className="text-gray-400">Status:</div>
            <div>
              {statusCode === "1"
                ? "Pending"
                : statusCode === "3"
                ? "Accepted"
                : statusCode === "0"
                ? "Completed"
                : statusCode === "2"
                ? "Rejected"
                : statusCode === "4"
                ? "Cancelled"
                : "—"}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4 -mx-6 -mb-8">
          {statusCode === "1" ? (
            <>
              <div
                className="bg-emerald-500 rounded-md text-xs text-white p-5 text-center cursor-pointer"
                onClick={actionLoading ? undefined : () => onAccept(decisionNote)}
              >
                {actionLoading ? "Updating…" : "Confirm appointment"}
              </div>
              <div
                className="bg-rose-100 rounded-md text-xs text-rose-500 p-5 text-center cursor-pointer"
                onClick={actionLoading ? undefined : () => onDecline(decisionNote)}
              >
                {actionLoading ? "Updating…" : "Reject appointment"}
              </div>
            </>
          ) : statusCode === "3" ? (
            <div
              className="bg-emerald-500 rounded-md text-xs text-white p-5 text-center cursor-pointer md:col-span-2"
              onClick={actionLoading ? undefined : onComplete}
            >
              {actionLoading ? "Updating…" : "Mark as completed"}
            </div>
          ) : (
            <div
              className="bg-gray-100 rounded-md text-xs text-gray-500 p-5 text-center cursor-pointer md:col-span-2"
              onClick={onclose}
            >
              Close
            </div>
          )}
        </div>
    </Modal>
  );
};

export default PendingAppointments;
