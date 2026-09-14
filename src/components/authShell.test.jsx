import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthSplit, WizardSteps, AuthHeading } from "./authShell";

describe("auth shell", () => {
  it("renders the brand statement and the form column", () => {
    render(
      <MemoryRouter>
        <AuthSplit eyebrow="Welcome back" statement="Sign in and pick up where you left off.">
          <AuthHeading title="Welcome back" sub="Sign in to your account" />
          <button type="button">Sign In</button>
        </AuthSplit>
      </MemoryRouter>
    );
    expect(screen.getByText("Sign in and pick up where you left off.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RapidStylers home" }).getAttribute("href")).toBe("/");
  });

  it("shows wizard progress with the current step marked", () => {
    const steps = ["Personal", "Verify Email", "Business"];
    const { container } = render(<WizardSteps steps={steps} current={1} />);
    expect(screen.getByText("Personal").closest("li").textContent).toContain("\u2713");
    expect(screen.getByText("Verify Email").closest("li").getAttribute("aria-current")).toBe("step");
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });
});
