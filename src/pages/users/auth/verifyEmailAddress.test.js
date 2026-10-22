import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import VerifyUserEmailAddress from "./verifyEmailAddress";

// Stub the heavy chrome — router state, redux, button, spinner.
// The dispatch/navigate fns are exported so tests can assert auto-submit.
vi.mock("react-router-dom", () => {
  const navigate = vi.fn();
  // Handed out as a mutable object so a test can render the page as a visitor who
  // arrived without an address (a bookmark, a restored tab).
  const location = { pathname: "/verifyEmailAddress", state: { signupToken: "st1.test-token" } };
  return {
    useLocation: () => location,
    useNavigate: () => navigate,
    Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
    __testNavigate: navigate,
    __testLocation: location,
  };
});
vi.mock("react-redux", () => {
  const dispatch = vi.fn(() => ({ payload: { statusCode: "200" } }));
  return {
    useDispatch: () => dispatch,
    useSelector: () => ({ loading: false }),
    __testDispatch: dispatch,
  };
});
vi.mock("../../../hooks/local/userReducer", () => ({
  // Identity mock — dispatch(verifyOtpCode(code)) becomes dispatch(code).
  verifyOtpCode: vi.fn((code) => code),
}));
vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: { generateSignUpOtpCode: vi.fn() },
}));
vi.mock("../../../utils/constant", () => ({
  showSuccessToastMessage: vi.fn(),
  showErrorToastMessage: vi.fn(),
}));
import { __testDispatch } from "react-redux";
import { __testNavigate, __testLocation } from "react-router-dom";
import { verifyOtpCode } from "../../../hooks/local/userReducer";
import { APIService } from "../../../hooks/remote/apiService";
// Mirrors the real Button's contract: a label from children or text, and the
// button type forwarded (the page relies on type="submit" to submit the form).
vi.mock("../../../components/button", () => ({
  default: ({ text, children, type, disabled }) => (
    <button type={type || "button"} disabled={disabled}>
      {children ?? text}
    </button>
  ),
}));
vi.mock("../../../components/spinner", () => ({ default: () => null }));

const otpInputs = () => screen.getAllByRole("textbox").filter((el) => /^digit\d$/.test(el.id));

const typeDigit = (index, digit) => {
  const inputs = otpInputs();
  fireEvent.change(inputs[index], { target: { value: digit } });
};

beforeEach(() => {
  // Deliberately NO meta description tag in the DOM — the page's mount effect
  // must not crash without it (optional chaining).
  document.head.innerHTML = "";
  __testDispatch.mockClear();
  __testNavigate.mockClear();
  __testLocation.state = { signupToken: "st1.test-token" };
  // CRA's jest config resets mock implementations between tests.
  verifyOtpCode.mockImplementation((code) => code);
  __testDispatch.mockImplementation(() => ({ payload: { statusCode: "200" } }));
  APIService.generateSignUpOtpCode.mockResolvedValue({ data: { statusCode: "200" } });
});

