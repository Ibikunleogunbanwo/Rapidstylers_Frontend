import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchStyler from "./searchStylers";

vi.mock("../../../components/goBack", () => ({ default: () => <nav aria-label="Back" /> }));
vi.mock("../../../components/spinner", () => ({ default: () => null }));
vi.mock("../../../components/serviceCard", () => ({
  default: ({ name }) => <div data-testid="stylist-card">{name}</div>,
}));
vi.mock("../../../hooks/useSavedStylists", () => ({
  useSavedStylists: () => ({ savedIds: new Set(), loading: false, toggleSaved: vi.fn() }),
}));
vi.mock("../../../hooks/local/userReducer", () => ({
  searchStyler: (word) => ({ type: "SEARCH", payload: word }),
}));

let dispatchPayload;
let dispatchResult;
let dispatchOverride;
vi.mock("react-redux", () => ({
  // useDispatch must return the dispatch function; the component awaits it and
  // destructures { payload }. dispatchPayload is assigned in beforeEach.
  useDispatch: () => (action) => dispatchOverride ? dispatchOverride(action) : Promise.resolve(dispatchResult || { payload: dispatchPayload }),
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
    dispatchResult = null;
    dispatchOverride = null;
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
    expect(screen.getByText(/found for/)).toHaveTextContent("1 professional found for “Ada” across Canada");
  });

  test("no results shows the hairline empty state naming the search", async () => {
    dispatchPayload = { data: [] };
    renderPanel();

    fireEvent.input(screen.getByLabelText(/Search by name/), { target: { value: "Zed" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("No results")).toBeInTheDocument();
    expect(screen.getByText(/with the name/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse by service" })).toHaveAttribute("href", "/bookAppointment");
  });

  test("a name search is not limited by the current location (QA C-03)", async () => {
    // The location context is not even consulted: a Toronto professional is
    // found by name whatever area the customer has chosen.
    dispatchPayload = { data: [{ stylerId: "S1", businessName: "Toronto Pro", province: "Ontario" }] };
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByTestId("stylist-card")).toHaveTextContent("Toronto Pro");
    expect(screen.queryByText("Nothing in this area")).not.toBeInTheDocument();
    expect(screen.queryByText(/Searching near/)).not.toBeInTheDocument();
  });

  test("the safety strip stays on the panel", () => {
    dispatchPayload = { data: [] };
    renderPanel();

    expect(screen.getByText("Safety & security")).toBeInTheDocument();
  });
});

test("rejected thunk reports failure rather than pretending search is empty", async () => {
 dispatchResult = {meta:{requestStatus:'rejected'},payload:{data:[{stylerId:'S1',businessName:'Invalid result',province:'Alberta'}]}};
 renderPanel();
 expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to search/);
 expect(screen.queryByText('Invalid result')).not.toBeInTheDocument();
 expect(screen.queryByText('No results')).not.toBeInTheDocument();
});
test("older search cannot replace newer results", async () => {
 let finishOld;
 dispatchOverride = (action) => action.payload === 'Ada' ? Promise.resolve({payload:{data:[{stylerId:'S2',businessName:'New Ada',province:'Alberta'}]}}) : new Promise(resolve=>{finishOld=resolve;});
 renderPanel();
 fireEvent.change(screen.getByLabelText(/Search by name/),{target:{value:'Ada'}});
 fireEvent.click(screen.getByRole('button',{name:'Search'}));
 expect(await screen.findByText('New Ada')).toBeInTheDocument();
 finishOld({payload:{data:[{stylerId:'S1',businessName:'Old result',province:'Alberta'}]}});
 await waitFor(()=>expect(screen.queryByText('Old result')).not.toBeInTheDocument());
 expect(screen.getByText('New Ada')).toBeInTheDocument();
});
