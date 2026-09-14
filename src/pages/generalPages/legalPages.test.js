import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Terms from "./termsAndConditions";
import Privacy from "./privacyPolicy";

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
    expect(screen.getByText("10. Contact us")).toBeInTheDocument();
  });
});