describe("VerifyUserEmailAddress OTP inputs", () => {
  test("renders without crashing when the meta description tag is missing", () => {
    render(<VerifyUserEmailAddress />);
    expect(screen.getByText("Verify your email address")).toBeInTheDocument();
  });

  test("renders the typed digit visibly and advances focus", () => {
    render(<VerifyUserEmailAddress />);
    const inputs = otpInputs();
    expect(inputs).toHaveLength(6);

    typeDigit(0, "5");
    // The digit must be present in the DOM (visible)…
    expect(otpInputs()[0].value).toBe("5");
    // …and focus auto-advances to the next box.
    expect(document.activeElement).toBe(otpInputs()[1]);
  });

  test("assembles the full code into the form value", () => {
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));

    const hidden = document.getElementById("userInput");
    expect(hidden.value).toBe("123456");
    // All six digits remain visible after typing the whole code.
    expect(otpInputs().map((el) => el.value).join("")).toBe("123456");
  });

  test("clear code resets every box", () => {
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));
    fireEvent.click(screen.getByText("Clear code"));

    expect(otpInputs().every((el) => el.value === "")).toBe(true);
    expect(document.getElementById("userInput").value).toBe("");
  });

  test("paste fills the full code across every box at once", () => {
    render(<VerifyUserEmailAddress />);
    fireEvent.paste(otpInputs()[0], {
      clipboardData: { getData: () => "123456" },
    });

    expect(otpInputs().map((el) => el.value).join("")).toBe("123456");
    expect(document.getElementById("userInput").value).toBe("123456");
    // Focus lands after the last pasted digit.
    expect(document.activeElement).toBe(otpInputs()[5]);
  });

  test("paste ignores non-digit characters", () => {
    render(<VerifyUserEmailAddress />);
    fireEvent.paste(otpInputs()[0], {
      clipboardData: { getData: () => "Your code: 34-5.6XY" },
    });

    expect(otpInputs().map((el) => el.value).join("")).toBe("3456");
  });

  test("paste starting mid-way fills from that box", () => {
    render(<VerifyUserEmailAddress />);
    // Paste into the third box — fills boxes 3-6 with a 4-digit code.
    fireEvent.paste(otpInputs()[2], {
      clipboardData: { getData: () => "7890" },
    });

    const values = otpInputs().map((el) => el.value).join("");
    expect(values).toBe("  7890".replace(/ /g, "")); // boxes 3-6 = 7890
    expect(document.getElementById("userInput").value).toBe("7890");
  });

  test("paste is capped at the remaining boxes", () => {
    render(<VerifyUserEmailAddress />);
    // A 9-digit paste into the first box only fills the 6 available boxes.
    fireEvent.paste(otpInputs()[0], {
      clipboardData: { getData: () => "123456789" },
    });

    expect(otpInputs().map((el) => el.value).join("")).toBe("123456");
  });

  test("backspace on a filled box clears it and moves back", () => {
    render(<VerifyUserEmailAddress />);
    typeDigit(0, "5");
    typeDigit(1, "4");

    // Backspace the second box (clear it).
    fireEvent.change(otpInputs()[1], { target: { value: "" } });
    expect(otpInputs()[0].value).toBe("5");
    expect(otpInputs()[1].value).toBe("");
    expect(document.getElementById("userInput").value).toBe("5");
  });

  test("auto-submits once all six digits are typed", async () => {
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));

    // The sign-up token travels with the code: it tells the server which address
    // the code was issued to, without the address itself being sent again.
    await waitFor(() =>
      expect(__testDispatch).toHaveBeenCalledWith({
        signupToken: "st1.test-token",
        otpCode: "123456",
      })
    );
    // Successful verification navigates to the next step.
    expect(__testNavigate).toHaveBeenCalledWith("/personalDetails", expect.anything());
  });

  test("does not submit before the code is complete", () => {
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5"].forEach((d, i) => typeDigit(i, d));

    expect(__testDispatch).not.toHaveBeenCalled();
  });

  test("auto-submits when a full code is pasted", async () => {
    render(<VerifyUserEmailAddress />);
    fireEvent.paste(otpInputs()[0], {
      clipboardData: { getData: () => "654321" },
    });

    await waitFor(() =>
      expect(__testDispatch).toHaveBeenCalledWith({
        signupToken: "st1.test-token",
        otpCode: "654321",
      })
    );
  });

  test("refuses to submit without a sign-up session rather than sending a doomed code", async () => {
    // The page reads the address from the router state, so a visit that arrived
    // some other way has none. Asking the server would only get a rejection the
    // page cannot explain.
    __testLocation.state = {};
    sessionStorage.clear();

    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));

    expect(await screen.findByRole("alert")).toHaveTextContent(/sign-up session has expired/i);
    expect(__testDispatch).not.toHaveBeenCalled();
  });

  test("shows a resend countdown that enables the resend link after it expires", () => {
    vi.useFakeTimers();
    render(<VerifyUserEmailAddress />);

    expect(screen.getByText("Resend code in 1:00")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend code/i })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.queryByText(/Resend code in/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();

    vi.useRealTimers();
  });

  test("resending requests a fresh code, clears the boxes, and restarts the countdown", async () => {
    vi.useFakeTimers();
    render(<VerifyUserEmailAddress />);
    // Type a partial code so the clear-on-resend is actually observable.
    typeDigit(0, "5");
    typeDigit(1, "4");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    vi.useRealTimers();

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(APIService.generateSignUpOtpCode).toHaveBeenCalledWith({
        signupToken: "st1.test-token",
      })
    );
    // Wait for the async resend to settle: the fresh code clears the old
    // digits and the countdown restarts.
    await waitFor(() => {
      expect(otpInputs().every((el) => el.value === "")).toBe(true);
      expect(screen.queryByRole("button", { name: "Resend code" })).not.toBeInTheDocument();
      expect(screen.getByText(/Resend code in/)).toBeInTheDocument();
    });
  });

  test("shows an inline error under the boxes when the code is rejected", async () => {
    __testDispatch.mockImplementation(() => ({
      payload: { statusCode: "400", message: "The code is incorrect or has expired" },
    }));
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The code is incorrect or has expired");
    // A rejected code must NOT navigate to the next step.
    expect(__testNavigate).not.toHaveBeenCalled();
  });

  test("clears the inline error as soon as the user edits the code", async () => {
    __testDispatch.mockImplementation(() => ({
      payload: { statusCode: "400", message: "The code is incorrect or has expired" },
    }));
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));
    await screen.findByRole("alert");

    // Edit the first box — the error must disappear immediately.
    typeDigit(0, "9");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows a generic inline error when verification fails at the network level", async () => {
    __testDispatch.mockImplementation(() => Promise.reject(new Error("Network Error")));
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We couldn't verify that code right now");
    expect(__testNavigate).not.toHaveBeenCalled();
  });

  test("clears the boxes after a rejected code so the user can retype immediately", async () => {
    __testDispatch.mockImplementation(() => ({
      payload: { statusCode: "400", message: "The code is incorrect or has expired" },
    }));
    render(<VerifyUserEmailAddress />);
    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The code is incorrect or has expired");
    // Every box is emptied for an immediate fresh attempt…
    expect(otpInputs().every((el) => el.value === "")).toBe(true);
    expect(document.getElementById("userInput").value).toBe("");
    // …and focus lands back on the first box.
    expect(document.activeElement).toBe(otpInputs()[0]);

    // Retyping a complete code re-arms the auto-submit with the new value.
    ["7", "8", "9", "0", "1", "2"].forEach((d, i) => typeDigit(i, d));
    await waitFor(() => expect(__testDispatch).toHaveBeenCalledTimes(2));
    expect(__testDispatch).toHaveBeenLastCalledWith({
      signupToken: "st1.test-token",
      otpCode: "789012",
    });
  });

  test("shakes the OTP boxes when the code is rejected", async () => {
    __testDispatch.mockImplementation(() => ({
      payload: { statusCode: "400", message: "The code is incorrect or has expired" },
    }));
    render(<VerifyUserEmailAddress />);

    // No shake before a rejection.
    expect(screen.getByTestId("otp-grid")).not.toHaveClass("animate-shake");

    ["1", "2", "3", "4", "5", "6"].forEach((d, i) => typeDigit(i, d));
    await screen.findByRole("alert");

    // The shake class is applied to the grid alongside the inline error.
    const grid = screen.getByTestId("otp-grid");
    expect(grid).toHaveClass("animate-shake");

    // The class is removed once the animation finishes.
    fireEvent.animationEnd(grid);
    expect(grid).not.toHaveClass("animate-shake");
  });
});

describe("VerifyUserEmailAddress code help", () => {
  test("offers autofill, keeps Verify disabled until six digits and points existing accounts to sign in", () => {
    render(<VerifyUserEmailAddress />);
    expect(otpInputs()[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();
    expect(screen.getByText(/No code\? Check your spam/)).toBeInTheDocument();
    expect(screen.getByText(/spam or junk folder and any promotions tab/)).toBeInTheDocument();
    expect(screen.getByText(/Resend code above/)).toBeInTheDocument();
    // Neutral about whether the address has an account, with both ways forward.
    expect(screen.getByText(/If this email already has a RapidStylers account, we've sent sign-in instructions instead of a code/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "reset your password" })).toHaveAttribute("href", "/resetPassword");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Verify your email address");
  });
});

describe("VerifyUserEmailAddress privacy", () => {
  test("never shows or stores the email address", () => {
    __testLocation.state = { signupToken: "st1.test-token" };
    sessionStorage.setItem("signupEmail", "old@example.com");
    render(<VerifyUserEmailAddress />);
    expect(screen.getByText(/sent to the email address you entered/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/@example\.com/);
  });
});
