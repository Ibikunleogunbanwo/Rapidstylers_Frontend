import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DemoMode, { isDemoBrowsePath } from "./demoMode";

const renderAt = (path, props) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DemoMode liveUrl="https://rapidstylers.ca" {...props} />
    </MemoryRouter>
  );

describe("DemoMode", () => {
  afterEach(() => {
    document.head.querySelectorAll('meta[name="robots"]').forEach((m) => m.remove());
  });

  it("does nothing on the live site", () => {
    const goTo = vi.fn();
    const { container } = renderAt("/login", { demo: false, goTo });
    expect(container).toBeEmptyDOMElement();
    expect(goTo).not.toHaveBeenCalled();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("on the demo, shows no banner and asks search engines not to index", () => {
    const { container } = renderAt("/", { demo: true, goTo: vi.fn() });
    expect(container).toBeEmptyDOMElement();
    expect(document.head.querySelector('meta[name="robots"]').content).toBe("noindex, nofollow");
  });

  it("on the demo, sends sign-up, login and booking to the same page on the live site", () => {
    const goTo = vi.fn();
    renderAt("/styler-signup/verify-email?x=1", { demo: true, goTo });
    expect(goTo).toHaveBeenCalledWith("https://rapidstylers.ca/styler-signup/verify-email?x=1");
  });

  it("knows which pages a demo visitor may browse", () => {
    ["/", "/search", "/blog/3", "/stylist/2/Nail%20Technician", "/stylistProfile/7/Ade", "/admin/login"].forEach((p) =>
      expect(isDemoBrowsePath(p)).toBe(true)
    );
    ["/login", "/personalDetails", "/styler-signup", "/bookAppointment", "/dashboard/home", "/contact-support"].forEach((p) =>
      expect(isDemoBrowsePath(p)).toBe(false)
    );
  });
});
