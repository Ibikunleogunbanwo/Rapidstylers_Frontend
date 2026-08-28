import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import VerifyUserEmailAddress from "./verifyEmailAddress";

// Stub the heavy chrome — router state, redux, button, spinner.
// The dispatch/navigate fns are exported so tests can assert auto-submit.
jest.mock("react-router-dom", () => {
  const navigate = jest.fn();
  return {
    useLocation: () => ({ state: { emailAddress: "test@example.com" } }),
    useNavigate: () => navigate,
    __testNavigate: navigate,
  };
});
jest.mock("react-redux", () => {
  const dispatch = jest.fn(() => ({ payload: { statusCode: "200" } }));
  return {
    useDispatch: () => dispatch,
    useSelector: () => ({ loading: false }),
    __testDispatch: dispatch,
  };
});
jest.mock("../../../hooks/local/userReducer", () => ({
  // Identity mock — dispatch(verifyOtpCode(code)) becomes dispatch(code).
  verifyOtpCode: jest.fn((code) => code),
}));
jest.mock("../../../hooks/remote/apiService", () => ({
  APIService: { generateSignUpOtpCode: jest.fn() },
}));
jest.mock("../../../utils/constant", () => ({
  showSuccessToastMessage: jest.fn(),
  showErrorToastMessage: jest.fn(),
}));
import { __testDispatch } from "react-redux";
import { __testNavigate } from "react-router-dom";
import { verifyOtpCode } from "../../../hooks/local/userReducer";
import { APIService } from "../../../hooks/remote/apiService";
jest.mock("../../../components/button", () => ({ btnText, type }) => (
  <button type={type || "button"}>{btnText}</button>
));
jest.mock("../../../components/spinner", () => () => null);

const otpInputs = () => screen.getAllByRole("textbox").filter((el) => el.maxLength === 1);

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
  // CRA's jest config resets mock implementations between tests.
  verifyOtpCode.mockImplementation((code) => code);
  __testDispatch.mockImplementation(() => ({ payload: { statusCode: "200" } }));
  APIService.generateSignUpOtpCode.mockResolvedValue({ data: { statusCode: "200" } });
});

describe("VerifyUserEmailAddress OTP inputs", () => {
  test("renders without crashing when the meta description tag is missing", () => {
    render(<VerifyUserEmailAddress />);
    expect(screen.getByText("Verify your email address.")).toBeInTheDocument();
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

    await waitFor(() => expect(__testDispatch).toHaveBeenCalledWith("123456"));
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

    await waitFor(() => expect(__testDispatch).toHaveBeenCalledWith("654321"));
  });

  test("shows a resend countdown that enables the resend link after it expires", () => {
    jest.useFakeTimers();
    render(<VerifyUserEmailAddress />);

    expect(screen.getByText("Resend code in 1:00")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend code/i })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.queryByText(/Resend code in/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("resending requests a fresh code, clears the boxes, and restarts the countdown", async () => {
    jest.useFakeTimers();
    render(<VerifyUserEmailAddress />);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    jest.useRealTimers();

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() =>
      expect(APIService.generateSignUpOtpCode).toHaveBeenCalledWith({
        emailAddress: "test@example.com",
      })
    );
    // Fresh code -> old digits cleared and the countdown restarts.
    expect(otpInputs().every((el) => el.value === "")).toBe(true);
    expect(screen.queryByRole("button", { name: "Resend code" })).not.toBeInTheDocument();
    expect(screen.getByText(/Resend code in/)).toBeInTheDocument();
  });
});
