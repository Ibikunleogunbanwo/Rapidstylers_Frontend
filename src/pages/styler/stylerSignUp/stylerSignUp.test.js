/**
 * The signup shell is the one page in the flow that knows where the visitor is.
 *
 * It used to render a cramped run of "1. Personal · 2. Verify Email · …" text
 * that never said which step you were on, and each step carried its own bold
 * heading, so the two could describe different steps. The rail and the panel
 * heading now both come from one table keyed to the route, and these tests hold
 * that: the steps are named in order, exactly one is current, the panel titles
 * the step the visitor is actually on, and an unrecognised child path falls back
 * to the first step instead of rendering an untitled panel.
 *
 * The same route is also what a visitor can type, so the second half of this file
 * is the guard: a URL naming a step the answers do not support sends them to the
 * earliest step they can actually take, with a note saying why, and the note is
 * spent on the way there rather than following them through the flow.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import StylerSignUp from "./stylerSignUp";
import { SIGNUP_EMAIL_KEY } from "./signupFlow";

// The answers the flow is holding, read through the mocked context so a test can
// put a visitor anywhere in the flow without filling five forms to get there.
let signup = {};

vi.mock("../../../context/StylerSignupContext", () => ({
  StylerSignupProvider: ({ children }) => children,
  useStylerSignup: () => signup,
}));

const personal = {
  firstname: "Ada",
  lastname: "Lovelace",
  emailAddress: "ada@example.com",
  phoneNumber: "5875551234",
};

const business = {
  serviceTypeId: "3",
  businessName: "Ada Studio",
  address: "1 Main St NW, Calgary, AB",
  city: "Calgary",
  province: "Alberta",
  postalCode: "T2P 1A1",
};

const imageFiles = {
  profileImageFile: new File(["p"], "profile.png"),
  identificationImageFile: new File(["i"], "id.png"),
};

/** The flow's answers when `step` is the earliest step still to be finished. */
const progressAt = (step) => ({
  formData: {
    ...(step >= 1 ? personal : {}),
    ...(step >= 3 ? business : {}),
    ...(step >= 4 ? { identificationTypeId: "2" } : {}),
  },
  imageFiles: step >= 4 ? imageFiles : {},
  emailVerified: step >= 2,
});

/**
 * Renders a URL of the flow with the visitor's answers `reached` step ahead of
 * them: `reached: 0` is someone who has answered nothing, `reached: 4` is someone
 * with every earlier step behind them. `restoringPhotos` is the context saying the
 * stored photos have not arrived yet, which is how a reload mid-flow really looks.
 */
