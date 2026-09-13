import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import ElevateLooks from "./elevateYourLooks";
import { APIService } from "../../hooks/remote/apiService";

// The gallery page is what we're testing — stub the heavy chrome (Hero pulls in
// redux/router/formik/video assets) and the ad slot, keeping the test focused.
vi.mock("./newHeroSection", () => ({ default: () => <div data-testid="hero" /> }));
vi.mock("../../components/footer", () => ({ default: () => <div data-testid="footer" /> }));
vi.mock("../../components/adSlot", () => ({ default: () => null }));

// react-scripts resets mock implementations between tests, so the factory only
// declares the shape and values are wired in beforeEach (see apiService.test.js).
vi.mock("../../hooks/remote/apiService", () => ({
  APIService: { searchGallery: vi.fn() },
}));

// Shape returned by the backend /gallery endpoint for an approved stylist's upload.
const PHOTO = {
  src: {
    medium: "https://img.example/medium.jpg",
    large: "https://img.example/large.jpg",
    original: "https://img.example/original.jpg",
  },
  alt: "Gallery Pro Studio — dreadlocks",
  photographer: "Gallery Pro Studio",
  stylerId: "GS5816",
  source: "stylist",
};

describe("ElevateLooks gallery cards", () => {
  beforeEach(() => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [PHOTO] } });
  });

  test("renders a profile link per stylist card with the encoded route", async () => {
    render(<ElevateLooks />);

    const link = await screen.findByRole("link", {
      name: "View Gallery Pro Studio's profile",
    });
    expect(link.getAttribute("href")).toBe(
      `/stylistProfile/${btoa("GS5816")}/${btoa("Gallery Pro Studio")}`
    );

    // The verified badge and the By credit both live inside the same card link.
    expect(within(link).getByText("Verified")).toBeInTheDocument();
    expect(within(link).getByText(/Gallery Pro Studio/)).toBeInTheDocument();
  });

  test("renders an expand button per stylist card", async () => {
    render(<ElevateLooks />);

    const expand = await screen.findByRole("button", {
      name: "View Gallery Pro Studio — dreadlocks full size",
    });
    expect(expand).toBeInTheDocument();
  });

  test("opens the lightbox from the expand button with the work credit", async () => {
    render(<ElevateLooks />);

    const expand = await screen.findByRole("button", {
      name: "View Gallery Pro Studio — dreadlocks full size",
    });
    fireEvent.click(expand);

    const dialog = await screen.findByRole("dialog", {
      name: "Gallery Pro Studio — dreadlocks full view",
    });
    expect(within(dialog).getByText(/Work by/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Book with Gallery Pro Studio" })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "View profile" })).toBeInTheDocument();

    // Closing the lightbox restores the page.
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows the empty state when a category without curated work has no uploads", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    // Wait for the first (curated) view to settle before switching, so the
    // category change runs against the populated grid.
    await screen.findByRole("button", { name: "View Professional makeup application" });
    fireEvent.click(screen.getByRole("button", { name: "Wigs" }));

    expect(
      await screen.findByText("No Wigs work posted yet")
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /profile$/ })).not.toBeInTheDocument();
  });

  test("leads the first view with curated RapidStylers work", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    expect(
      await screen.findByRole("button", { name: "View Professional makeup application" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View Barber fading the sides with clippers" })
    ).toBeInTheDocument();
  });

  test("filters curated work to the selected category", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    // The opening view shows everything, so "a braids photo is present" proves
    // nothing, and "the makeup photo is gone" is also true of the empty grid
    // mid-load. Only the filtered state satisfies both at once.
    await screen.findByRole("button", { name: "View Professional makeup application" });
    fireEvent.click(screen.getByRole("button", { name: "Braids" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "View Long auburn knotless braids" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "View Professional makeup application" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "View Long faux locs worn with statement sunglasses" })
      ).not.toBeInTheDocument();
    });
  });

  test("names the opening view, so the strip always has a selected entry", async () => {
    // The gallery used to open on an unlabelled "everything" view whose first tab
    // was already selected, so clicking that tab changed no value the loader
    // watched: it highlighted while the grid went on showing every category.
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    await screen.findByRole("button", { name: "View Professional makeup application" });

    const strip = screen.getByRole("button", { name: "All work" });
    expect(strip.className).toContain("bg-brand");
    // …and it is the first thing in the strip.
    const tabs = screen.getAllByRole("button").filter((b) => /^(All work|[A-Z].*)$/.test(b.textContent.trim()));
    expect(tabs[0].textContent.trim()).toBe("All work");
  });

  test("comes back to the whole gallery from a category", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);
    await screen.findByRole("button", { name: "View Professional makeup application" });

    fireEvent.click(screen.getByRole("button", { name: "Braids" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "View Professional makeup application" })
      ).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "All work" }));

    expect(
      await screen.findByRole("button", { name: "View Professional makeup application" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View Long auburn knotless braids" })
    ).toBeInTheDocument();
  });

  test("a merged tab shows the photos of every category it covers", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    await screen.findByRole("button", { name: "View Professional makeup application" });
    fireEvent.click(screen.getByRole("button", { name: "Locs & dreadlocks" }));

    // Both backend names behind the one tab. The tab queries for each of them —
    // the label itself is not a category the API accepts, and either name on its
    // own would hide the other's work.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "View Long faux locs worn with statement sunglasses" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "View Soft locs styled loose past the shoulder" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "View Professional makeup application" })
      ).not.toBeInTheDocument();
    });

    // The tab's label is not a backend category, so the request must name the
    // categories it covers — otherwise the API answers 400 and the tab looks
    // broken the moment a stylist posts under either name.
    await waitFor(() =>
      expect(
        APIService.searchGallery.mock.calls.some(([category]) => category === "Dreadlocks")
      ).toBe(true)
    );
    const requested = APIService.searchGallery.mock.calls.map(([category]) => category);
    expect(requested).toContain("Locs");
    expect(requested).not.toContain("Locs & dreadlocks");

    // One tab, not two half-tabs.
    expect(screen.queryByRole("button", { name: "Locs" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dreadlocks" })).not.toBeInTheDocument();
  });
});

