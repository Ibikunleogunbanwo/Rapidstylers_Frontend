import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  CustomerSignupCounter,
  CustomerSignupRail,
  STEPS,
  stepIndexFrom,
} from "./customerSignupRail";

const renderAt = (pathname) =>
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <CustomerSignupRail />
      <CustomerSignupCounter />
    </MemoryRouter>
  );

/** The rail row for a step, which is the label's own line. */
const rowFor = (label) => screen.getByText(label).parentElement;

describe("customer signup progress", () => {
  it("names the four steps in the order the flow runs them", () => {
    expect(STEPS.map((step) => step.label)).toEqual([
      "Register email address",
      "Verify email address",
      "Personal details",
      "Secure your account",
    ]);
  });

  it("reads the step from the route", () => {
    expect(stepIndexFrom("/verifyEmailAddress")).toBe(1);
    expect(stepIndexFrom("/personalDetails")).toBe(2);
    expect(stepIndexFrom("/secureAccount")).toBe(3);
  });

  it("falls back to the first step for a path it does not own", () => {
    // Step 1 is the sign-in modal, so "/" is genuinely where a signup begins.
    expect(stepIndexFrom("/")).toBe(0);
    expect(stepIndexFrom(undefined)).toBe(0);
    expect(stepIndexFrom("/somewhereElse")).toBe(0);
  });

  it("marks the step the URL names as the one you are on, and no other", () => {
    renderAt("/personalDetails");

    expect(rowFor("Personal details").className).not.toMatch(/opacity-50/);
    ["Register email address", "Verify email address", "Secure your account"].forEach((label) => {
      expect(rowFor(label).className).toMatch(/opacity-50/);
    });
  });

  it("fills the markers up to the step you are on and outlines the rest", () => {
    renderAt("/personalDetails");

    expect(rowFor("Register email address").firstElementChild.className).toMatch(/bg-brand/);
    expect(rowFor("Verify email address").firstElementChild.className).toMatch(/bg-brand/);
    expect(rowFor("Personal details").firstElementChild.className).toMatch(/bg-brand/);
    expect(rowFor("Secure your account").firstElementChild.className).toMatch(/border-2/);
  });

  it("states the same numbering in text, which is what a phone sees", () => {
    renderAt("/secureAccount");
    expect(screen.getByText(`Step ${STEPS.length} of ${STEPS.length}`)).toBeTruthy();
  });

  it("counts the step a deep link names rather than assuming a completed flow", () => {
    renderAt("/verifyEmailAddress");
    expect(screen.getByText("Step 2 of 4")).toBeTruthy();
  });

  it("starts a visitor at step 1 on a route the flow does not own", () => {
    renderAt("/");

    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
    expect(rowFor("Register email address").className).not.toMatch(/opacity-50/);
    expect(rowFor("Verify email address").className).toMatch(/opacity-50/);
  });
});
