import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Section, Eyebrow, Statement, BackHome, PageHeading, HairlineList, PhotoFigure } from "./pageSections";

describe("page primitives", () => {
  it("renders a muted section with eyebrow and statement", () => {
    render(
      <MemoryRouter>
        <Section muted>
          <Eyebrow>What you can book</Eyebrow>
          <Statement>Braids to barbering.</Statement>
          <HairlineList items={[{ key: "a", title: "Braids", note: "Knotless and box" }]} columns={2} />
          <PhotoFigure id="g-nails-9" />
        </Section>
      </MemoryRouter>
    );
    expect(screen.getByText("What you can book")).toBeInTheDocument();
    expect(screen.getByText("Braids to barbering.").closest("section").className).toContain("bg-neutral");
    expect(screen.getByText("Braids").closest("li").className).toContain("border-t");
    expect(screen.getByText(/Posted by a verified professional/)).toBeInTheDocument();
  });
  it("renders a dark section and back link", () => {
    render(
      <MemoryRouter>
        <Section dark>
          <Eyebrow dark>For professionals</Eyebrow>
          <Statement dark size="lg">Keep the clients.</Statement>
        </Section>
      </MemoryRouter>
    );
    expect(screen.getByText("Keep the clients.").closest("section").className).toContain("bg-[#0A0A0A]");
  });
});
