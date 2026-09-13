import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import App from "./App";
import { Provider } from "react-redux";
import store from "./hooks/local/store";
import { setUserSession } from "./hooks/local/userReducer";
import { APIService } from "./hooks/remote/apiService";

vi.mock("./context/LocationContext", () => ({
  LocationProvider: ({ children }) => children,
  useUserLocation: () => ({ location: null, loading: false, updateLocation: vi.fn() }),
}));

vi.mock("./hooks/remote/apiClient", () => ({
  ApiClient: {
    get: vi.fn(() => Promise.resolve({ data: { statusCode: "200", data: [] } })),
    post: vi.fn(() => Promise.resolve({ data: { statusCode: "200", data: [] } })),
  },
  ApiFormDataClient: {
    post: vi.fn(() => Promise.resolve({ data: { statusCode: "200", data: [] } })),
  },
}));

// Customer-area shell chrome + pages: stub them so the integration test focuses
// on the App.js routing chain (URL -> UserLayout -> page) without network calls.
vi.mock("./pages/users/userLayout/topBar", () => ({ default: () => <div data-testid="topbar" /> }));
vi.mock("./pages/users/userLayout/sideBar", () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock("./components/rapidStylerHumour", () => ({ default: () => null }));
vi.mock("./components/advert", () => ({ default: () => null }));
vi.mock("./pages/generalPages/notFound", () => ({ default: () => <div data-testid="page-notfound" /> }));
vi.mock("./pages/users/auth/logout", () => ({ default: () => <div data-testid="page-logout" /> }));
vi.mock("./pages/users/pages/dashboard", () => ({ default: () => <div data-testid="page-dashboard" /> }));
vi.mock("./pages/users/pages/bookAnAppointment", () => ({ default: () => <div data-testid="page-bookAppointment" /> }));
vi.mock("./pages/users/pages/accountsettings", () => ({ default: () => <div data-testid="page-accountSettings" /> }));
vi.mock("./pages/users/pages/updatePersonal", () => ({ default: () => <div data-testid="page-updatePersonal" /> }));
vi.mock("./pages/users/pages/savedStylists", () => ({ default: () => <div data-testid="page-savedStylist" /> }));
vi.mock("./pages/users/pages/changePassword", () => ({ default: () => <div data-testid="page-changePassword" /> }));
vi.mock("./pages/users/pages/notificationSettings", () => ({ default: () => <div data-testid="page-notificationSettings" /> }));
vi.mock("./pages/users/pages/notifications", () => ({ default: () => <div data-testid="page-notifications" /> }));
vi.mock("./pages/users/pages/support", () => ({ default: () => <div data-testid="page-support" /> }));
vi.mock("./pages/users/pages/loyalty", () => ({ default: () => <div data-testid="page-loyalty" /> }));
vi.mock("./pages/users/pages/feedback", () => ({ default: () => <div data-testid="page-feedback" /> }));
vi.mock("./pages/users/pages/searchStylers", () => ({ default: () => <div data-testid="page-searchAStyler" /> }));

const renderCustomerArea = async (path) => {
  window.history.pushState({}, "", path);
  store.dispatch(setUserSession({ data: { userId: 1 } }));
  await act(async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });
  await screen.findByTestId("topbar");
};

test("public stylist profile routes do not require a customer session", async () => {
  window.history.pushState({}, "", "/stylistProfile/U1/Professional");

  await act(async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });

  // This route is a real (unmocked) lazy import, so allow for the module's
  // first transform rather than the 1s default.
  expect(
    await screen.findByText(/Working hours/i, {}, { timeout: 5000 })
  ).toBeInTheDocument();
  expect(screen.queryByText(/Please sign in to continue/i)).not.toBeInTheDocument();
});

test("loads the RapidStylers home route instead of the CRA starter screen", async () => {
  window.history.pushState({}, "", "/");

  await act(async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });

  // Anchored on the route's own title and the hero search, not on marketing
  // copy: this guards against the CRA starter screen, and should not fail every
  // time a heading is reworded.
  expect(
    await screen.findByPlaceholderText(/Search for beauty professionals/i)
  ).toBeInTheDocument();
  // The page sets its own title once its lazy chunk has loaded.
  expect(document.title).toBe("Welcome - RapidStylers");
  expect(screen.queryByText(/learn react/i)).not.toBeInTheDocument();
});

describe("customer-area routes render inside the dashboard shell", () => {
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
  ])("mounts App at %s and renders %s inside the shell", async (path, testId) => {
    await renderCustomerArea(path);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByTestId("page-notfound")).not.toBeInTheDocument();
  });

  test("unknown URLs hit the top-level 404, not the customer shell", async () => {
    window.history.pushState({}, "", "/definitely-not-a-page");

    await act(async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      );
    });

    expect(await screen.findByTestId("page-notfound")).toBeInTheDocument();
    expect(screen.queryByTestId("topbar")).not.toBeInTheDocument();
  });
});

// Full happy-path through the real App routes: a signed-out customer who signs
// in lands on /dashboard (the role dashboard), never the public home page.
test("a signed-out customer signs in through App and lands on /dashboard, not home", async () => {
  // Start genuinely signed out so the login route shows the form, not a redirect.
  localStorage.clear();
  sessionStorage.clear();

  // Backend /sign_in returns a customer session; the login page routes by role.
  const signInMock = vi
    .spyOn(APIService, "signIn")
    .mockResolvedValue({
      data: {
        token: "jwt-customer",
        refreshToken: "refresh-customer",
        data: {
          role: "CUSTOMER",
          account: { userId: 7, firstName: "Ada", emailAddress: "ada@example.com" },
        },
      },
    });

  try {
    // A signed-out visitor lands on /login (from browsing, e.g. /search, and
    // choosing to sign in directly) — the form renders because there is no token.
    window.history.pushState({}, "", "/login");

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Still signed out: the sign-in form is present and no dashboard shell.
    expect(await screen.findByText("Welcome back")).toBeInTheDocument();
    expect(screen.queryByTestId("page-dashboard")).not.toBeInTheDocument();

    // Submit real credentials through the form → completeAuth → role routing.
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "secret-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Lands on the customer dashboard inside the app shell — not the public home.
    // (The "Welcome back" success toast is expected, so assert the login *form* is gone.)
    expect(await screen.findByTestId("page-dashboard")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your password")).toBeNull();
    expect(window.location.pathname).toBe("/dashboard");
  } finally {
    signInMock.mockRestore();
  }
});
