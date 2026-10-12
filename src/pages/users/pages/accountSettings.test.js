import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountSettings from "./accountsettings";
import ChangePassword from "./changePassword";

vi.mock("../../../components/newsletter", () => ({ NewsletterPreference: () => null }));
vi.mock("../../../components/goBack", () => ({ default: () => null }));
vi.mock("../../../components/spinner", () => ({ default: () => null }));
let state;
vi.mock("react-redux", () => ({ useSelector: (selector) => selector(state), useDispatch: () => vi.fn() }));
const withAccount = (registrationMethod) => {
  state = { user: { loading: false, userSessionData: { emailAddress: "a@b.ca", registrationMethod }, userDetailsData: null } };
};

describe("Google-created accounts and passwords (QA C-05)", () => {
  test("a Google account sees 'You sign in with Google' instead of Change password", () => {
    withAccount("GOOGLE");
    render(<MemoryRouter><AccountSettings setPageTitle={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(/You sign in with Google/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Change password/ })).not.toBeInTheDocument();
  });

  test("an email account keeps the Change password link", () => {
    withAccount("EMAIL");
    render(<MemoryRouter><AccountSettings setPageTitle={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /Change password/ })).toHaveAttribute("href", "/changePassword");
    expect(screen.queryByText(/You sign in with Google/)).not.toBeInTheDocument();
  });

  test("opening /changePassword directly as a Google account shows the note, not the form", () => {
    withAccount("google");
    render(<MemoryRouter><ChangePassword setPageTitle={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("status")).toHaveTextContent(/You sign in with Google/);
    expect(screen.queryByLabelText(/Old Password/i)).not.toBeInTheDocument();
  });
});
