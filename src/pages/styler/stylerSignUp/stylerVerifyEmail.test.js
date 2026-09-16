/**
 * The code step has one sentence to get right: which address the code went to.
 *
 * It is the only place in the flow that names the address, and it can be reached
 * without having gone through step 1 (a refresh, a bookmark, a restored tab), in
 * which case there is no address to name. It used to render "sent to ." in that
 * state, so the wording is pinned here in both directions.
 *
 * It is also where the flow learns that the email is verified, which is the fact
 * the guard reads before it will hand over the business step, so that hand-off is
 * pinned here as well: the address accepted by the backend is the one remembered,
 * the marker is set exactly once, and it is set on success only.
 *
 * The other half of the file is the request itself. Codes are looked up by the
 * address they were issued to, and this step used to send only the digits, which
 * the endpoint refused for every code however correct. So the address travelling
 * with the code is pinned here, along with the two ways out of a code that never
 * arrived: asking for another one, and clearing the boxes to start again.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StylerVerifyEmail from "./stylerVerifyEmail";
import { SIGNUP_EMAIL_KEY } from "./signupFlow";
import { APIService } from "../../../hooks/remote/apiService";

const formData = {};
const markEmailVerified = vi.fn();
vi.mock("../../../context/StylerSignupContext", () => ({
  useStylerSignup: () => ({ formData, updateData: vi.fn(), markEmailVerified }),
}));

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: { stylerVerifyOtp: vi.fn(), stylerGenerateOtp: vi.fn() },
}));

vi.mock("../../../utils/constant", () => ({
  showSuccessToastMessage: vi.fn(),
}));

const renderStep = () =>
  render(
    <MemoryRouter>
      <StylerVerifyEmail />
    </MemoryRouter>
  );

/** Types a six-digit code into the six boxes, the way a visitor would. */
const enterCode = (code) => {
  const boxes = document.querySelectorAll('input[maxlength="1"]');
  code.split("").forEach((digit, i) => fireEvent.change(boxes[i], { target: { value: digit } }));
};

describe("styler signup email verification", () => {
  beforeEach(() => {
    markEmailVerified.mockClear();
    APIService.stylerVerifyOtp.mockReset();
    APIService.stylerGenerateOtp.mockReset();
    APIService.stylerGenerateOtp.mockResolvedValue({ data: { statusCode: "200" } });
  });

  afterEach(() => {
    sessionStorage.clear();
    delete formData.emailAddress;
  });

  it("names the address the code was sent to", () => {
    formData.emailAddress = "ada@example.com";

    renderStep();

    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText(/was sent to/i)).toBeInTheDocument();
    // Six boxes, one digit each: the code is six digits.
    expect(document.querySelectorAll('input[maxlength="1"]')).toHaveLength(6);
  });

  it("still reads as a sentence when the address is unknown", () => {
    // No context and no stored email: landed here directly rather than through
    // step 1. The old copy left the address clause dangling and printed "sent to .".
    sessionStorage.clear();

    const { container } = renderStep();

    expect(container.textContent).not.toMatch(/sent to\s*\./);
    expect(
      screen.getByText(/Enter the 6-digit verification code we sent to your email address to continue\./)
    ).toBeInTheDocument();
  });

  it("marks the email verified once the accepted code is in", async () => {
    formData.emailAddress = "ada@example.com";
    APIService.stylerVerifyOtp.mockResolvedValue({
      data: { statusCode: "200", emailAddress: "ada@example.com" },
    });

    renderStep();
    enterCode("123456");
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    // Without this the business step stays locked, so it is the wiring that
    // matters here rather than the toast.
    await waitFor(() => expect(markEmailVerified).toHaveBeenCalledTimes(1));
    // The address goes with the code. Sending the digits alone made the endpoint
    // refuse every code, which is what this pins against coming back.
    expect(APIService.stylerVerifyOtp).toHaveBeenCalledWith({
      emailAddress: "ada@example.com",
      otpCode: "123456",
    });
    expect(sessionStorage.getItem(SIGNUP_EMAIL_KEY)).toBe("ada@example.com");
  });

  it("refuses to verify without an address, rather than sending a doomed request", async () => {
    // A reload on this step with nothing stored: there is no address to look the
    // code up by, so asking the server would only produce a rejection it cannot
    // explain.
    sessionStorage.clear();

    renderStep();
    enterCode("123456");
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/don't have your email address/i);
    expect(APIService.stylerVerifyOtp).not.toHaveBeenCalled();
    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it("empties the boxes when a code is rejected so it can be retyped", async () => {
    formData.emailAddress = "ada@example.com";
    APIService.stylerVerifyOtp.mockResolvedValue({
      data: { statusCode: "400", message: "Invalid OTP code. Please try again." },
    });

    renderStep();
    enterCode("000000");
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => expect(APIService.stylerVerifyOtp).toHaveBeenCalled());
    expect(document.querySelectorAll('input[maxlength="1"]')[0].value).toBe("");
  });

  it("lets a professional clear the boxes instead of pressing backspace six times", () => {
    formData.emailAddress = "ada@example.com";

    renderStep();
    enterCode("123456");
    expect(document.querySelectorAll('input[maxlength="1"]')[0].value).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Clear code" }));

    expect(
      [...document.querySelectorAll('input[maxlength="1"]')].every((box) => box.value === "")
    ).toBe(true);
  });

  it("offers another code once the countdown has run out, and empties the old digits", async () => {
    formData.emailAddress = "ada@example.com";
    // The countdown starts at a minute, which no test should wait for.
    vi.useFakeTimers();

    try {
      renderStep();
      expect(screen.getByText(/Resend code in 1:00/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /resend code/i })).not.toBeInTheDocument();

      enterCode("123456");
      act(() => vi.advanceTimersByTime(60_000));

      const resend = screen.getByRole("button", { name: "Resend code" });
      fireEvent.click(resend);

      // The old digits no longer match the fresh code, so they go.
      await waitFor(() => expect(APIService.stylerGenerateOtp).toHaveBeenCalledWith({
        emailAddress: "ada@example.com",
      }));
      expect(
        [...document.querySelectorAll('input[maxlength="1"]')].every((box) => box.value === "")
      ).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tells a professional with no address to go back a step rather than failing silently", async () => {
    sessionStorage.clear();
    vi.useFakeTimers();

    try {
      renderStep();
      act(() => vi.advanceTimersByTime(60_000));
      fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(/don't have your email address/i);
      expect(APIService.stylerGenerateOtp).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaves the step locked when the code is rejected", async () => {
    formData.emailAddress = "ada@example.com";
    APIService.stylerVerifyOtp.mockResolvedValue({
      data: { statusCode: "400", message: "Invalid OTP code. Please try again." },
    });

    renderStep();
    enterCode("000000");
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => expect(APIService.stylerVerifyOtp).toHaveBeenCalled());
    expect(markEmailVerified).not.toHaveBeenCalled();
    expect(screen.getByText(/Invalid OTP code/)).toBeInTheDocument();
  });
});
