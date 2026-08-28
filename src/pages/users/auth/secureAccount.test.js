import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SecureAccount from "./secureAccount";
import { __testDispatch } from "react-redux";

// The page dispatches the account-creation action and shows the success modal
// only when it returns statusCode 200. Mock the redux plumbing so the form
// submission resolves successfully in the test.
jest.mock("react-redux", () => {
  const dispatch = jest.fn();
  return {
    useDispatch: () => dispatch,
    __testDispatch: dispatch,
  };
});
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("lottie-react", () => ({
  __esModule: true,
  default: () => <div data-testid="lottie" />,
}));
jest.mock("../../../hooks/local/userReducer", () => ({
  createUserAccount: jest.fn(),
  getUserDetails: jest.fn(),
  userAuthenticate: jest.fn(),
}));
jest.mock("../../../utils/constant", () => ({
  showErrorToastMessage: jest.fn(),
}));

const PROFILE = {
  firstname: "Ada",
  lastname: "Lovelace",
  country: "Canada",
  address: "1 Main St",
  state: "Alberta",
  phoneNumber: "+1 403 555 0100",
  emailAddress: "ada@example.com",
  agreeToTerms: true,
};

const fillPasswordForm = () => {
  fireEvent.change(document.querySelector('input[name="password"]'), {
    target: { value: "StrongPass1!" },
  });
  fireEvent.change(document.querySelector('input[name="confirmPassword"]'), {
    target: { value: "StrongPass1!" },
  });
  fireEvent.click(screen.getByText("Create Account"));
};

describe("SecureAccount success modal viewport containment", () => {
  beforeEach(() => {
    // The page writes its description into this meta tag on mount; jsdom has
    // none by default, so add one like index.html does.
    const meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
    sessionStorage.setItem("userProfileData", JSON.stringify(PROFILE));
    __testDispatch.mockClear();
    // Default: account creation succeeds.
    __testDispatch.mockResolvedValue({ payload: { statusCode: "200" } });
  });

  test("the success modal anchors to the viewport after account creation", async () => {
    render(<SecureAccount />);

    fireEvent.change(document.querySelector('input[name="password"]'), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(document.querySelector('input[name="confirmPassword"]'), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.click(screen.getByText("Create Account"));

    let overlay;
    await waitFor(() => {
      overlay = document.querySelector(".fixed.inset-0");
      expect(overlay).not.toBeNull();
    });

    // inset-0 pins top/right/bottom/left to zero and z-50 keeps it above app
    // content (the page has no filtered/transformed ancestors).
    expect(overlay.className).toContain("inset-0");
    expect(overlay.className).toContain("z-50");
    // Tall content scrolls inside the overlay instead of pushing off-screen.
    expect(overlay.className).toContain("overflow-y-auto");
    // The overlay is padded and vertically centered, so the card can never
    // touch the screen edges.
    expect(overlay.className).toContain("px-4");
  });

  test("the success dialog stays within the viewport width and centers itself", async () => {
    render(<SecureAccount />);

    fireEvent.change(document.querySelector('input[name="password"]'), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(document.querySelector('input[name="confirmPassword"]'), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).not.toBeNull();
    });

    const card = document.querySelector(".fixed.inset-0 .bg-white.rounded-md");
    expect(card).toBeInTheDocument();
    // w-full inside the px-4 padded overlay keeps the right edge inside the
    // viewport; my-auto centers it vertically when there is room.
    expect(card.className).toContain("w-full");
    expect(card.className).toContain("my-auto");
  });

  test("does not use the fragile h-screen/w-full overlay without offsets", async () => {
    render(<SecureAccount />);

    fireEvent.change(document.querySelector('input[name="password"]'), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(document.querySelector('input[name="confirmPassword"]'), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(document.querySelector(".fixed.inset-0")).not.toBeNull();
    });

    // Regression guard: the old pattern was `fixed bg-black/60 h-screen w-full`
    // with no offsets, which could place the dialog below the fold.
    const overlay = document.querySelector(".fixed.inset-0");
    expect(overlay.className).not.toContain("h-screen");
  });
});

describe("SecureAccount inline server errors", () => {
  beforeEach(() => {
    const meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
    sessionStorage.setItem("userProfileData", JSON.stringify(PROFILE));
    __testDispatch.mockClear();
    __testDispatch.mockResolvedValue({ payload: { statusCode: "200" } });
  });

  test("shows an inline error under the form when account creation is rejected", async () => {
    __testDispatch.mockResolvedValue({
      payload: { statusCode: "400", message: "Email address is already registered" },
    });
    render(<SecureAccount />);
    fillPasswordForm();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Email address is already registered");
    // No success modal on rejection.
    expect(screen.queryByText(/Account created successfully/)).not.toBeInTheDocument();
  });

  test("clears the inline error as soon as the user edits a field", async () => {
    __testDispatch.mockResolvedValue({
      payload: { statusCode: "400", message: "Email address is already registered" },
    });
    render(<SecureAccount />);
    fillPasswordForm();
    await screen.findByRole("alert");

    fireEvent.change(document.querySelector('input[name="password"]'), {
      target: { value: "AnotherPass1!" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows a generic inline error when account creation fails at the network level", async () => {
    __testDispatch.mockRejectedValue(new Error("Network Error"));
    render(<SecureAccount />);
    fillPasswordForm();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We couldn't create your account right now");
  });

  test("shows an inline error inside the modal when auto-sign-in is rejected", async () => {
    // Account creation succeeds, then the follow-up sign-in is rejected.
    __testDispatch
      .mockResolvedValueOnce({ payload: { statusCode: "200" } })
      .mockResolvedValueOnce({
        payload: { statusCode: "401", message: "Invalid credentials" },
      });
    render(<SecureAccount />);
    fillPasswordForm();

    await waitFor(() => {
      expect(screen.getByText(/Account created successfully/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Go to Dashboard"));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Invalid credentials");
    // The modal stays open on failure.
    expect(screen.getByText(/Account created successfully/)).toBeInTheDocument();
  });
});
