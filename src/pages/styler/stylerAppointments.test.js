import { render, screen, waitFor } from "@testing-library/react";
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
    expect(APIService.acceptAppointment).toHaveBeenCalledWith("APPT-1");
  });
});
