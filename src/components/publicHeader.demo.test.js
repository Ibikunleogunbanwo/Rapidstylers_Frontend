import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "../hooks/local/userReducer";
import PublicHeader from "./publicHeader";
import { goToLiveSite } from "../utils/demo";

vi.mock("../utils/demo", async (original) => ({ ...(await original()), goToLiveSite: vi.fn() }));
vi.mock("./locationPicker", () => ({ default: () => null }));
vi.mock("../context/LocationContext", () => ({ useUserLocation: () => ({}) }));

const renderHeader = (props, path = "/") => render(
  <Provider store={configureStore({ reducer: { user: userReducer } })}>
    <MemoryRouter initialEntries={[path]}><PublicHeader {...props} /></MemoryRouter>
  </Provider>
);

beforeEach(() => vi.clearAllMocks());

describe("header sign-up on the demo", () => {
  it("sends demo visitors to the live sign-up instead of the read-only demo API", () => {
    renderHeader({ demo: true });
    fireEvent.click(screen.getAllByRole("button", { name: "Sign up" })[0]);
    expect(goToLiveSite).toHaveBeenCalledWith("/?signup=1");
    expect(screen.queryByText("I want to join as a")).not.toBeInTheDocument();
  });
  it("forwards a demo ?signup=1 link to the live site", () => {
    renderHeader({ demo: true }, "/?signup=1");
    expect(goToLiveSite).toHaveBeenCalledWith("/?signup=1");
  });
  it("opens the sign-up dialog on the live site", () => {
    renderHeader({ demo: false });
    fireEvent.click(screen.getAllByRole("button", { name: "Sign up" })[0]);
    expect(goToLiveSite).not.toHaveBeenCalled();
    expect(screen.getByText("I want to join as a")).toBeInTheDocument();
  });
});
