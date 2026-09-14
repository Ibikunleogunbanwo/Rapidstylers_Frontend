import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchStyler from "./searchStylers";

vi.mock("../../../components/goBack", () => ({ default: () => <nav aria-label="Back" /> }));
vi.mock("../../../components/spinner", () => ({ default: () => null }));
vi.mock("../../../components/locationPicker", () => ({
  default: ({ onClose }) => (
    <button type="button" aria-label="Close location picker" onClick={onClose}>picker</button>
  ),
}));
vi.mock("../../../components/serviceCard", () => ({
  default: ({ name }) => <div data-testid="stylist-card">{name}</div>,
}));
vi.mock("../../../hooks/useSavedStylists", () => ({
  useSavedStylists: () => ({ savedIds: new Set(), loading: false, toggleSaved: vi.fn() }),
}));
vi.mock("../../../hooks/local/userReducer", () => ({
  searchStyler: (word) => ({ type: "SEARCH", payload: word }),
}));
vi.mock("../../../context/LocationContext", () => ({
  useUserLocation: () => ({ location: { city: "Calgary", province: "Alberta" } }),
}));

let dispatchPayload;
vi.mock("react-redux", () => ({
  // useDispatch must return the dispatch function; the component awaits it and
  // destructures { payload }. dispatchPayload is assigned in beforeEach.
  useDispatch: () => async () => ({ payload: dispatchPayload }),
  useSelector: vi.fn(() => ({ loading: false })),
}));

const renderPanel = () =>
  render(
    <MemoryRouter>
      <SearchStyler setPageTitle={vi.fn()} stylerSearchName="" />
    </MemoryRouter>
  );

describe("SearchStyler panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders in the design language: hairline shell, no shadow, no gradient header", () => {
    dispatchPayload = { data: [] };
    const { container } = renderPanel();

    const shell = container.firstElementChild;
    expect(shell.className).toContain("border-black/10");
    expect(shell.className).not.toMatch(/shadow/);
    expect(container.innerHTML).not.toContain("gradient");
    expect(screen.getByRole("heading", { name: "Search for a professional" })).toBeInTheDocument();
    expect(screen.getByText("Find and book")).toBeInTheDocument();
  });

  test("search dispatches by name and renders the returned cards", async () => {
    dispatchPayload = { data: [{ stylerId: "S1", businessName: "Braids by Ada", province: "Alberta" }] };
    renderPanel();

    fireEvent.input(screen.getByLabelText(/Search by name/), { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByTestId("stylist-card")).toBeInTheDocument();
    expect(screen.getByText(/found near/)).toBeInTheDocument();
  });

  test("no results shows the hairline empty state naming the search", async () => {
    dispatchPayload = { data: [] };
    renderPanel();

    fireEvent.input(screen.getByLabelText(/Search by name/), { target: { value: "Zed" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("No results")).toBeInTheDocument();
    expect(screen.getByText(/with the name/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change location" })).toBeInTheDocument();
  });

  test("results outside the chosen province collapse to the area empty state", async () => {
    dispatchPayload = { data: [{ stylerId: "S1", businessName: "Toronto Pro", province: "Ontario" }] };
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText("Nothing in this area")).toBeInTheDocument();
    expect(screen.queryByTestId("stylist-card")).not.toBeInTheDocument();
  });

  test("opens the location picker from the empty state", async () => {
    dispatchPayload = { data: [] };
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Change location" }));
    expect(screen.getByRole("button", { name: "Close location picker" })).toBeInTheDocument();
  });

  test("the safety strip stays on the panel", () => {
    dispatchPayload = { data: [] };
    renderPanel();

    expect(screen.getByText("Safety & security")).toBeInTheDocument();
  });
});
