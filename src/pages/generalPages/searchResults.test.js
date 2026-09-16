import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchResults from "./searchResults";
import { APIService } from "../../hooks/remote/apiService";

// Stub the heavy chrome — ServiceCard pulls in router/nav/ratings machinery and
// the ad slot renders nothing until AdSense is configured.
vi.mock("../../components/serviceCard", () => ({
  default: ({ name, stylerId }) => (
    <div data-testid="stylist-card">{name} · {stylerId}</div>
  ),
}));
vi.mock("../../components/adSlot", () => ({ default: () => null }));
vi.mock("../../components/footer", () => ({ default: () => <footer data-testid="footer" /> }));
vi.mock("../../hooks/useSavedStylists", () => ({
  useSavedStylists: () => ({
    savedIds: new Set(),
    loading: false,
    toggleSaved: vi.fn(),
  }),
}));
vi.mock("../../hooks/remote/apiService", () => ({
  APIService: {
    getStylerType: vi.fn(),
    searchNearby: vi.fn(),
    searchByCity: vi.fn(),
    searchByProvince: vi.fn(),
    // Kept only so a test can prove the open-now filter no longer reaches for a
    // full profile per result.
    singleStylerData: vi.fn(),
  },
}));

const stylists = (n, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({
    stylerId: `S${i + 1}`,
    businessName: `Pro ${i + 1}`,
    ...extra,
  }));

// Mirrors the backend /search_nearby contract: when page/pageSize are sent the
// response is { items, page, pageSize, total, hasNext }; without them the full
// list is returned as a plain array.
const nearbyMock = (all, total = all.length) =>
  vi.fn((_lat, _lng, _radius, _sid, _city, filters = {}) => {
    if (filters.page || filters.pageSize) {
      const pageSize = filters.pageSize || 12;
      const page = filters.page || 1;
      const from = (page - 1) * pageSize;
      return Promise.resolve({
        data: {
          data: {
            items: all.slice(from, from + pageSize),
            page,
            pageSize,
            total,
            hasNext: from + pageSize < total,
          },
        },
      });
    }
    return Promise.resolve({ data: { data: all } });
  });

const renderPage = (path = "/search?lat=53.5&lng=-113.5&radius=25") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SearchResults />
    </MemoryRouter>
  );

describe("SearchResults pagination", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    APIService.getStylerType.mockResolvedValue({ data: { data: [] } });
  });

  test("requests page/pageSize from the backend for nearby searches", async () => {
    APIService.searchNearby.mockImplementation(
      nearbyMock(stylists(3), 57)
    );
    renderPage();
    await screen.findAllByTestId("stylist-card");

    expect(APIService.searchNearby).toHaveBeenCalledWith(
      53.5, -113.5, 25, "", "", { openNow: false, page: 1, pageSize: 12 }
    );
    // The server's total drives the count badge, not the page size.
    expect(screen.getByText("57 professionals found")).toBeInTheDocument();
  });

  test("paginates long result lists using the backend page slices", async () => {
    APIService.searchNearby.mockImplementation(nearbyMock(stylists(25), 25));
    renderPage();

    const firstPage = await screen.findAllByTestId("stylist-card");
    expect(firstPage).toHaveLength(12);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText(/Pro 1 · S1/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/Pro 13 · S13/)).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.queryByText(/Pro 1 · S1/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/Pro 25 · S25/)).toBeInTheDocument();
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(await screen.findByText(/Pro 13 · S13/)).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  test("falls back to client-side slicing when a client filter (province) is active", async () => {
    const all = stylists(25, { province: "Alberta" });
    APIService.searchNearby.mockImplementation(nearbyMock(all, 25));
    renderPage("/search?lat=53.5&lng=-113.5&radius=25&province=Alberta");

    // No page/pageSize sent — the full list comes back and is sliced locally.
    expect(APIService.searchNearby).toHaveBeenCalledWith(
      53.5, -113.5, 25, "", "", { openNow: false }
    );

    const cards = await screen.findAllByTestId("stylist-card");
    expect(cards).toHaveLength(12);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/Pro 13 · S13/)).toBeInTheDocument();
    expect(screen.queryByText(/Pro 1 · S1/)).not.toBeInTheDocument();
  });

  test("reads the page from the URL (?page=2)", async () => {
    APIService.searchNearby.mockImplementation(nearbyMock(stylists(25), 25));
    renderPage("/search?lat=53.5&lng=-113.5&radius=25&page=2");

    expect(APIService.searchNearby).toHaveBeenCalledWith(
      53.5, -113.5, 25, "", "", { openNow: false, page: 2, pageSize: 12 }
    );
    expect(await screen.findByText(/Pro 13 · S13/)).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  test("writes the page to the URL when paginating", async () => {
    APIService.searchNearby.mockImplementation(nearbyMock(stylists(25), 25));
    renderPage();
    await screen.findAllByTestId("stylist-card");

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/Pro 13 · S13/);
    expect(APIService.searchNearby).toHaveBeenLastCalledWith(
      53.5, -113.5, 25, "", "", { openNow: false, page: 2, pageSize: 12 }
    );
  });

  test("restarts at page 1 when a filter changes", async () => {
    APIService.searchNearby.mockImplementation(nearbyMock(stylists(25), 25));
    renderPage();
    await screen.findAllByTestId("stylist-card");

    // Go to page 2, then toggle a filter — the request must reset to page 1.
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/Pro 13 · S13/);

    fireEvent.click(screen.getByRole("checkbox", { name: /open now/i }));
    await screen.findByText(/Pro 1 · S1/);
    expect(APIService.searchNearby).toHaveBeenLastCalledWith(
      53.5, -113.5, 25, "", "", { openNow: true, page: 1, pageSize: 12 }
    );
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  test("shows a single page with no pagination UI when results fit", async () => {
    APIService.searchNearby.mockImplementation(nearbyMock(stylists(5), 5));
    renderPage();

    const cards = await screen.findAllByTestId("stylist-card");
    expect(cards).toHaveLength(5);
    expect(screen.queryByText(/Page 1 of 1/)).not.toBeInTheDocument();
  });

  test("scrolls to the top when changing pages", async () => {
    APIService.searchNearby.mockImplementation(nearbyMock(stylists(25), 25));
    renderPage();
    await screen.findAllByTestId("stylist-card");

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  test("disables next on the last page and previous on the first", async () => {
    APIService.searchNearby.mockImplementation(nearbyMock(stylists(13), 13));
    renderPage();
    await screen.findAllByTestId("stylist-card");

    const prev = screen.getByRole("button", { name: /previous/i });
    const next = screen.getByRole("button", { name: /next/i });
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(await screen.findByText(/Pro 13 · S13/)).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /previous/i })).not.toBeDisabled();
  });
});

