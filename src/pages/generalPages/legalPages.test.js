import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Terms from "./termsAndConditions";
import Privacy from "./privacyPolicy";
// The shared site header needs the app's store; these tests are about the page body.
vi.mock("../../components/publicHeader", () => ({ default: () => null }));


// The footer pulls in redux for the session-aware links; stub it, this file is
// about the page shells.
vi.mock("../../components/footer", () => ({ default: () => <footer /> }));

describe("legal pages on the shared shell", () => {
  it("terms renders its sections inside the shared shell", () => {
    const { container } = render(<MemoryRouter><Terms /></MemoryRouter>);
    expect(screen.getByText("Terms and Conditions")).toBeInTheDocument();
    expect(screen.getByText("15. Contact")).toBeInTheDocument();
    expect(container.querySelector("section.bg-white")).not.toBeNull();
  });
  it("privacy renders its sections inside the shared shell", () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("11. Contact our Privacy Officer")).toBeInTheDocument();
  });
  it("names the operating company, Alberta law and the privacy contact (P-19)", () => {
    const terms = render(<MemoryRouter><Terms /></MemoryRouter>);
    expect(terms.container.textContent).toContain("operated by Keripe Inc.");
    expect(terms.container.textContent).toContain("laws of the Province of Alberta");
    terms.unmount();
    const privacy = render(<MemoryRouter><Privacy /></MemoryRouter>);
    const text = privacy.container.textContent;
    expect(text).toContain("Keripe Inc.");
    expect(text).toContain("admin@rapidstylers.ca");
    expect(text).toContain("Stylist ID photos");
    expect(text).toContain("outside Canada");
  });
});
