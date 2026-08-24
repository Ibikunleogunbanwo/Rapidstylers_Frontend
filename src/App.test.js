import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import App from "./App";
import { Provider } from "react-redux";
import store from "./hooks/local/store";

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