/**
 * Production returns zero approved-stylist uploads, so the visible gallery is
 * the curated list. Search used to query only the empty upload feed, which made
 * every keyword answer "No results"; these pin it to the photos on screen.
 */
describe("ElevateLooks gallery search", () => {
  // Waits out the in-flight request so no state update lands after a test ends.
  const settle = async () => {
    await waitFor(
      () => expect(screen.queryByText("Loading images…")).not.toBeInTheDocument(),
      { timeout: 2500 }
    );
  };

  // The input is debounced, so the request lands ~400ms after typing.
  const searchFor = async (text) => {
    fireEvent.change(screen.getByPlaceholderText(/search the gallery/i), {
      target: { value: text },
    });
    await waitFor(
      () =>
        expect(APIService.searchGallery).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Number),
          1,
          text
        ),
      { timeout: 2500 }
    );
    await settle();
  };

  const renderWithNoUploads = async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);
    await screen.findByRole("button", { name: "View Professional makeup application" });
  };

  test("finds curated work by keyword rather than only the upload feed", async () => {
    await renderWithNoUploads();

    await searchFor("bob");

    expect(
      await screen.findByRole("button", { name: "View Blunt braided bob with a centre part" })
    ).toBeInTheDocument();
    expect(screen.getByText(/results? for "bob"/)).toBeInTheDocument();
  });

  test("searches every category, not just the selected tab", async () => {
    // The default tab is Dreadlocks, which has no curated photos at all.
    await renderWithNoUploads();

    await searchFor("nails");

    expect(
      await screen.findByRole("button", { name: "View Glossy red almond nails" })
    ).toBeInTheDocument();
  });

  test("narrows the grid to the matches while a keyword is active", async () => {
    await renderWithNoUploads();

    await searchFor("french");

    expect(
      await screen.findByRole("button", { name: "View Classic French tip almond nails" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View Professional makeup application" })
    ).not.toBeInTheDocument();
  });

  test("shows the empty state when nothing matches", async () => {
    await renderWithNoUploads();

    await searchFor("zzzqqq");

    expect(await screen.findByText('No results for "zzzqqq"')).toBeInTheDocument();
  });

  test("a keyword with no match reads as no results, not a gallery outage", async () => {
    APIService.searchGallery.mockRejectedValue(new Error("network down"));
    render(<ElevateLooks />);
    await screen.findByRole("button", { name: "View Professional makeup application" });

    fireEvent.change(screen.getByPlaceholderText(/search the gallery/i), {
      target: { value: "zzzqqq" },
    });

    expect(await screen.findByText('No results for "zzzqqq"')).toBeInTheDocument();
    // The outage is a footnote — the keyword is the headline.
    expect(
      screen.getByText(/a match may be missing/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the gallery")).not.toBeInTheDocument();
  });

  test("a slow earlier response cannot overwrite a newer search", async () => {
    // Two searches in flight at once: the older one answering last must not win.
    const deferred = () => {
      const box = {};
      box.promise = new Promise((resolve) => {
        box.resolve = resolve;
      });
      return box;
    };
    const slow = deferred();
    const fast = deferred();
    // StrictMode double-invokes effects, so responses are chosen by keyword
    // rather than by call order.
    APIService.searchGallery.mockImplementation((category, perPage, page, query) => {
      if (query === "bob") return slow.promise;
      if (query === "french") return fast.promise;
      return Promise.resolve({ data: { data: [] } });
    });

    render(<ElevateLooks />);
    await screen.findByRole("button", { name: "View Professional makeup application" });

    const input = screen.getByPlaceholderText(/search the gallery/i);
    const requestedWith = (text) =>
      waitFor(
        () =>
          expect(
            APIService.searchGallery.mock.calls.some(([, , , query]) => query === text)
          ).toBe(true),
        { timeout: 2500 }
      );

    fireEvent.change(input, { target: { value: "bob" } });
    await requestedWith("bob");
    fireEvent.change(input, { target: { value: "french" } });
    await requestedWith("french");

    const upload = (alt, photographer) => ({
      src: { medium: "https://img.example/x.jpg" },
      alt,
      photographer,
      stylerId: "S1",
      source: "stylist",
    });

    // Uploads are stylist work, so the card is a profile link plus an expand button.
    fast.resolve({ data: { data: [upload("French Upload", "French Studio")] } });
    await screen.findByRole("button", { name: "View French Upload full size" });

    slow.resolve({ data: { data: [upload("Bob Upload", "Bob Studio")] } });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(
      screen.queryByRole("button", { name: "View Bob Upload full size" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View French Upload full size" })
    ).toBeInTheDocument();
  });

  test("clearing the search restores the view you were browsing", async () => {
    await renderWithNoUploads();
    await searchFor("zzzqqq");
    await screen.findByText('No results for "zzzqqq"');

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    await waitFor(
      () => expect(screen.queryByText(/results? for/)).not.toBeInTheDocument(),
      { timeout: 2500 }
    );
    await settle();

    // Clearing from the opening view must bring the whole curated set back —
    // it used to collapse to the selected tab (Dreadlocks: no photos) and empty
    // the gallery with a "couldn't load" message.
    expect(
      await screen.findByRole("button", { name: "View Professional makeup application" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Couldn't load the gallery/)).not.toBeInTheDocument();
  });

  test("choosing a category tab leaves search mode", async () => {
    await renderWithNoUploads();
    await searchFor("nails");
    await screen.findByRole("button", { name: "View Glossy red almond nails" });

    fireEvent.click(screen.getByRole("button", { name: "Braids" }));

    await waitFor(
      () => expect(screen.getByPlaceholderText(/search the gallery/i).value).toBe(""),
      { timeout: 2500 }
    );
    expect(
      await screen.findByRole("button", { name: "View Long auburn knotless braids" })
    ).toBeInTheDocument();
    await settle();
  });
});
