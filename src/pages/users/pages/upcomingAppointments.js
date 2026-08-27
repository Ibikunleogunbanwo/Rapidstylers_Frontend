import more from "../../../assets/svg-icons/more.svg";
import close from "../../../assets/svg-icons/closeBlack.svg";
import React, { useState } from "react";
import { APIService } from "../../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../../utils/constant";

const Appointments = ({appointmentDate, arrivalTime, serviceProvider, serviceType, businessAddress,serviceName, numberOfPeople, appointmentStatus, appointmentPrice, servicePrice, travelFee, includedTravelKm, billableTravelKm, travelDistanceKm, extraTravelRatePerKm, appointmentId, statusCode, paymentStatus, paymentFailureCode, refundStatus, refundAmount, refundCompletedAt}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

  // Function to toggle the menu visibility
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Function to close the menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const canCancel = statusCode === "1" || statusCode === "3";

  const handleRetryPayment = async () => {
    if (!appointmentId || retryingPayment) return;
    setRetryingPayment(true);
    try {
      await APIService.retryAppointmentPayment(appointmentId);
      showSuccessToastMessage("Payment completed and your appointment is confirmed");
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      // APIService displays the actionable payment error.
    } finally {
      setRetryingPayment(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointmentId || cancelling) return;
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelling(true);
    try {
      await APIService.cancelAppointment(appointmentId);
      showSuccessToastMessage("Appointment cancelled");
      closeMenu();
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      // Error toasts are handled inside APIService.
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="">
      <div className="grid gap-3 mt-4">
        <div className="border rounded-lg text-sm py-4 divide-x grid grid-cols-12 gap-6">
          <div className=" flex items-center px-4 col-span-12 md:col-span-3 order-2 md:order-1">
            <div className="flex items-end md:items-center gap-4 md:gap-0 md:grid">
              <div className="grid">
                <span className="text-black/50">Date:</span>
                <span>{appointmentDate}</span>
              </div>
              <p className="mt-2">{arrivalTime}</p>
            </div>
          </div>
          <div className="px-4 col-span-12 md:col-span-9 order-1 md:order-2">
            <div className="flex justify-between">
              <div className="text-xs flex items-center gap-1">
                <div className="bg-[#c4c4c4] rounded-full border h-[8px] w-[8px]"></div>
                <div className="text-[#c4c4c4]">{appointmentStatus}</div>
              </div>
              <div>
                <img
                  src={more}
                  alt=""
                  onClick={toggleMenu}
                  className="cursor-pointer h-7"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 md:mt-1">
              <div className="grid">
                <span className="text-black/50">Service provider:</span>
                <span className="truncate text-[15px]">{serviceProvider}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Amount:</span>
                <div className="flex gap-1 items-center">
                  <span className="truncate font-bold text-[15px]">{appointmentPrice}</span>
                  <span className="text-gray-400">CAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* appointment details */}
      <div
        className={`fixed w-full h-[100vh] top-0 bottom-0 left-0 right-0 ${
          menuVisible ? "block" : "hidden"
        }`}
      >
        <div className="bg-black/50 h-full w-full px-4 flex justify-center items-center">
          <div className="bg-white relative w-full md:w-[40%] lg:w-[35%] rounded-md border max-h-[60%] md:max-h-[80%] overflow-y-scroll">
            <div className="border-b sticky top-0 bg-white flex justify-between items-center px-6 py-5">
              <p className="font-semibold">Appointment details</p>
              <img
                src={close}
                alt=""
                className="h-6 cursor-pointer"
                onClick={closeMenu}
              />
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4 text-sm">
              <div className="grid">
                <span className="text-black/50">Service provider:</span>
                <span className="truncate">{serviceProvider}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Service type:</span>
                <span className="">{serviceType}</span>
              </div>                  <div className="col-span-2 grid">
                <div className="flex gap-2"><span className="text-black/50">Address:</span>{businessAddress ? (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(businessAddress)}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">[ Get directions ]</a>
                ) : (
                  <span className="text-gray-400">No address</span>
                )}</div>
                <span>{businessAddress}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Service name:</span>
                <span>{serviceName}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Service price:</span>
                <span>{servicePrice || appointmentPrice} CAD</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Travel fee:</span>
                <span>
                  {travelFee || "0.00"} CAD
                  {travelFee && (
                    <span className="block text-xs text-gray-500">
                      {billableTravelKm || 0}km billable after {includedTravelKm || 15}km included
                    </span>
                  )}
                </span>
              </div>
              <div className="grid">
                <span className="text-black/50">Total estimate:</span>
                <span>{appointmentPrice} CAD</span>
              </div>
              {travelDistanceKm != null && (
                <div className="grid">
                  <span className="text-black/50">Estimated distance:</span>
                  <span>{travelDistanceKm}km at ${extraTravelRatePerKm || "0.00"}/km above included distance</span>
                </div>
              )}
              <div className="grid">
                <span className="text-black/50">Number of people:</span>
                <span className="">{numberOfPeople}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Appointment status:</span>
                <span className="">{appointmentStatus}</span>
              </div>
              {refundStatus === "COMPLETED" ? (
                <div className="col-span-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800">
                  <span className="font-semibold">Refunded: </span>
                  {refundAmount ? `$${refundAmount} CAD` : "Your payment"}
                  {refundCompletedAt ? ` on ${refundCompletedAt}` : ""} — refunds appear on your statement within 5-10 business days.
                </div>
              ) : paymentStatus ? (
                <div className="col-span-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
                  <span className="font-semibold">Payment: </span>
                  {paymentStatus === "PAYMENT_ACCEPTED_SCHEDULED"
                    ? "Payment will be processed 48 hours before the appointment."
                    : paymentStatus === "PAYMENT_REQUIRES_ACTION"
                    ? "Payment authentication is required."
                    : paymentStatus === "PAYMENT_FAILED"
                    ? "Payment could not be completed."
                    : paymentStatus}
                  {["PAYMENT_FAILED", "PAYMENT_REQUIRES_ACTION"].includes(paymentStatus) && (
                    <button
                      type="button"
                      onClick={handleRetryPayment}
                      className="ml-2 font-semibold underline"
                      disabled={retryingPayment}
                    >
                      {retryingPayment ? "Retrying…" : "Retry payment"}
                    </button>
                  )}
                </div>
              ) : null}
              <div className="col-span-2 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {canCancel && (
                    <div
                      className={`bg-[#FF6347] text-white w-full rounded-md text-center py-4 text-md lg:text-sm ${cancelling ? "opacity-60" : "cursor-pointer"}`}
                      onClick={handleCancelAppointment}
                    >
                      {cancelling ? "Cancelling…" : "Cancel appointment"}
                    </div>
                  )}
                  <div className=" bg-brand/15 text-brand w-full rounded-md text-center py-4 text-md lg:text-sm cursor-not-allowed opacity-60" title="Rescheduling coming soon">
                    Reschedule (coming soon)
                  </div>
                </div>
              </div>
              <div className=" col-span-2">
                <hr className="mt-4 mb-6"/>
                <p className="text-sm text-center text-gray-400">
                  Reviews are available once this appointment is completed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
