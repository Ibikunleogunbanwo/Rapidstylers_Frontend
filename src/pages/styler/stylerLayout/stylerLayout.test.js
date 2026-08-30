import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import StylerLayout from "./stylerLayout";

// Stub the chrome the layout pulls in so the test focuses on the role gate.
jest.mock("./topNav", () => () => null);
jest.mock("../stylerComponents/businessSummary", () => () => null);
jest.mock("../../../hooks/remote/apiService", () => ({
  APIService: { stylerSignOut: jest.fn() },
}));

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={["/styler-dashboard"]}>
      <Routes>
        <Route path="/styler-dashboard" element={<StylerLayout />}>
          <Route index element={<div>STYLER_HOME</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("StylerLayout role gate", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  test("logged-out visitors are redirected to /login", () => {
    renderLayout();
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("STYLER_HOME")).not.toBeInTheDocument();
  });

  test("a customer token alone is not enough — only a STYLER role passes", () => {
    sessionStorage.setItem("rapidstylers_auth_token", "customer-jwt");
    sessionStorage.setItem("rapidstylers_user_role", "CUSTOMER");
    renderLayout();
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("STYLER_HOME")).not.toBeInTheDocument();
  });

  test("a valid styler session renders the dashboard", () => {
    sessionStorage.setItem("rapidstylers_auth_token", "styler-jwt");
    sessionStorage.setItem("rapidstylers_refresh_token", "styler-refresh");
    sessionStorage.setItem("rapidstylers_user_role", "STYLER");
    renderLayout();
    expect(screen.getByText("STYLER_HOME")).toBeInTheDocument();
    expect(screen.queryByText("LOGIN_PAGE")).not.toBeInTheDocument();
  });
});
