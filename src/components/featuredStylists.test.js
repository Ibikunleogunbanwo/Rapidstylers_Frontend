import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Featured from "./featuredStylists";
import { APIService } from "../hooks/remote/apiService";

vi.mock("../hooks/remote/apiService", () => ({
  APIService: {
    getStylerType: vi.fn(),
    stylersBaseOnCategory: vi.fn(),
  },
}));

const CATS = [
  { serviceTypeId: 7, serviceTypeName: "Barber" },
  { serviceTypeId: 3, serviceTypeName: "Nail Technician" },
];

describe("Featured (Discover professionals)", () => {
  const renderFeatured = () => render(<MemoryRouter><Featured /></MemoryRouter>);
  beforeEach(() => {
    APIService.getStylerType.mockResolvedValue({ data: { data: CATS } });
    APIService.stylersBaseOnCategory.mockResolvedValue({ data: { data: [] } });
  });

  it("renders the eyebrow + display heading register, not the bare text-3xl", () => {
    renderFeatured();
    const eyebrow = screen.getByText("Discover professionals");
    // The eyebrow: 11px, uppercase, tracked, muted.
    expect(eyebrow.className).toContain("text-[11px]");
    expect(eyebrow.className).toContain("uppercase");
    expect(eyebrow.className).toContain("tracking-[0.25em]");
    const heading = screen.getByRole("heading", { name: "Top-rated stylists, ready when you are" });
    expect(heading.className).toContain("font-normal");
    expect(heading.className).toContain("tracking-[-0.02em]");
    expect(heading.className).toContain("clamp");
    // The old bare 30px heading must not return.
    expect(screen.queryByText(/^Discover professionals\.$/)).toBeNull();
  });

  it("uses the quiet pill pair: tinted active, hairline inactive, no solid slab", async () => {
    const user = { click: (el) => fireEvent.click(el) };
    renderFeatured();
    const barber = await screen.findByText("Barber");
    expect(barber.className).toContain("bg-brand/10");
    expect(barber.className).toContain("text-brand");
    expect(barber.className).toContain("rounded-full");
    // No solid slab.
    expect(barber.className).not.toContain("bg-brand text-white");

    const nails = screen.getByText("Nail Technician");
    expect(nails.className).toContain("border-black/15");
    expect(nails.className).toContain("text-black/60");
    expect(nails.className).not.toContain("bg-white/50");

    await user.click(nails);
    expect(await screen.findByText("Nail Technician")).toHaveClass("bg-brand/10");
    expect(screen.getByText("Barber").className).not.toContain("bg-brand/10");
  });

  it("keeps the section semantics and loads stylists for the selected category", async () => {
    renderFeatured();
    expect(screen.getByRole("tablist", { name: /Discover professionals/i })).toBeTruthy();
    await waitFor(() =>
      expect(APIService.stylersBaseOnCategory).toHaveBeenCalledWith(7)
    );
  });

  it("shows a card-shaped skeleton grid while loading, not collapsing text", async () => {
    let resolveFetch;
    APIService.stylersBaseOnCategory.mockReturnValue(
      new Promise((resolve) => { resolveFetch = resolve; })
    );
    renderFeatured();
    const status = await screen.findByRole("status", { name: /loading professionals/i });
    // Four card skeletons in the same responsive grid as the results.
    const skeletons = status.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(12); // 3 pulse zones x 4 cards
    expect(status.querySelector(".aspect-\\[4\\/3\\]")).toBeTruthy();
    expect(status.className).toContain("lg:grid-cols-4");
    // No bare text line.
    expect(screen.queryByText("Loading...")).toBeNull();
    // Resolving swaps the skeleton out for content.
    resolveFetch({ data: { data: [{ stylerId: 1, businessName: "Braid Bar" }] } });
    expect(await screen.findByText("Braid Bar")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the loading state and the grid for a category with stylists", async () => {
    APIService.stylersBaseOnCategory.mockResolvedValue({
      data: { data: [{ stylerId: 1, businessName: "Braid Bar", averageRating: "4.8" }] },
    });
    renderFeatured();
    expect(await screen.findByText("Braid Bar")).toBeTruthy();
  });

  it("renders a friendly empty state that names the category and offers ways out", async () => {
    const user = { click: (el) => fireEvent.click(el) };
    renderFeatured();
    // Names the empty category (the first tab) in the sentence.
    const sentence = await screen.findByText(/available here yet\./);
    expect(sentence.textContent.replace(/\s+/g, " ")).toContain("Barber");
    // Nudge copy, not a dead end.
    expect(screen.getByText(/New professionals join every week/)).toBeTruthy();
    // Primary nudge: jump to another category (goes to the next tab, wrapping).
    const nudge = screen.getByRole("button", { name: "Browse another category" });
    await user.click(nudge);
    const next = await screen.findByText(/available here yet\./);
    expect(next.textContent.replace(/\s+/g, " ")).toContain("Nail Technician");
  });

  it("empty state links to full search and never renders the old bare line", async () => {
    renderFeatured();
    const link = await screen.findByRole("link", { name: "Use full search" });
    expect(link.getAttribute("href")).toBe("/search");
    expect(screen.queryByText("No professionals found in this category yet.")).toBeNull();
  });

  it("caps the teaser at one row of 4 and offers See more with the category carried into /search", async () => {
    APIService.stylersBaseOnCategory.mockResolvedValue({
      data: { data: Array.from({ length: 9 }, (_, i) => ({ stylerId: i + 1, businessName: `Studio ${i + 1}` })) },
    });
    renderFeatured();

    // Exactly 4 cards render — one grid row.
    expect(await screen.findByText("Studio 1")).toBeTruthy();
    for (let i = 2; i <= 4; i++) expect(screen.getByText(`Studio ${i}`)).toBeTruthy();
    for (let i = 5; i <= 9; i++) expect(screen.queryByText(`Studio ${i}`)).toBeNull();

    // The count is said honestly, and the link carries the category so /search
    // opens pre-filtered on the same tab the visitor was browsing.
    expect(screen.getByText(/Showing 4 of 9 in Barber/)).toBeTruthy();
    const link = screen.getByRole("link", { name: "See more" });
    const href = link.getAttribute("href");
    expect(href).toContain("/search");
    expect(href).toContain("serviceTypeId=7");
    expect(href).toContain("serviceTypeName=Barber");
  });

  it("renders no See more row when the category fits within one row", async () => {
    APIService.stylersBaseOnCategory.mockResolvedValue({
      data: { data: [{ stylerId: 1, businessName: "Solo Studio" }] },
    });
    renderFeatured();

    expect(await screen.findByText("Solo Studio")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "See more" })).toBeNull();
    expect(screen.queryByText(/Showing/)).toBeNull();
  });

  // The category endpoint ships each professional's weekly hours, so the cards
  // can state real opening hours rather than only reporting a login flag. The
  // window is built around the professional's own now, so the assertion does not
  // depend on when the suite runs.
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

  it("states the professional's real hours, read on their own clock", async () => {
    const { weekday, minutes } = vendorNow();
    APIService.stylersBaseOnCategory.mockResolvedValue({
      data: {
        data: [
          {
            stylerId: "DS5713",
            businessName: "Demo Beauty Co",
            visibilityStatus: "Online",
            timeZone: "America/Edmonton",
            availability: [
              { dayOfWeek: weekday, startTime: hhmm(Math.max(0, minutes - 60)), endTime: hhmm(Math.min(1439, minutes + 60)) },
            ],
          },
        ],
      },
    });
    renderFeatured();

    expect(await screen.findByText("Open now")).toBeInTheDocument();
    // Presence is kept, but demoted to what it actually means.
    expect(screen.getByTitle("Signed in right now")).toBeInTheDocument();
  });

  it("claims nothing about hours when the row carries none, falling back to presence", async () => {
    APIService.stylersBaseOnCategory.mockResolvedValue({
      data: { data: [{ stylerId: 1, businessName: "Braid Bar", visibilityStatus: "Online" }] },
    });
    renderFeatured();

    expect(await screen.findByText("Braid Bar")).toBeInTheDocument();
    // No hours in the payload means no hours claim: not "Closed", which would be
    // a verdict on data this surface never received.
    expect(screen.queryByText("Closed")).toBeNull();
    expect(screen.queryByText("Open now")).toBeNull();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("makes every card a link to the public profile, so browsing needs no account", async () => {
    APIService.stylersBaseOnCategory.mockResolvedValue({
      data: { data: [
        { stylerId: "DS5713", businessName: "Demo Beauty Co" },
        { id: 42, businessName: "Id-only Stylist" },
      ] },
    });
    renderFeatured();

    const demoCard = (await screen.findByText("Demo Beauty Co")).closest("a");
    expect(demoCard.getAttribute("href")).toContain("/stylistProfile/");
    // Cards whose rows key on id rather than stylerId link too.
    const idCard = screen.getByText("Id-only Stylist").closest("a");
    expect(idCard.getAttribute("href")).toContain("/stylistProfile/");
  });
});
