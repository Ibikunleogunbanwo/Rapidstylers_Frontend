import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SecureAccount from "./secureAccount";

// The page dispatches the account-creation action and shows the success modal
// only when it returns statusCode 200. Mock the redux plumbing so the form
// submission resolves successfully in the test.
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn().mockResolvedValue({ payload: { statusCode: "200" } }),
}));
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

describe("SecureAccount success modal viewport containment", () => {
  beforeEach(() => {
    // The page writes its description into this meta tag on mount; jsdom has
    // none by default, so add one like index.html does.
    const meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
    sessionStorage.setItem("userProfileData", JSON.stringify(PROFILE));
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