describe("SearchResults city search", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    APIService.getStylerType.mockResolvedValue({ data: { data: [] } });
  });

  test("a city-only search fetches from the city endpoint instead of showing nothing", async () => {
    APIService.searchByCity.mockResolvedValue({
      data: { data: [stylists(1)[0]] },
    });
    renderPage("/search?city=Calgary");

    expect(APIService.searchByCity).toHaveBeenCalledWith("Calgary");
    expect(await screen.findByTestId("stylist-card")).toBeInTheDocument();
    // The dedicated endpoint is city-scoped, so no client-side re-filter runs
    // that could strip rows whose city spelling differs in case or padding.
    expect(screen.getByText(/Professionals in Calgary/)).toBeInTheDocument();
  });

  test("an empty city widens to the province and the page says so honestly", async () => {
    APIService.searchByCity.mockResolvedValue({
      data: { data: { items: stylists(3), widened: true, widenedProvince: "Alberta" } },
    });
    renderPage("/search?city=Strathmore");

    const cards = await screen.findAllByTestId("stylist-card");
    expect(cards).toHaveLength(3);
    expect(
      screen.getByText("No professionals in Strathmore yet. Showing professionals across Alberta.")
    ).toBeInTheDocument();
  });

  test("a widened search never renders the empty state", async () => {
    APIService.searchByCity.mockResolvedValue({
      data: { data: { items: stylists(2), widened: true, widenedProvince: "Alberta" } },
    });
    renderPage("/search?city=Strathmore");

    await screen.findAllByTestId("stylist-card");
    expect(screen.queryByText(/No professionals found in this search yet/)).not.toBeInTheDocument();
  });

  test("a city with nobody and no known province still shows the empty state", async () => {
    APIService.searchByCity.mockResolvedValue({ data: { data: [] } });
    renderPage("/search?city=Nowhere");

    expect(
      await screen.findByText(/No professionals found in this search yet/)
    ).toBeInTheDocument();
  });
});

// Opening hours ship with every list row, so the filter reads them in place. It
// used to fetch each result's full profile, one request per row, just to learn
// whether that professional was open.
describe("SearchResults open-now filter", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    APIService.getStylerType.mockResolvedValue({ data: { data: [] } });
    APIService.singleStylerData.mockReset();
  });

  // A window around the professional's own now, so the assertion does not depend
  // on when the suite runs (the platform's hours are read in the vendor's zone).
  const vendorNow = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Edmonton",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (type) => (parts.find((part) => part.type === type) || {}).value;
    const weekday = { Sun: "0", Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6" }[get("weekday")];
    return { weekday, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
  };
  const hhmm = (minutes) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

  test("keeps only rows whose own hours say they are open, with no per-result fetch", async () => {
    const { weekday, minutes } = vendorNow();
    APIService.searchByProvince.mockResolvedValue({
      data: {
        data: [
          {
            stylerId: "S1",
            businessName: "Open Studio",
            province: "Alberta",
            timeZone: "America/Edmonton",
            availability: [
              { dayOfWeek: weekday, startTime: hhmm(Math.max(0, minutes - 60)), endTime: hhmm(Math.min(1439, minutes + 60)) },
            ],
          },
          // No availability in the payload: it cannot be shown to be open, so an
          // "Open now" search leaves it out rather than guessing.
          { stylerId: "S2", businessName: "Shut Studio", province: "Alberta" },
        ],
      },
    });

    renderPage("/search?province=Alberta&openNow=true");

    expect(await screen.findByText(/Open Studio · S1/)).toBeInTheDocument();
    expect(screen.queryByText(/Shut Studio · S2/)).toBeNull();
    expect(APIService.singleStylerData).not.toHaveBeenCalled();
  });

  test("shows every row when the filter is off", async () => {
    APIService.searchByProvince.mockResolvedValue({
      data: { data: [
        { stylerId: "S1", businessName: "Open Studio", province: "Alberta" },
        { stylerId: "S2", businessName: "Shut Studio", province: "Alberta" },
      ] },
    });

    renderPage("/search?province=Alberta");

    expect(await screen.findByText(/Open Studio · S1/)).toBeInTheDocument();
    expect(screen.getByText(/Shut Studio · S2/)).toBeInTheDocument();
  });
});
