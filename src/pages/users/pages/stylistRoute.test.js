import { render, screen } from "@testing-library/react";
import StylistRoute from "./stylistRoute";
import { setAuthToken, setUserRole } from "../../../utils/constant";

vi.mock("../userLayout", () => ({ default: () => <div data-testid="customer-shell" /> }));
vi.mock("./stylist", () => ({ default: () => <div data-testid="public-list" /> }));
let session = null;
vi.mock("react-redux", () => ({ useSelector: (selector) => selector({ user: { userSessionData: session } }) }));

afterEach(() => { sessionStorage.clear(); session = null; });

test("visitors browse a service's professionals on the public page", () => {
  render(<StylistRoute />);
  expect(screen.getByTestId("public-list")).toBeInTheDocument();
});

test("a signed-in customer keeps the dashboard layout around the list (QA C-02)", () => {
  setAuthToken("t"); setUserRole("CUSTOMER"); session = { userId: "U1" };
  render(<StylistRoute />);
  expect(screen.getByTestId("customer-shell")).toBeInTheDocument();
});

test("a stylist still sees the public page", () => {
  setAuthToken("t"); setUserRole("STYLER"); session = { userId: "U1" };
  render(<StylistRoute />);
  expect(screen.getByTestId("public-list")).toBeInTheDocument();
});
