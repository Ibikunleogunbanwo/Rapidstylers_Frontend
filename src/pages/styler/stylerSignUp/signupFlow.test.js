/**
 * The reachability rule for professional signup.
 *
 * Every step of the flow lives at a URL a visitor can type, bookmark or share,
 * and the steps build on each other: the password step posts an account built
 * from everything the earlier four collected. The rule is therefore that a step
 * is only entered if the ones before it have answered, and these tests hold the
 * two halves of that: which step counts as unfinished, and where a visitor who is
 * ahead of their answers gets sent (and what they are told).
 */
import {
  awaitsStoredPhotos,
  clearStoredSignupEmail,
  earliestIncompleteStep,
  PHOTOS_STEP,
  readStoredSignupEmail,
  SIGNUP_EMAIL_KEY,
  signupNotice,
  signupRedirect,
  STEPS,
  stepIndexFrom,
  stepPath,
  storeSignupEmail,
} from "./signupFlow";

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

describe("signup flow steps", () => {
  it("lists the five steps in the order they are taken, and where each one lives", () => {
    expect(STEPS.map((step) => step.label)).toEqual([
      "Personal details",
      "Verify email",
      "Business details",
      "Photos",
      "Password",
    ]);
    expect(STEPS.map((step) => stepPath(STEPS.indexOf(step)))).toEqual([
      "/styler-signup",
      "/styler-signup/verify-email",
      "/styler-signup/business-details",
      "/styler-signup/photos",
      "/styler-signup/secure-account",
    ]);
  });

  it("reads the step from the path, and falls back to the first for anything else", () => {
    expect(stepIndexFrom("/styler-signup")).toBe(0);
    expect(stepIndexFrom("/styler-signup/")).toBe(0);
    expect(stepIndexFrom("/styler-signup/verify-email")).toBe(1);
    expect(stepIndexFrom("/styler-signup/business-details")).toBe(2);
    expect(stepIndexFrom("/styler-signup/photos")).toBe(3);
    expect(stepIndexFrom("/styler-signup/secure-account")).toBe(4);
    expect(stepIndexFrom("/styler-signup/not-a-step")).toBe(0);
    // A trailing slash is the same step, not an unknown one.
    expect(stepIndexFrom("/styler-signup/photos/")).toBe(3);
  });

  it("names the earliest step that still needs an answer", () => {
    [0, 1, 2, 3, 4].forEach((step) => {
      expect(earliestIncompleteStep(progressAt(step))).toBe(step);
    });
  });

  it("treats a blank or missing answer as unfinished, not as filled in", () => {
    // Spaces are not a name.
    expect(earliestIncompleteStep({ ...progressAt(1), formData: { ...personal, firstname: "   " } })).toBe(0);
    // The email alone is not proof the code was entered.
    expect(earliestIncompleteStep({ ...progressAt(2), emailVerified: false })).toBe(1);
    // One missing business field keeps the business step open.
    expect(
      earliestIncompleteStep({ ...progressAt(3), formData: { ...personal, ...business, postalCode: "" } })
    ).toBe(2);
    // The address is what a client travels to, so it counts like the rest.
    expect(
      earliestIncompleteStep({ ...progressAt(3), formData: { ...personal, ...business, address: "" } })
    ).toBe(2);
  });

  it("accepts the numeric ids the service-type endpoint returns", () => {
    expect(
      earliestIncompleteStep({
        ...progressAt(3),
        formData: { ...personal, ...business, serviceTypeId: 3 },
      })
    ).toBe(3);
  });

  it("keeps the photos step open until the ID type is chosen too", () => {
    // Both files picked but the step never submitted: the backend needs the ID
    // type, so the step is not finished.
    expect(
      earliestIncompleteStep({
        formData: { ...personal, ...business },
        imageFiles,
        emailVerified: true,
      })
    ).toBe(3);
    // The ID type without the second photo is equally unfinished.
    expect(
      earliestIncompleteStep({
        formData: { ...personal, ...business, identificationTypeId: "2" },
        imageFiles: { profileImageFile: imageFiles.profileImageFile },
        emailVerified: true,
      })
    ).toBe(3);
  });

  it("has an answer for a fresh visitor and for an empty state", () => {
    expect(earliestIncompleteStep()).toBe(0);
    expect(earliestIncompleteStep({})).toBe(0);
  });
});

