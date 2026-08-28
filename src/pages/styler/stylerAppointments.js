import { useEffect, useState } from "react";
import more from "../../assets/svg-icons/more.svg";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, showSuccessToastMessage } from "../../utils/constant";
import PendingAppointments from "./stylerComponents/pendingAppointments";
import SectionPager from "../../components/sectionPager";

const APPOINTMENT_PAGE_SIZE = 10;

const StylerAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("pending"); // "pending" | "past"
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  // Independent page per view so switching tabs keeps each list's position.
  const [pendingPage, setPendingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await APIService.stylerAppointments();
      setAppointments(res.data?.data || []);
    } catch (error) {
      // Error toasts are handled inside APIService.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pending (awaiting a decision) + accepted (upcoming) are the live queue;
  // completed / rejected / cancelled are history.
  const pending = appointments.filter(
    (a) => a.statusCode === "1" || a.statusCode === "3"
  );
  const past = appointments.filter((a) =>
    ["0", "2", "4"].includes(a.statusCode)
  );
  const pendingTotalPages = Math.max(1, Math.ceil(pending.length / APPOINTMENT_PAGE_SIZE));
  const pastTotalPages = Math.max(1, Math.ceil(past.length / APPOINTMENT_PAGE_SIZE));
  const safePendingPage = Math.min(pendingPage, pendingTotalPages);
  const safePastPage = Math.min(pastPage, pastTotalPages);
  const visiblePending = pending.slice(
    (safePendingPage - 1) * APPOINTMENT_PAGE_SIZE,
    safePendingPage * APPOINTMENT_PAGE_SIZE
  );
  const visiblePast = past.slice(
    (safePastPage - 1) * APPOINTMENT_PAGE_SIZE,
    safePastPage * APPOINTMENT_PAGE_SIZE
  );

  // Must match app.booking.styler-cancel-window-hours on the backend — the
  // server remains authoritative; this only hides the button outside the window.
  const STYLER_CANCEL_WINDOW_HOURS = 24;
  const completedCancelAllowed = (a) => {
    if (a.statusCode !== "0" || !a.completedAt) return false;
    const completed = new Date(a.completedAt).getTime();
    return (
      Number.isFinite(completed) &&
      Date.now() - completed <= STYLER_CANCEL_WINDOW_HOURS * 60 * 60 * 1000
    );
  };

  const runAction = async (appointmentId, action) => {
    setActionLoading(true);
    try {
      if (action === "accept") {
        await APIService.acceptAppointment(appointmentId);
        showSuccessToastMessage("Appointment confirmed");
      } else if (action === "decline") {
        await APIService.declineAppointment(appointmentId);
        showSuccessToastMessage("Appointment rejected");
      } else if (action === "complete") {
        await APIService.completeAppointment(appointmentId);
        showSuccessToastMessage("Appointment marked as completed");
      } else if (action === "cancel") {
        if (!window.confirm("Cancel this booking and refund the client? This cannot be undone.")) {
          setActionLoading(false);
          return;
        }
        await APIService.stylerCancelAppointment(appointmentId);
        showSuccessToastMessage("Appointment cancelled — payment refunded");
      }
      setSelectedAppointment(null);
      await loadAppointments();
    } catch (error) {
      // Error toasts are handled inside APIService.
    } finally {
      setActionLoading(false);
    }
  };

  const activeStyle = "bg-brand text-white p-4 rounded-md font-medium";
  const inactiveStyle = "bg-gray-50 border rounded-md border p-4 text-gray-500";

  const statusLabel = (code) =>
    code === "0" ? "Completed" : code === "2" ? "Rejected" : "Cancelled";
  const statusColor = (code) =>
    code === "0" ? "text-emerald-500" : "text-rose-500";

  const serviceName = (a) => a.subServiceData?.name || "Service";
  const clientName = (a) =>
    [a.userData?.firstname, a.userData?.lastname].filter(Boolean).join(" ") ||
    a.userData?.emailAddress ||
    "Client";
  const dateTime = (a) => `${a.appointmentDate}${a.arrivalTime ? ", " + a.arrivalTime : ""}`;

  if (!getAuthToken()) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-gray-500">
        Please sign in to view your appointments.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="border-b p-4 font-medium text-sm">My appointments:</div>
      <div className="p-4">
        <div className="text-xs flex gap-4">
          <div
            className={`p-2 cursor-pointer ${
              view === "pending" ? activeStyle : inactiveStyle
            }`}
            onClick={() => setView("pending")}
          >
            Pending appointments
          </div>
          <div
            className={`p-2 cursor-pointer ${
              view === "past" ? activeStyle : inactiveStyle
            }`}
            onClick={() => setView("past")}
          >
            Past appointments
          </div>
        </div>

        {loading ? (
          <div className="mt-10 text-sm text-gray-500">Loading appointments…</div>
        ) : view === "pending" ? (
          pending.length === 0 ? (
            <div className="mt-10 text-sm text-gray-500">
              No pending appointments. New booking requests will appear here.
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-6">
                {visiblePending.map((appointment) => (
                <div
                  key={appointment.appointmentId}
                  className="grid grid-cols-12 gap-4 pb-3 border-b last:border-0"
                >
                  <div className="flex col-span-10 md:col-span-11 gap-4">
                    <div className="grid">
                      <span className="text-[15px] truncate">
                        {serviceName(appointment)}
                      </span>
                      <span className="text-sm text-black/50">
                        {clientName(appointment)} · {dateTime(appointment)}
                      </span>
                      <span
                        className={`text-xs font-medium mt-1 ${
                          appointment.statusCode === "1"
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {appointment.statusCode === "1" ? "Pending" : "Accepted"}
                      </span>
                    </div>
                  </div>
                  <div className="cursor-pointer col-span-2 md:col-span-1 flex justify-end">
                    <img
                      src={more}
                      alt="More appointment actions"
                      className="h-8"
                      onClick={() => setSelectedAppointment(appointment)}
                    />
                  </div>
                </div>
              ))}
              </div>
              <SectionPager
                page={safePendingPage}
                totalPages={pendingTotalPages}
                totalItems={pending.length}
                pageSize={APPOINTMENT_PAGE_SIZE}
                onPage={setPendingPage}
              />
            </>
          )
        ) : past.length === 0 ? (
          <div className="mt-10 text-sm text-gray-500">
            No past appointments yet.
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-6">
              {visiblePast.map((appointment) => (
              <div
                key={appointment.appointmentId}
                className="flex justify-between gap-4 pb-3 border-b last:border-0"
              >
                <div className="flex col-span-10 md:col-span-11 gap-4">
                  <div className="grid">
                    <span className="text-[15px] truncate">
                      {serviceName(appointment)}
                    </span>
                    <span className="text-sm text-black/50">
                      {clientName(appointment)} · {dateTime(appointment)}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-2">
                  <span
                    className={`text-sm font-semibold ${statusColor(
                      appointment.statusCode
                    )}`}
                  >
                    {statusLabel(appointment.statusCode)}
                  </span>
                  {completedCancelAllowed(appointment) && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => runAction(appointment.appointmentId, "cancel")}
                      className="rounded-md border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      {actionLoading ? "…" : "Cancel & refund"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
            <SectionPager
              page={safePastPage}
              totalPages={pastTotalPages}
              totalItems={past.length}
              pageSize={APPOINTMENT_PAGE_SIZE}
              onPage={setPastPage}
            />
          </>
        )}
      </div>
      {selectedAppointment && (
        <PendingAppointments
          appointment={selectedAppointment}
          onclose={() => setSelectedAppointment(null)}
          actionLoading={actionLoading}
          onAccept={() => runAction(selectedAppointment.appointmentId, "accept")}
          onDecline={() => runAction(selectedAppointment.appointmentId, "decline")}
          onComplete={() => runAction(selectedAppointment.appointmentId, "complete")}
        />
      )}
    </div>
  );
};

export default StylerAppointments;
