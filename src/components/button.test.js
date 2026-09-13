import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./button";

/**
 * These pin the parts of the contract that broke silently in production: the
 * props were renamed but the call sites were not, so forty buttons across the
 * app rendered with no label and no background, and the button type stopped
 * being forwarded. Nothing threw, and no test noticed.
 */
describe("Button", () => {
  test("renders the label passed as text", () => {
    render(<Button text="Sign In" />);

    expect(screen.getByRole("button")).toHaveTextContent("Sign In");
  });

  test("renders the label passed as children", () => {
    render(<Button>Join!</Button>);

    expect(screen.getByRole("button")).toHaveTextContent("Join!");
  });

  test("prefers children when both a label and a text prop are given", () => {
    render(<Button text="fallback">Submit</Button>);

    expect(screen.getByRole("button")).toHaveTextContent("Submit");
    expect(screen.getByRole("button")).not.toHaveTextContent("fallback");
  });

  test("still labels the button when no variant is given", () => {
    render(<Button text="Update details" variant={undefined} />);

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Update details");
    expect(button.className).toContain("bg-brand");
  });

  test("falls back to the base styling for an unknown variant instead of rendering nothing", () => {
    render(<Button text="Continue" variant="not-a-variant" />);

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Continue");
    expect(button.className).not.toContain("undefined");
  });

  test("forwards the button type so forms keep submitting", () => {
    render(<Button text="Verify" type="submit" />);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  test("does not invent a type when none is passed, leaving the form default intact", () => {
    render(<Button text="Search" />);

    expect(screen.getByRole("button")).not.toHaveAttribute("type");
  });

  test("honours an explicit type=button for actions inside a form", () => {
    render(<Button text="Go to Dashboard" type="button" />);

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  test("passes disabled through to the element", () => {
    render(<Button text="Saving..." disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("calls onClick", () => {
    const onClick = vi.fn();
    render(<Button text="Add service" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("appends a caller's className to the variant styling", () => {
    render(<Button text="Search" className="w-full" />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("bg-brand");
  });

  test("spreads extra attributes onto the element", () => {
    render(<Button text="Search" aria-label="Search for a styler" data-testid="x" />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Search for a styler");
  });

  test("applies the requested size", () => {
    render(<Button text="Continue" size="lg" />);

    expect(screen.getByRole("button").className).toContain("text-base");
  });

  // The rename is landing page by page, so the old prop names keep working until
  // every call site has moved over. Without this, an unmigrated page renders a
  // button with no label and no colour — the failure this file exists to catch.
  test("still labels and colours a call site using the pre-rename props", () => {
    render(<Button btnText="Continue" btnType="primary" type="submit" />);

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Continue");
    expect(button.className).toContain("bg-brand");
    expect(button).toHaveAttribute("type", "submit");
  });

  test("lets the legacy variant win only when the new prop is absent", () => {
    render(<Button btnText="Search" btnType="light" variant="primary" />);

    // `variant` is defaulted, so an explicit btnType has to take precedence for
    // an old call site to keep the look it had before the rename.
    expect(screen.getByRole("button").className).toContain("bg-white");
  });
});