describe("sending a visitor back to the step that is actually next", () => {
  it("sends a URL that is ahead of the answers to the earliest unfinished step", () => {
    const redirect = signupRedirect({
      pathname: "/styler-signup/secure-account",
      ...progressAt(2),
    });

    expect(redirect.to).toBe("/styler-signup/business-details");
    expect(redirect.notice).toMatch(/business details/i);
  });

  it("never redirects a visitor forward, so earlier steps stay editable", () => {
    // Everything answered: the URL is taken at its word.
    expect(
      signupRedirect({ pathname: "/styler-signup/secure-account", ...progressAt(4) })
    ).toBeNull();
    // Standing on a step that is already finished is allowed as well: going back
    // to edit the details must not throw the visitor to the end of the flow.
    expect(
      signupRedirect({ pathname: "/styler-signup/business-details", ...progressAt(3) })
    ).toBeNull();
    expect(signupRedirect({ pathname: "/styler-signup", ...progressAt(3) })).toBeNull();
    // And the step the flow has reached exactly is not a redirect either.
    expect(
      signupRedirect({ pathname: "/styler-signup/verify-email", ...progressAt(1) })
    ).toBeNull();
  });

  it("gives every destination a reason, and the reason is its own", () => {
    const notices = [0, 1, 2, 3].map((target) => signupNotice({ target }));

    notices.forEach((notice) => {
      expect(notice.trim().length).toBeGreaterThan(0);
      // The house voice, same rule the copy guards enforce across the app.
      expect(notice).not.toContain("\u2014");
    });
    // Each one explains the step it is sending the visitor to rather than
    // repeating one generic line.
    expect(new Set(notices).size).toBe(notices.length);
  });

  it("tells a visitor whose answers are gone that they are gone", () => {
    const deepLink = { pathname: "/styler-signup/photos", ...progressAt(0) };

    const fresh = signupRedirect({ ...deepLink, startedBefore: false });
    const resumed = signupRedirect({ ...deepLink, startedBefore: true });

    // Someone who never started is told the order, not accused of losing work.
    expect(fresh.to).toBe("/styler-signup");
    expect(fresh.notice).toMatch(/runs in order/i);
    expect(fresh.notice).not.toMatch(/no longer have/i);
    // Someone who refreshed mid-flow did lose their answers, and the note says so.
    expect(resumed.to).toBe("/styler-signup");
    expect(resumed.notice).toMatch(/no longer have/i);
    expect(resumed.notice).not.toBe(fresh.notice);
  });
});

describe("the stored photos the flow has to wait for", () => {
  it("names the photos step from the step table rather than an index of its own", () => {
    expect(STEPS[PHOTOS_STEP].segment).toBe("photos");
  });

  it("holds the two steps that cannot be judged without them", () => {
    // Both files are part of what finishes the photos step, and the password step is
    // only reachable once it is finished, so an empty photo set would send a
    // professional backwards through a step they had already done.
    expect(awaitsStoredPhotos("/styler-signup/photos")).toBe(true);
    expect(awaitsStoredPhotos("/styler-signup/secure-account")).toBe(true);
    // An unrecognised path falls back to the first step, which does not depend on
    // the photos, so it renders rather than waiting on a read it does not need.
    expect(awaitsStoredPhotos("/styler-signup/not-a-step")).toBe(false);
  });

  it("lets the three earlier steps render from the typed answers alone", () => {
    expect(awaitsStoredPhotos("/styler-signup")).toBe(false);
    expect(awaitsStoredPhotos("/styler-signup/verify-email")).toBe(false);
    expect(awaitsStoredPhotos("/styler-signup/business-details")).toBe(false);
  });
});

describe("the remembered signup email", () => {
  afterEach(() => sessionStorage.clear());

  it("reads back what it stored", () => {
    expect(readStoredSignupEmail()).toBe("");

    storeSignupEmail("ada@example.com");

    expect(readStoredSignupEmail()).toBe("ada@example.com");
    expect(sessionStorage.getItem(SIGNUP_EMAIL_KEY)).toBe("ada@example.com");
  });

  it("forgets the address when the signup is over", () => {
    storeSignupEmail("ada@example.com");

    clearStoredSignupEmail();

    // Otherwise the next professional to sign up in this tab would find the previous
    // one's address already typed into step 1.
    expect(readStoredSignupEmail()).toBe("");
    expect(sessionStorage.getItem(SIGNUP_EMAIL_KEY)).toBeNull();
  });

  it("survives a browser that refuses to answer", () => {
    const blocked = () => {
      throw new Error("storage is blocked");
    };
    const spies = ["getItem", "setItem", "removeItem"].map((method) =>
      vi.spyOn(Storage.prototype, method).mockImplementation(blocked)
    );

    // Retyping one field is the whole cost of storage being unavailable; the page
    // itself must not fail over it.
    expect(readStoredSignupEmail()).toBe("");
    expect(() => storeSignupEmail("ada@example.com")).not.toThrow();
    expect(() => clearStoredSignupEmail()).not.toThrow();

    spies.forEach((spy) => spy.mockRestore());
  });
});
