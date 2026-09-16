/**
 * The password reset flow, which the FAQ and the sign-in screen advertised long
 * before it existed.
 *
 * What is worth pinning is the order and the honesty, because both are load
 * bearing. The order is the backend's: the reset endpoint refuses unless a
 * verified code for that address is on record, so the steps cannot be reordered
 * and the last one must not be reachable by typing it. The honesty is about the
 * first step, which cannot know whether an address has an account (the endpoint
 * answers identically either way, deliberately) and so must not claim a code was
 * sent to a place that may not exist.
 *
 * The last step is also where the shared password rule lands in front of a
 * customer for the first time, so the `%` case is pinned here: it used to pass
 * the change-password screen and be refused by the server.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "./resetPassword";
import { APIService } from "../../../hooks/remote/apiService";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "../../../utils/constant";

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: {
    generateResetPasswordToken: vi.fn(),
    verifyOtpCode: vi.fn(),
    resetUserPassword: vi.fn(),
  },
}));

// Partially mocked: the real support contact constants are what the note promises
// a professional, so the test asserts on the actual values.
vi.mock("../../../utils/constant", async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessToastMessage: vi.fn(),
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/resetPassword"]}>
      <ResetPassword />
    </MemoryRouter>
  );

const boxes = () => document.querySelectorAll('input[maxlength="1"]');

const askForCode = async (email = "ada@example.com") => {
  fireEvent.change(document.querySelector('input[name="emailAddress"]'), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: /request code/i }));
  await screen.findByText(/is on its way|has an account here/i);
};

const enterCode = (code) => {
  code.split("").forEach((digit, i) => fireEvent.change(boxes()[i], { target: { value: digit } }));
};

const reachPasswordStep = async () => {
  APIService.generateResetPasswordToken.mockResolvedValue({ data: { statusCode: "200" } });
  APIService.verifyOtpCode.mockResolvedValue({ data: { statusCode: "200" } });

  renderPage();
  await askForCode();
  enterCode("123456");
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  await screen.findByRole("button", { name: /change password/i });
};

describe("resetting a forgotten password", () => {
  beforeEach(() => {
    navigate.mockClear();
    APIService.generateResetPasswordToken.mockReset();
    APIService.verifyOtpCode.mockReset();
    APIService.resetUserPassword.mockReset();
    APIService.generateResetPasswordToken.mockResolvedValue({ data: { statusCode: "200" } });
  });

  it("starts by asking for the address, and says no code was sent until it knows", async () => {
    renderPage();

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /request code/i }));

    // A blank address is answered on the page rather than by the server.
    expect(await screen.findByRole("alert")).toHaveTextContent(/enter the email address/i);
    expect(APIService.generateResetPasswordToken).not.toHaveBeenCalled();

    await askForCode();

    expect(APIService.generateResetPasswordToken).toHaveBeenCalledWith({
      emailAddress: "ada@example.com",
    });
    // The endpoint cannot tell us whether the address has an account, so the copy
    // says "if" rather than congratulating the visitor on mail that may never come.
    expect(screen.getByText(/has an account here/i)).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  it("verifies the code against the address it was issued to", async () => {
    APIService.verifyOtpCode.mockResolvedValue({ data: { statusCode: "200" } });

    renderPage();
    await askForCode();
    enterCode("123456");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // The address is not optional: the code is looked up by it, and an address-less
    // verification is refused before any code is compared.
    await waitFor(() =>
      expect(APIService.verifyOtpCode).toHaveBeenCalledWith({
        emailAddress: "ada@example.com",
        otpCode: "123456",
      })
    );
    expect(await screen.findByText("Step 3 of 3")).toBeInTheDocument();
  });

  it("refuses a short code without asking the server", async () => {
    renderPage();
    await askForCode();
    enterCode("123");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/all 6 digits/i);
    expect(APIService.verifyOtpCode).not.toHaveBeenCalled();
  });

  it("empties the boxes when a code is rejected and says why", async () => {
    APIService.verifyOtpCode.mockResolvedValue({
      data: { statusCode: "400", message: "Invalid OTP Code" },
    });

    renderPage();
    await askForCode();
    enterCode("000000");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Invalid OTP Code/);
    expect([...boxes()].every((box) => box.value === "")).toBe(true);
    // Still on the code step: a rejected code must not buy a password screen.
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  it("can ask for another code, which empties the old digits", async () => {
    vi.useFakeTimers();
    try {
      renderPage();
      await askForCode();
      expect(screen.getByText(/Resend code in 1:00/)).toBeInTheDocument();

      enterCode("123456");
      await vi.advanceTimersByTimeAsync(60_000);

      fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

      await waitFor(() => expect(APIService.generateResetPasswordToken).toHaveBeenCalledTimes(2));
      expect([...boxes()].every((box) => box.value === "")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuses a weak new password, including the symbols the server rejects", async () => {
    await reachPasswordStep();

    const password = () => document.querySelector('input[name="password"]');
    const confirm = () => document.querySelector('input[name="confirmPassword"]');

    // `%` used to satisfy the change-password screen and be refused by the server.
    fireEvent.change(password(), { target: { value: "Abcdefg1%" } });
    fireEvent.change(confirm(), { target: { value: "Abcdefg1%" } });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/special character/i);
    expect(APIService.resetUserPassword).not.toHaveBeenCalled();

    // And a password the server would take, with the confirmation mistyped, stops
    // before the request rather than after it.
    fireEvent.change(password(), { target: { value: "Abcdefg1!" } });
    fireEvent.change(confirm(), { target: { value: "Abcdefg1?" } });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not match/i);
    expect(APIService.resetUserPassword).not.toHaveBeenCalled();
  });

  it("changes the password, then offers the way back to sign in", async () => {
    APIService.resetUserPassword.mockResolvedValue({ data: { statusCode: "200" } });
    await reachPasswordStep();

    fireEvent.change(document.querySelector('input[name="password"]'), {
      target: { value: "Abcdefg1!" },
    });
    fireEvent.change(document.querySelector('input[name="confirmPassword"]'), {
      target: { value: "Abcdefg1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() =>
      expect(APIService.resetUserPassword).toHaveBeenCalledWith({
        emailAddress: "ada@example.com",
        password: "Abcdefg1!",
        confirmPassword: "Abcdefg1!",
      })
    );
    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    // The password is not left sitting in the form after it has been used.
    expect(document.querySelector('input[name="password"]')).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /go to sign in/i }));
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("says plainly that professionals are not covered yet, and how to get help", () => {
    renderPage();

    expect(screen.getByText(/for professionals/i)).toBeInTheDocument();
    // The real contact details, not placeholders: a professional sent here needs a
    // way to actually reach someone.
    expect(screen.getByRole("link", { name: SUPPORT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}`
    );
    expect(screen.getByRole("link", { name: SUPPORT_PHONE })).toHaveAttribute(
      "href",
      `tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`
    );
  });
});
