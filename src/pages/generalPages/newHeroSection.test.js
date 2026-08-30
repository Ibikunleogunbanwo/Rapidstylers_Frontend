import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import Hero from "./newHeroSection";

// Stub the chrome the hero pulls in so the test focuses on the nav itself.
jest.mock("../../context/LocationContext", () => ({
  useUserLocation: () => ({ location: null }),
}));
// react-scripts resets mock implementations between tests, so the factory only
// declares the shape and the value is wired in beforeEach (see apiService.test.js).
jest.mock("../../hooks/remote/apiService", () => ({
  APIService: { getStylerType: jest.fn() },
}));
import { APIService } from "../../hooks/remote/apiService";
jest.mock("../../components/searchForStyler", () => () => null);
jest.mock("../../components/locationPicker", () => () => null);
jest.mock("../../components/modals", () => () => null);
jest.mock("../../components/inputWithLabel", () => () => null);
jest.mock("../../components/button", () => () => null);
jest.mock("../../components/spinner", () => () => null);

// Mock redux so the test can drive the session state directly.
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));
import { useSelector, useDispatch } from "react-redux";

let session;
let dispatchMock;

const renderHero = (initialPath = "/") => {
  let currentPath = initialPath;
  function LocationSpy() {
    currentPath = useLocation().pathname;
    return null;
  }
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Hero height="90vh" />
      <LocationSpy />
    </MemoryRouter>
  );
  return () => currentPath;
};

const openAccountMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

describe("Hero header auth-conditional nav", () => {
  beforeEach(() => {
    session = null;
    dispatchMock = jest.fn();
    useSelector.mockImplementation((selector) =>
      selector({ user: { userSessionData: session, loading: false } })
    );
    useDispatch.mockReturnValue(dispatchMock);
    APIService.getStylerType.mockResolvedValue({ data: { data: [] } });
  });

  test("logged out shows Login, Sign up and Register as a beauty professional", () => {
    renderHero();

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register as a beauty professional" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /My Account/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  test("logged in customer opens the account dropdown with quick links instead of the auth prompts", () => {
    session = { userId: 1, emailAddress: "ada@example.com", role: "CUSTOMER", firstname: "Ada" };
    renderHero();

    openAccountMenu();
    expect(screen.getByRole("menuitem", { name: "My Account" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Appointments" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Saved stylists" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign up" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Register as a beauty professional" })
    ).not.toBeInTheDocument();
  });

  test("shows the avatar initial on the account trigger", () => {
    session = { userId: 1, emailAddress: "ada@example.com", role: "CUSTOMER", firstname: "Ada" };
    renderHero();

    const trigger = screen.getByRole("button", { name: "Account menu" });
    expect(within(trigger).getByText("A")).toBeInTheDocument();
  });

  test("My Account routes a customer to /dashboard", () => {
    session = { userId: 1, emailAddress: "ada@example.com", role: "CUSTOMER" };
    const getPath = renderHero();

    openAccountMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "My Account" }));
    expect(getPath()).toBe("/dashboard");
  });

  test("Appointments routes a customer to the dashboard and Saved stylists to /savedStylist", () => {
    session = { userId: 1, emailAddress: "ada@example.com", role: "CUSTOMER" };
    const getPath = renderHero();

    openAccountMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Appointments" }));
    expect(getPath()).toBe("/dashboard");
  });

  test("Saved stylists routes a customer to /savedStylist", () => {
    session = { userId: 1, emailAddress: "ada@example.com", role: "CUSTOMER" };
    const getPath = renderHero();

    openAccountMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Saved stylists" }));
    expect(getPath()).toBe("/savedStylist");
  });

  test("My Account routes a styler to /styler-dashboard", () => {
    session = { userId: 9, emailAddress: "styler@example.com", role: "STYLER", businessName: "Braids By Ada" };
    const getPath = renderHero();

    openAccountMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "My Account" }));
    expect(getPath()).toBe("/styler-dashboard");
  });

  test("Appointments routes a styler to /styler-dashboard/appointments", () => {
    session = { userId: 9, emailAddress: "styler@example.com", role: "STYLER" };
    const getPath = renderHero();

    openAccountMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Appointments" }));
    expect(getPath()).toBe("/styler-dashboard/appointments");
  });

  test("a styler gets no Saved stylists item in the dropdown", () => {
    session = { userId: 9, emailAddress: "styler@example.com", role: "STYLER" };
    renderHero();
    openAccountMenu();
    expect(screen.queryByRole("menuitem", { name: "Saved stylists" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Appointments" })).toBeInTheDocument();
  });

  test("an admin only gets My Account and Log out in the dropdown", () => {
    session = { userId: 10, emailAddress: "admin@example.com", role: "ADMIN" };
    renderHero();
    openAccountMenu();
    expect(screen.getByRole("menuitem", { name: "My Account" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Appointments" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Saved stylists" })).not.toBeInTheDocument();
  });

  test("My Account routes an admin to /admin/categories", () => {
    session = { userId: 10, emailAddress: "admin@example.com", role: "ADMIN" };
    const getPath = renderHero();

    openAccountMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "My Account" }));
    expect(getPath()).toBe("/admin/categories");
  });

  test("a token-only session (styler/admin, no userSessionData) still shows the account menu", () => {
    // Stylers/admins persist no userSessionData — only a JWT + role flag in
    // sessionStorage, so the header must treat a token as logged in.
    sessionStorage.setItem("rapidstylers_auth_token", "styler-jwt");
    sessionStorage.setItem("rapidstylers_refresh_token", "styler-refresh");
    sessionStorage.setItem("rapidstylers_user_role", "STYLER");
    try {
      renderHero();
      openAccountMenu();
      expect(screen.getByRole("menuitem", { name: "My Account" })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Appointments" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Register as a beauty professional" })
      ).not.toBeInTheDocument();
    } finally {
      sessionStorage.clear();
    }
  });

  test("Log out dispatches the session teardown and navigates home", async () => {
    session = { userId: 1, emailAddress: "ada@example.com", role: "CUSTOMER" };
    const getPath = renderHero("/dashboard");

    openAccountMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Log out" }));
    expect(dispatchMock).toHaveBeenCalled();
    // handleLogout awaits dispatch, so the navigate happens in a microtask.
    await waitFor(() => expect(getPath()).toBe("/"));
  });
});
