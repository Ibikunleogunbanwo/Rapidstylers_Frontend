import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserLayout from "./index";

// Stub the chrome (top bar, sidebar, cards) and every page module so the test
// can assert which page the shell resolves per URL.
jest.mock("./topBar", () => () => <div data-testid="topbar" />);
jest.mock("./sideBar", () => () => <div data-testid="sidebar" />);
jest.mock("../../../components/rapidStylerHumour", () => () => null);
jest.mock("../../../components/advert", () => () => null);
jest.mock("../../generalPages/notFound", () => () => <div data-testid="page-notfound" />);
jest.mock("../auth/logout", () => () => <div data-testid="page-logout" />);
jest.mock("../pages/dashboard", () => () => <div data-testid="page-dashboard" />);
jest.mock("../pages/bookAnAppointment", () => () => <div data-testid="page-bookAppointment" />);
jest.mock("../pages/accountsettings", () => () => <div data-testid="page-accountSettings" />);
jest.mock("../pages/updatePersonal", () => () => <div data-testid="page-updatePersonal" />);
jest.mock("../pages/savedStylists", () => () => <div data-testid="page-savedStylist" />);
jest.mock("../pages/changePassword", () => () => <div data-testid="page-changePassword" />);
jest.mock("../pages/notificationSettings", () => () => <div data-testid="page-notificationSettings" />);
jest.mock("../pages/notifications", () => () => <div data-testid="page-notifications" />);
jest.mock("../pages/support", () => () => <div data-testid="page-support" />);
jest.mock("../pages/loyalty", () => () => <div data-testid="page-loyalty" />);
jest.mock("../pages/feedback", () => () => <div data-testid="page-feedback" />);
jest.mock("../pages/searchStylers", () => () => <div data-testid="page-searchAStyler" />);

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));
import { useSelector } from "react-redux";

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <UserLayout />
    </MemoryRouter>
  );

describe("UserLayout customer-area routing", () => {
  beforeEach(() => {
    // The mock replaces the whole selector, so it must return the *selected*
    // value (state.user.userSessionData), not a state-shaped wrapper.
    useSelector.mockReturnValue({ userId: 1 });
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

  test("shows LogOut when there is no session", () => {
    useSelector.mockReturnValue(null);
    renderAt("/dashboard");
    expect(screen.getByTestId("page-logout")).toBeInTheDocument();
  });
});