const renderAt = (path, { reached = 4, restoringPhotos } = {}) => {
  signup = { ...progressAt(reached) };
  if (restoringPhotos !== undefined) signup.restoringPhotos = restoringPhotos;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/styler-signup" element={<StylerSignUp />}>
          <Route index element={<div>personal form</div>} />
          <Route path="verify-email" element={<div>verify form</div>} />
          <Route path="business-details" element={<div>business form</div>} />
          <Route path="photos" element={<div>photos form</div>} />
          <Route path="secure-account" element={<div>password form</div>} />
          <Route path="*" element={<div>unknown step</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

const rail = () => screen.getByRole("list");

describe("professional signup shell", () => {
  afterEach(() => sessionStorage.clear());

  it("names all five steps, in the order they are taken", () => {
    renderAt("/styler-signup", { reached: 0 });

    const rows = within(rail()).getAllByRole("listitem");
    const labelOf = (row) =>
      within(row).getByText(/^(Personal details|Verify email|Business details|Photos|Password)$/)
        .textContent;

    expect(rows.map(labelOf)).toEqual([
      "Personal details",
      "Verify email",
      "Business details",
      "Photos",
      "Password",
    ]);
    // The number each row shows is the step's position, not a separate list.
    expect(rows.map((row) => row.querySelector("span").textContent)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  it("marks the step the visitor is on, and only that one, as current", () => {
    renderAt("/styler-signup/photos");

    const current = screen.getAllByText("Current step");
    expect(current).toHaveLength(1);
    // The marker sits on the Photos row, which is also the accessible current step.
    expect(current[0].closest("li").textContent).toContain("Photos");
    expect(screen.getByRole("listitem", { current: "step" }).textContent).toContain("Photos");
    // The three steps behind it read as done.
    expect(screen.getAllByText("Completed")).toHaveLength(3);
    // And an earned step is entered without a word of explanation.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("titles the panel with the step the route is on, and counts it", () => {
    renderAt("/styler-signup/business-details", { reached: 3 });

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    expect(
      screen.getByText(/Tell us where clients find you and what you do/)
    ).toBeInTheDocument();
    expect(screen.getByText("business form")).toBeInTheDocument();
    // No other step's copy is on screen.
    expect(screen.queryByText(/Add a profile photo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Please provide details about yourself/)).not.toBeInTheDocument();
  });

  it("says nothing for a step that carries its own live detail", () => {
    renderAt("/styler-signup/verify-email", { reached: 2 });

    // Step 2's lead is null on purpose: the step itself names the address the code
    // went to, and the shell cannot know it.
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("verify form")).toBeInTheDocument();
    expect(screen.queryByText(/Please provide details about yourself/)).not.toBeInTheDocument();
  });

  it("falls back to the first step for an unrecognised child path", () => {
    renderAt("/styler-signup/something-else", { reached: 0 });

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByText(/Please provide details about yourself/)).toBeInTheDocument();
  });

  it("sends a visitor who skips ahead to the first step, and says why", () => {
    // The exact URL a first-time visitor can arrive on from a bookmark or a link.
    renderAt("/styler-signup/secure-account", { reached: 0 });

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByText("personal form")).toBeInTheDocument();
    expect(screen.queryByText("password form")).not.toBeInTheDocument();
    // The note is on the page, and it explains the order rather than the URL.
    expect(screen.getByRole("status")).toHaveTextContent(/runs in order/i);
  });

  it("resumes at the earliest unfinished step instead of the very start", () => {
    // Details typed and the email verified: one business step away, so sending
    // them back through the start would be asking for work already done.
    renderAt("/styler-signup/secure-account", { reached: 2 });

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    expect(screen.getByText("business form")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/business details/i);
  });

  it("sends a visitor whose email is unverified back one step, not to the start", () => {
    renderAt("/styler-signup/photos", { reached: 1 });

    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("verify form")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/verifying/i);
  });

  it("tells a visitor whose answers are gone that they are gone", () => {
    // A refresh mid-flow keeps the email but nothing else, which is how the flow
    // knows this visitor was already under way.
    sessionStorage.setItem(SIGNUP_EMAIL_KEY, "ada@example.com");

    renderAt("/styler-signup/photos", { reached: 0 });

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/no longer have/i);
  });

  it("waits for the stored photos rather than bouncing a professional off the password step", () => {
    // A reload on the last step: the typed answers are already in hand, but the two
    // photos are still being read back from storage.
    renderAt("/styler-signup/secure-account", { restoringPhotos: true });

    // The step is not handed over yet, and nobody is told they skipped anything: the
    // photos are about to arrive and the professional is exactly where they were.
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument();
    expect(screen.getByText(/Getting back the photos you picked/)).toBeInTheDocument();
    expect(screen.queryByText("password form")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the earlier steps without waiting, since they need only the typed answers", () => {
    // Standing on step 1 while a reload is still restoring the photos: the form is
    // not held up by storage it does not depend on.
    renderAt("/styler-signup", { reached: 2, restoringPhotos: true });

    expect(screen.getByText("personal form")).toBeInTheDocument();
    expect(screen.queryByText(/Getting back the photos/)).not.toBeInTheDocument();
  });

  it("spends the note on the step it was written for", () => {
    signup = progressAt(2);
    render(
      <MemoryRouter initialEntries={["/styler-signup/photos"]}>
        <Routes>
          <Route path="/styler-signup" element={<StylerSignUp />}>
            <Route index element={<div>personal form</div>} />
            <Route path="verify-email" element={<div>verify form</div>} />
            <Route
              path="business-details"
              element={
                <>
                  <div>business form</div>
                  <Link to="/styler-signup/photos">Continue</Link>
                </>
              }
            />
            <Route path="photos" element={<div>photos form</div>} />
            <Route path="secure-account" element={<div>password form</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Sent back two steps, and told which step that is.
    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/business details/i);

    // The visitor answers it, which is what makes the photos step theirs.
    signup = progressAt(3);
    fireEvent.click(screen.getByRole("link", { name: "Continue" }));

    expect(screen.getByText("Step 4 of 5")).toBeInTheDocument();
    expect(screen.getByText("photos form")).toBeInTheDocument();
    // The explanation belonged to the redirect, not to the flow.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
