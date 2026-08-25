import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StylerPayouts from "./stylerPayouts";

jest.mock("../../hooks/remote/apiService", () => ({
  APIService: {
    getStylerPayouts: jest.fn(),
    createStylerConnectAccount: jest.fn(),
  },
}));

jest.mock("../../utils/constant", () => ({
  ...jest.requireActual("../../utils/constant"),
  showErrorToastMessage: jest.fn(),
}));

import { APIService } from "../../hooks/remote/apiService";
import { showErrorToastMessage } from "../../utils/constant";

const rejectedPayouts = {
  data: {
    data: {
      connected: true,
      status: "REJECTED",
      disabledReason: "rejected.terms_of_service",
      totalEarned: "0.00",
      totalCommission: "0.00",
      stripeAvailable: "0.00",
      stripePending: "0.00",
      appointments: [],
    },
  },
};

describe("StylerPayouts rejected-state banner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    APIService.getStylerPayouts.mockResolvedValue(rejectedPayouts);
  });

  test("renders the humanized rejection reason", async () => {
    render(<StylerPayouts />);

    // "rejected.terms_of_service" is humanized to "Rejected terms of service".
    expect(await screen.findByText(/Rejected terms of service/i)).toBeInTheDocument();
    expect(screen.getByText(/Payout setup needs attention/i)).toBeInTheDocument();
  });

  test("renders a Reconnect button that restarts Stripe onboarding", async () => {
    APIService.createStylerConnectAccount.mockResolvedValue({
      data: { statusCode: "200", data: { onboardingUrl: "https://connect.stripe.com/setup/s/acct_1" } },
    });
    render(<StylerPayouts />);

    const reconnect = await screen.findByRole("button", { name: /reconnect/i });
    expect(reconnect).toBeInTheDocument();

    // Stub navigation so the redirect assertion doesn't hit jsdom's "not implemented".
    const originalHref = window.location.href;
    Object.defineProperty(window, "location", { writable: true, value: { href: "" } });
    try {
      await userEvent.click(reconnect);

      await waitFor(() =>
        expect(APIService.createStylerConnectAccount).toHaveBeenCalled()
      );
      expect(APIService.createStylerConnectAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          returnUrl: expect.stringContaining("/styler-dashboard/payouts"),
        })
      );
      expect(window.location.href).toBe("https://connect.stripe.com/setup/s/acct_1");
    } finally {
      Object.defineProperty(window, "location", { writable: true, value: { href: originalHref } });
    }
  });

  test("shows the backend message when Connect fails in-band (HTTP 200, statusCode 400)", async () => {
    // The backend answers HTTP 200 with the error in the body — must surface it, not fail silent.
    APIService.createStylerConnectAccount.mockResolvedValue({
      data: { statusCode: "400", message: "Payments are not configured yet" },
    });
    render(<StylerPayouts />);

    const reconnect = await screen.findByRole("button", { name: /reconnect/i });
    await userEvent.click(reconnect);

    await waitFor(() =>
      expect(showErrorToastMessage).toHaveBeenCalledWith("Payments are not configured yet")
    );
    expect(window.location.href).not.toContain("connect.stripe.com");
  });
});
