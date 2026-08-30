import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import StylerAppointments from "./stylerAppointments";
import { APIService } from "../../hooks/remote/apiService";

jest.mock("../../hooks/remote/apiService", () => ({
  APIService: {
    stylerAppointments: jest.fn(),
    acceptAppointment: jest.fn(),
    declineAppointment: jest.fn(),
    completeAppointment: jest.fn(),
    stylerCancelAppointment: jest.fn(),
  },
}));

beforeEach(() => {
  sessionStorage.setItem("rapidstylers_auth_token", "styler-jwt");
});

afterEach(() => {
  sessionStorage.clear();
});

test("stylist can open a pending booking and accept it", async () => {
  const appointment = {
    appointmentId: "APPT-1",
    appointmentDate: "2030-08-24",
    arrivalTime: "09:30",
    statusCode: "1",
    price: "120.00",
    userData: { firstname: "Ada", lastname: "Client" },
    subServiceData: { name: "Knotless braids" },
  };
  APIService.stylerAppointments.mockResolvedValue({ data: { data: [appointment] } });
  APIService.acceptAppointment.mockResolvedValue({ data: { statusCode: "200" } });
  APIService.stylerAppointments
    .mockResolvedValueOnce({ data: { data: [appointment] } })
    .mockResolvedValueOnce({ data: { data: [] } });

  render(<StylerAppointments />);

  expect(await screen.findByText(/Knotless braids/i)).toBeInTheDocument();
  await act(async () => {
    await userEvent.click(screen.getByRole("img", { name: /more appointment actions/i }));
  });
  expect(await screen.findByText(/Appointment details/i)).toBeInTheDocument();

  await act(async () => {
    await userEvent.click(screen.getByText(/Confirm appointment/i));
  });

  await waitFor(() => {
    expect(APIService.acceptAppointment).toHaveBeenCalledWith("APPT-1", "");
  });
});

const makeAppointment = (id, statusCode = "1") => ({
  appointmentId: `APPT-${id}`,
  appointmentDate: "2030-08-24",
  arrivalTime: "09:30",
  statusCode,
  userData: { firstname: "Ada", lastname: `C${id}` },
  subServiceData: { name: `Service ${id}` },
});

test("paginates the pending appointment list at 10 per page", async () => {
  APIService.stylerAppointments.mockResolvedValue({
    data: { data: Array.from({ length: 12 }, (_, i) => makeAppointment(i + 1)) },
  });
  render(<StylerAppointments />);

  // Page 1 shows 10 of 12 with the range label.
  expect(await screen.findByText("Showing 1–10 of 12")).toBeInTheDocument();
  expect(screen.getByText("Service 1")).toBeInTheDocument();
  expect(screen.queryByText("Service 11")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(await screen.findByText("Showing 11–12 of 12")).toBeInTheDocument();
  expect(screen.getByText("Service 12")).toBeInTheDocument();
  expect(screen.queryByText("Service 1")).not.toBeInTheDocument();
});

test("paginates the past appointment list at 10 per page", async () => {
  APIService.stylerAppointments.mockResolvedValue({
    data: { data: Array.from({ length: 12 }, (_, i) => makeAppointment(i + 1, "0")) },
  });
  render(<StylerAppointments />);

  // No pending items, so the pending tab is empty — switch to Past.
  await screen.findByText(/No pending appointments/);
  fireEvent.click(screen.getByText("Past appointments"));

  expect(await screen.findByText("Showing 1–10 of 12")).toBeInTheDocument();
  expect(screen.getByText("Service 1")).toBeInTheDocument();
  expect(screen.queryByText("Service 11")).not.toBeInTheDocument();
});

test("hides the pager when a list fits on one page", async () => {
  APIService.stylerAppointments.mockResolvedValue({
    data: { data: Array.from({ length: 5 }, (_, i) => makeAppointment(i + 1)) },
  });
  render(<StylerAppointments />);

  await screen.findByText("Service 1");
  expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
});
