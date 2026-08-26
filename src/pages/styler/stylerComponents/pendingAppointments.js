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
                  {appointment.billableTravelKm || 0}km billable after {appointment.includedTravelKm || 15}km included
                </span>
              )}
            </div>
          </div>
          <div className="text-sm">
            <div className="text-gray-400">Total estimate:</div>
            <div>{appointment?.price ? `$${appointment.price}` : "—"}</div>
          </div>
          {appointment?.serviceTime === "homeService" && (
            <div className="text-sm">
              <div className="text-gray-400">Estimated distance:</div>
              <div>{appointment?.travelDistanceKm ?? "—"}km</div>
            </div>
          )}
          <div className="text-sm">
            <div className="text-gray-400">Rate above included distance:</div>
            <div>${appointment?.extraTravelRatePerKm || "0.00"}/km</div>
          </div>
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
                onClick={actionLoading ? undefined : onAccept}
              >
                {actionLoading ? "Updating…" : "Confirm appointment"}
              </div>
              <div
                className="bg-rose-100 rounded-md text-xs text-rose-500 p-5 text-center cursor-pointer"
                onClick={actionLoading ? undefined : onDecline}
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
