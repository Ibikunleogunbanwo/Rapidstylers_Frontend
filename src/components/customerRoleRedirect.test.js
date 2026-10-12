import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { toast } from "react-toastify";
import CustomerRoleRedirect from "./customerRoleRedirect";
import { setAuthToken, setUserRole } from "../utils/constant";

vi.mock("react-toastify", () => ({ toast: { info: vi.fn() } }));

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/styler-dashboard" element={<CustomerRoleRedirect area="professionals"><div data-testid="styler-area" /></CustomerRoleRedirect>} />
      <Route element={<CustomerRoleRedirect area="admin" />}>
        <Route path="/admin" element={<div data-testid="admin-area" />} />
      </Route>
      <Route path="/dashboard" element={<div data-testid="customer-dashboard" />} />
      <Route path="/login" element={<div data-testid="login" />} />
    </Routes>
  </MemoryRouter>
);

afterEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });

describe("a signed-in customer on a stylist or admin page (QA C-04)", () => {
  test("lands on /dashboard with a note, never a blank /login", () => {
    setAuthToken("t"); setUserRole("CUSTOMER");
    renderAt("/styler-dashboard");
    expect(screen.getByTestId("customer-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("login")).not.toBeInTheDocument();
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/for professionals/), expect.anything());
  });

  test("admin pages send a customer to /dashboard too", () => {
    setAuthToken("t"); setUserRole("CUSTOMER");
    renderAt("/admin");
    expect(screen.getByTestId("customer-dashboard")).toBeInTheDocument();
  });

  test.each([["STYLER", "/styler-dashboard", "styler-area"], ["ADMIN", "/admin", "admin-area"], ["", "/styler-dashboard", "styler-area"]])(
    "role %j passes through to the area's own guard", (role, path, testId) => {
      if (role) { setAuthToken("t"); setUserRole(role); }
      renderAt(path);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(toast.info).not.toHaveBeenCalled();
    });
});
