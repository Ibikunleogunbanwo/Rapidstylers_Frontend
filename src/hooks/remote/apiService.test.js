import { APIService } from "./apiService";
import { ApiClient } from "./apiClient";
import { toast } from "react-toastify";

jest.mock("./apiClient", () => ({
  ApiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("RapidStylers API contracts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ApiClient.post.mockResolvedValue({ data: { statusCode: "200" } });
    ApiClient.get.mockResolvedValue({ data: { statusCode: "200" } });
    jest.spyOn(toast, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("booking sends the selected service identity without trusting client price", async () => {
    const booking = {
      stylerId: "STYLER1",
      subServiceId: "42",
      appointmentDate: "2030-08-24",
      arrivalTime: "9:30 am",
      serviceTime: "visitBarber",
      noOfPeople: "1",
    };

    await APIService.bookAppointment(booking);

    expect(ApiClient.post).toHaveBeenCalledWith("/book_appointment", booking);
    expect(ApiClient.post.mock.calls[0][1]).toEqual(
      expect.objectContaining({ subServiceId: "42" })
    );
    expect(ApiClient.post.mock.calls[0][1]).not.toHaveProperty("price");
  });

  test("booking estimate uses server-side travel fee contract", async () => {
    const estimateRequest = {
      stylerId: "STYLER1",
      subServiceId: "42",
      serviceTime: "homeService",
      noOfPeople: "1",
      travelDistanceKm: 22.5,
    };

    await APIService.estimateBooking(estimateRequest);

    expect(ApiClient.post).toHaveBeenCalledWith("/booking_estimate", estimateRequest);
    expect(ApiClient.post.mock.calls[0][1]).not.toHaveProperty("price");
  });

  test("unified sign-in surfaces invalid credential responses returned with an app-level 400", async () => {
    ApiClient.post.mockResolvedValueOnce({
      data: {
        statusCode: "400",
        message: "Invalid Email Address or Password",
      },
    });

    await expect(
      APIService.signIn({ emailAddress: "wrong@example.com", password: "bad" })
    ).rejects.toThrow("Invalid Email Address or Password");

    expect(toast.error).toHaveBeenCalledWith(
      "Invalid Email Address or Password",
      expect.objectContaining({ autoClose: 5000 })
    );
  });

  test("saved stylist actions target customer-owned endpoints", async () => {
    await APIService.listSavedStylists();
    await APIService.saveStylist("STYLER1");
    await APIService.removeSavedStylist("STYLER1");

    expect(ApiClient.get).toHaveBeenCalledWith("/saved_stylists");
    expect(ApiClient.post).toHaveBeenNthCalledWith(1, "/save_stylist?stylerId=STYLER1");
    expect(ApiClient.post).toHaveBeenNthCalledWith(2, "/remove_saved_stylist?stylerId=STYLER1");
  });

  test("notification inbox, read actions, preferences, and service updates use protected contracts", async () => {
    await APIService.listNotifications();
    await APIService.markNotificationRead(7);
    await APIService.markAllNotificationsRead();
    await APIService.getNotificationPreferences();
    await APIService.updateNotificationPreferences({ availability: false, price: true, verification: true });
    await APIService.updateSubService({ id: 9, name: "Braids", price: "140", durationMinutes: 90 });

    expect(ApiClient.get).toHaveBeenNthCalledWith(1, "/notifications");
    expect(ApiClient.get).toHaveBeenNthCalledWith(2, "/notification_preferences");
    expect(ApiClient.post).toHaveBeenNthCalledWith(1, "/notifications/read", { notificationId: 7 });
    expect(ApiClient.post).toHaveBeenNthCalledWith(2, "/notifications/read_all");
    expect(ApiClient.post).toHaveBeenNthCalledWith(3, "/notification_preferences", { availability: false, price: true, verification: true });
    expect(ApiClient.post).toHaveBeenNthCalledWith(4, "/update_sub_service", { id: 9, name: "Braids", price: "140", durationMinutes: 90 });
  });

  test("support, loyalty, referral, and admin operations use protected contracts", async () => {
    await APIService.createSupportTicket({ subject: "Booking issue", message: "Please help" });
    await APIService.listSupportTickets();
    await APIService.getLoyaltyAccount();
    await APIService.applyReferral("RS-ABC12345");
    await APIService.adminSupportTickets();
    await APIService.adminUpdateSupportTicket({ ticketId: 3, status: "RESOLVED", adminResponse: "Resolved" });
    await APIService.adminKpis();
    await APIService.adminAuditLogs();
    await APIService.adminReviewQueue();
    await APIService.adminUpdateReviewModeration({ reviewId: 8, action: "APPROVED" });

    expect(ApiClient.post).toHaveBeenCalledWith("/support_tickets", { subject: "Booking issue", message: "Please help" });
    expect(ApiClient.get).toHaveBeenCalledWith("/support_tickets");
    expect(ApiClient.get).toHaveBeenCalledWith("/loyalty_account");
    expect(ApiClient.post).toHaveBeenCalledWith("/apply_referral?referralCode=RS-ABC12345");
    expect(ApiClient.get).toHaveBeenCalledWith("/admin/support_tickets");
    expect(ApiClient.post).toHaveBeenCalledWith("/admin/update_support_ticket", { ticketId: 3, status: "RESOLVED", adminResponse: "Resolved" });
    expect(ApiClient.get).toHaveBeenCalledWith("/admin/kpis");
    expect(ApiClient.get).toHaveBeenCalledWith("/admin/audit_logs");
    expect(ApiClient.get).toHaveBeenCalledWith("/admin/review_moderation_queue");
    expect(ApiClient.post).toHaveBeenCalledWith("/admin/update_review_moderation", { reviewId: 8, action: "APPROVED" });
  });

  test("stylist service creation sends duration while ownership stays token-derived", async () => {
    const service = { name: "Knotless braids", price: "120", durationMinutes: "90" };

    await APIService.createSubService(service);

    expect(ApiClient.post).toHaveBeenCalledWith("/create_sub_service", service);
    expect(ApiClient.post.mock.calls[0][1]).not.toHaveProperty("stylerId");
  });

  test.each([
    ["accept", APIService.acceptAppointment],
    ["decline", APIService.declineAppointment],
    ["complete", APIService.completeAppointment],
    ["cancel", APIService.cancelAppointment],
  ])("appointment action %s targets the protected endpoint", async (action, method) => {
    await method("APPT-1");

    expect(ApiClient.post).toHaveBeenCalledWith(`/${action}_appointment`, {
      appointmentId: "APPT-1",
    });
  });
});
