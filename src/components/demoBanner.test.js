import { render, screen } from "@testing-library/react";
import DemoBanner from "./demoBanner";

describe("DemoBanner", () => {
  afterEach(() => {
    document.head.querySelectorAll('meta[name="robots"]').forEach((m) => m.remove());
  });

  it("renders nothing on the live site", () => {
    const { container } = render(<DemoBanner demo={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("on the demo, points visitors to the live site and asks search engines not to index", () => {
    render(<DemoBanner demo liveUrl="https://rapidstylers.ca" />);
    expect(screen.getByRole("link", { name: /sign up or book/i })).toHaveAttribute("href", "https://rapidstylers.ca");
    expect(document.head.querySelector('meta[name="robots"]').content).toBe("noindex, nofollow");
  });
});
