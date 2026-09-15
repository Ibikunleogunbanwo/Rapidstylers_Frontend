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
});
