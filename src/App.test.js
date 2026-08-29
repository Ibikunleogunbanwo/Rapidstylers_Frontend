import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import App from "./App";
import { Provider } from "react-redux";
import store from "./hooks/local/store";
import { setUserSession } from "./hooks/local/userReducer";

jest.mock("./context/LocationContext", () => ({
  LocationProvider: ({ children }) => children,
  useUserLocation: () => ({ location: null, loading: false, updateLocation: jest.fn() }),
}));

jest.mock("./hooks/remote/apiClient", () => ({
  ApiClient: {
    get: jest.fn(() => Promise.resolve({ data: { statusCode: "200", data: [] } })),
    post: jest.fn(() => Promise.resolve({ data: { statusCode: "200", data: [] } })),
  },
  ApiFormDataClient: {
    post: jest.fn(() => Promise.resolve({ data: { statusCode: "200", data: [] } })),
  },
}));

// Customer-area shell chrome + pages: stub them so the integration test focuses
// on the App.js routing chain (URL -> UserLayout -> page) without network calls.
jest.mock("./pages/users/userLayout/topBar", () => () => <div data-testid="topbar" />);
jest.mock("./pages/users/userLayout/sideBar", () => () => <div data-testid="sidebar" />);
jest.mock("./components/rapidStylerHumour", () => () => null);
jest.mock("./components/advert", () => () => null);
jest.mock("./pages/generalPages/notFound", () => () => <div data-testid="page-notfound" />);
jest.mock("./pages/users/auth/logout", () => () => <div data-testid="page-logout" />);
jest.mock("./pages/users/pages/dashboard", () => () => <div data-testid="page-dashboard" />);
jest.mock("./pages/users/pages/bookAnAppointment", () => () => <div data-testid="page-bookAppointment" />);
jest.mock("./pages/users/pages/accountsettings", () => () => <div data-testid="page-accountSettings" />);
jest.mock("./pages/users/pages/updatePersonal", () => () => <div data-testid="page-updatePersonal" />);
jest.mock("./pages/users/pages/savedStylists", () => () => <div data-testid="page-savedStylist" />);
jest.mock("./pages/users/pages/changePassword", () => () => <div data-testid="page-changePassword" />);
jest.mock("./pages/users/pages/notificationSettings", () => () => <div data-testid="page-notificationSettings" />);
jest.mock("./pages/users/pages/notifications", () => () => <div data-testid="page-notifications" />);
jest.mock("./pages/users/pages/support", () => () => <div data-testid="page-support" />);
jest.mock("./pages/users/pages/loyalty", () => () => <div data-testid="page-loyalty" />);
jest.mock("./pages/users/pages/feedback", () => () => <div data-testid="page-feedback" />);
jest.mock("./pages/users/pages/searchStylers", () => () => <div data-testid="page-searchAStyler" />);

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

  expect(await screen.findByText(/Working hours/i)).toBeInTheDocument();
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

  expect(await screen.findByText(/Tired of the salon struggle/i)).toBeInTheDocument();
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
