import { setAuthToken, setUserRole } from "../../../utils/constant";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import UserLayout from "./index";

// Stub the chrome (top bar, sidebar, cards) and every page module so the test
// can assert which page the shell resolves per URL.
vi.mock("./topBar", () => ({ default: () => <div data-testid="topbar" /> }));
vi.mock("./sideBar", () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock("../../../components/rapidStylerHumour", () => ({ default: () => <div data-testid="quote" /> }));
vi.mock("../../../components/advert", () => ({ default: () => <div data-testid="advert" /> }));
vi.mock("../../generalPages/notFound", () => ({ default: () => <div data-testid="page-notfound" /> }));
vi.mock("../auth/logout", () => ({ default: () => <div data-testid="page-logout" /> }));
vi.mock("../pages/dashboard", () => ({ default: () => <div data-testid="page-dashboard" /> }));
vi.mock("../pages/bookAnAppointment", () => ({ default: () => <div data-testid="page-bookAppointment" /> }));
vi.mock("../pages/accountsettings", () => ({ default: () => <div data-testid="page-accountSettings" /> }));
vi.mock("../pages/updatePersonal", () => ({ default: () => <div data-testid="page-updatePersonal" /> }));
vi.mock("../pages/savedStylists", () => ({ default: () => <div data-testid="page-savedStylist" /> }));
vi.mock("../pages/changePassword", () => ({ default: () => <div data-testid="page-changePassword" /> }));
vi.mock("../pages/notificationSettings", () => ({ default: () => <div data-testid="page-notificationSettings" /> }));
vi.mock("../pages/notifications", () => ({ default: () => <div data-testid="page-notifications" /> }));
vi.mock("../pages/support", () => ({ default: () => <div data-testid="page-support" /> }));
vi.mock("../pages/loyalty", () => ({ default: () => <div data-testid="page-loyalty" /> }));
vi.mock("../pages/feedback", () => ({ default: () => <div data-testid="page-feedback" /> }));
vi.mock("../pages/searchStylers", () => ({ default: () => <div data-testid="page-searchAStyler" /> }));

vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
}));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<UserLayout />} />
        <Route path="/styler-dashboard" element={<div data-testid="page-styler" />} />
        <Route path="/admin/categories" element={<div data-testid="page-admin" />} />
        <Route path="/login" element={<div data-testid="page-login" />} />
      </Routes>
    </MemoryRouter>
  );

describe("UserLayout customer-area routing", () => {
  beforeEach(() => {
    // The mock replaces the whole selector, so it must return the *selected*
    // value (state.user.userSessionData), not a state-shaped wrapper.
    useSelector.mockReturnValue({ userId: 1 });
    setAuthToken("customer-test"); setUserRole("CUSTOMER");
  });

  test("renders the Feedback page at /feedback (not a 404)", () => {
    renderAt("/feedback");
    expect(screen.getByTestId("page-feedback")).toBeInTheDocument();
    expect(screen.queryByTestId("page-notfound")).not.toBeInTheDocument();
  });

  test("renders the Dashboard at /dashboard", () => {
    renderAt("/dashboard");
    expect(screen.getByTestId("page-dashboard")).toBeInTheDocument();
  });

  test("renders every sidebar destination behind the shell", () => {
    renderAt("/bookAppointment");
    expect(screen.getByTestId("page-bookAppointment")).toBeInTheDocument();
  });

  test.each([
    ["/dashboard", "page-dashboard"],
    ["/bookAppointment", "page-bookAppointment"],
    ["/accountSettings", "page-accountSettings"],
    ["/updatePersonalInformation", "page-updatePersonal"],
    ["/savedStylist", "page-savedStylist"],
    ["/changePassword", "page-changePassword"],
    ["/notificationSettings", "page-notificationSettings"],
    ["/notifications", "page-notifications"],
    ["/support", "page-support"],
    ["/loyalty", "page-loyalty"],
    ["/feedback", "page-feedback"],
    ["/searchAStyler", "page-searchAStyler"],
    ["/signOut", "page-logout"],
  ])("renders %s behind the customer shell (no 404)", (path, testId) => {
    renderAt(path);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByTestId("page-notfound")).not.toBeInTheDocument();
  });

  test("renders NotFound only for unknown paths inside the shell", () => {
    renderAt("/someUnknownRoute");
    expect(screen.getByTestId("page-notfound")).toBeInTheDocument();
  });

  test("directs a signed-out visitor to /login (not the public home page)", () => {
    useSelector.mockReturnValue(null);
    renderAt("/dashboard");
    // Remembered route is set so a later sign-in returns to the requested page.
    expect(sessionStorage.getItem("rapidstylers_intended_route")).toBe("/dashboard");
    expect(screen.getByTestId("page-login")).toBeInTheDocument();
    expect(screen.queryByTestId("page-logout")).not.toBeInTheDocument();
  });
});

afterEach(() => sessionStorage.clear());
test("stale cached customer data cannot open the dashboard without a token", () => {
 useSelector.mockReturnValue({ userId: 1 }); sessionStorage.clear();
 renderAt("/dashboard");
 expect(screen.getByTestId("page-login")).toBeInTheDocument();
 expect(screen.queryByTestId("page-dashboard")).not.toBeInTheDocument();
});
test("a stylist cannot enter the customer shell with cached customer data", () => {
 useSelector.mockReturnValue({ userId: 1 }); setAuthToken("styler-test"); setUserRole("STYLER");
 renderAt("/dashboard");
 expect(screen.getByTestId("page-styler")).toBeInTheDocument();
 expect(screen.queryByTestId("page-dashboard")).not.toBeInTheDocument();
});

test("booking discovery excludes promotional distractions", () => {
  useSelector.mockReturnValue({userId:1}); setAuthToken("customer-test"); setUserRole("CUSTOMER");
  renderAt("/bookAppointment");
  expect(screen.queryByTestId("quote")).not.toBeInTheDocument();
  expect(screen.queryByTestId("advert")).not.toBeInTheDocument();
});

test.each(["/feedback", "/accountSettings", "/notifications", "/support", "/savedStylist"])("%s excludes quote and booking promotions", (path) => {
  useSelector.mockReturnValue({userId:1}); setAuthToken("customer-test"); setUserRole("CUSTOMER");
  renderAt(path);
  expect(screen.queryByTestId("quote")).not.toBeInTheDocument();
  expect(screen.queryByTestId("advert")).not.toBeInTheDocument();
});

test("dashboard overview keeps discovery without the quote", () => {
  useSelector.mockReturnValue({userId:1}); setAuthToken("customer-test"); setUserRole("CUSTOMER");
  renderAt("/dashboard");
  expect(screen.getByTestId("advert")).toBeInTheDocument();
  expect(screen.queryByTestId("quote")).not.toBeInTheDocument();
});
