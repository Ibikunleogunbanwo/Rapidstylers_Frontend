/**
 * Professional signup: its five steps, and the one rule about the order they can
 * be entered in.
 *
 * The shell titles the rail and the step panel from `STEPS`, and the guard below
 * decides whether the step the URL names has actually been earned. Both read this
 * one table, so a step cannot be described in one place and gated in another, and
 * adding a step means adding a row here plus a child route in App.js.
 *
 * The steps are entered from a URL: a bookmark, a shared link, a restored tab, or
 * simply someone editing the address. Two of them are the whole point of the
 * guard. Reaching the password step with nothing behind it used to upload nothing
 * and post an empty account to the backend, and the failure only surfaced after
 * the images had been pushed to Cloudinary and the request came back rejected.
 */

/** Anything a form field can hold, including the numeric ids the API returns. */
const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

/**
 * The one answer this flow keeps outside the draft: the signup email, written once
 * step 1 has been accepted (so a code is on its way) and again after the code is
 * verified, which lets a refreshed step 1 start with the address filled in. It is
 * also what tells the guard that a visitor being sent back to the start had begun
 * the flow, which changes what the note says to them.
 *
 * Every read and write is guarded, because storage can refuse to answer at all: an
 * unguarded access in a browser with site data blocked throws, which would take
 * down the page over a convenience. Losing the address costs one retyped field.
 */
export const SIGNUP_EMAIL_KEY = "stylerSignupEmail";

export const readStoredSignupEmail = () => {
  try {
    return sessionStorage.getItem(SIGNUP_EMAIL_KEY) || "";
  } catch {
    return "";
  }
};

export const storeSignupEmail = (email) => {
  try {
    sessionStorage.setItem(SIGNUP_EMAIL_KEY, email);
  } catch {
    // The flow still holds it in memory for this visit.
  }
};

/** Drop the remembered address, so a finished signup leaves nothing behind. */
export const clearStoredSignupEmail = () => {
  try {
    sessionStorage.removeItem(SIGNUP_EMAIL_KEY);
  } catch {
    // Nothing readable, so nothing to clear.
  }
};

/**
 * The steps in order. `segment` is the child route's own segment: "" is the index
 * route, the rest match App.js. `lead` is the one sentence that says what the step
 * wants from the professional; a step whose own copy carries live detail (the
 * address the code went to) leaves it null. `complete` is what the step has to
 * have produced before the next one can be entered, read from the answers the
 * flow is holding.
 */
export const STEPS = [
  {
    segment: "",
    label: "Personal details",
    lead: "Please provide details about yourself.",
    // Written to the context only after the OTP request has been accepted, so
    // these four being present means step 1 really was submitted, not just typed.
    complete: ({ formData }) =>
      hasValue(formData.firstname) &&
      hasValue(formData.lastname) &&
      hasValue(formData.emailAddress) &&
      hasValue(formData.phoneNumber),
  },
  {
    segment: "verify-email",
    label: "Verify email",
    lead: null,
    // A flag of its own rather than the address, because the address stays in the
    // context once it is typed: it cannot tell a verified email from a pending one.
    complete: ({ emailVerified }) => emailVerified === true,
  },
  {
    segment: "business-details",
    label: "Business details",
    lead: "Tell us where clients find you and what you do.",
    complete: ({ formData }) =>
      [
        formData.serviceTypeId,
        formData.businessName,
        formData.address,
        formData.city,
        formData.province,
        formData.postalCode,
      ].every(hasValue),
  },
  {
    segment: "photos",
    label: "Photos",
    lead: "Add a profile photo, and the ID we check before your profile can go live.",
    // The files and the ID type are chosen together: the files alone mean the
    // step was not submitted, and the backend rejects a signup without the ID type.
    complete: ({ formData, imageFiles }) =>
      Boolean(imageFiles.profileImageFile) &&
      Boolean(imageFiles.identificationImageFile) &&
      hasValue(formData.identificationTypeId),
  },
  {
    segment: "secure-account",
    label: "Password",
    lead: "Choose a password to finish creating your account.",
    // The last step, and the one that creates the account. Gating it on a password
    // the flow never holds would guard nothing.
    complete: () => true,
  },
];

/** The step the visitor is on, from the path, defaulting to the first. */
export const stepIndexFrom = (pathname) => {
  const segment = String(pathname || "")
    .replace(/^\/styler-signup\/?/, "")
    .replace(/\/$/, "");
  const found = STEPS.findIndex((step) => step.segment === segment);
  return found === -1 ? 0 : found;
};

/** The URL of a step, so the guard and the routes agree on one spelling. */
export const stepPath = (index) => {
  const step = STEPS[index] || STEPS[0];
  return step.segment ? `/styler-signup/${step.segment}` : "/styler-signup";
};

/**
 * The photos step, and where the flow starts depending on something it cannot read
 * on the first render.
 *
 * The routes are stateless, so this reads the store's definition of the step
 * segment rather than repeating the index.
 */
export const PHOTOS_STEP = STEPS.findIndex((step) => step.segment === "photos");

/**
 * Whether a URL's step can only be judged once the stored photos have arrived.
 *
 * The three steps before the photos are decided entirely by the typed answers,
 * which are already in hand, so they are rendered immediately. The photos and
 * password steps are not: the photos step is unfinished until both files are
 * present, and the password step is only reachable once it is finished, so deciding
 * either while the read is outstanding would send a professional back to photos
 * they are about to have restored.
 */
export const awaitsStoredPhotos = (pathname) => stepIndexFrom(pathname) >= PHOTOS_STEP;

/**
 * The first step that has not been finished. That is where a visitor who skipped
 * ahead is sent, rather than to the very beginning: someone who typed their name
 * and then jumped to the end is one verification away from continuing, and sending
 * them back through work they have already done is its own kind of failure.
 *
 * The final step is always complete, so this always finds an answer.
 */
export const earliestIncompleteStep = ({
  formData = {},
  imageFiles = {},
  emailVerified = false,
} = {}) => {
  const progress = { formData: formData || {}, imageFiles: imageFiles || {}, emailVerified };
  const index = STEPS.findIndex((step) => !step.complete(progress));
  return index === -1 ? STEPS.length - 1 : index;
};

/**
 * What to say when someone is sent back, and it always gives a reason: that each
 * step builds on the one before it, that an email is waiting to be verified, or
 * that an account cannot be created without the photos. A visitor who has just
 * refreshed loses every answer, so their note says so instead of implying they
 * skipped a step they did not skip.
 */
const NOTICES = {
  0: "Professional signup runs in order and each step builds on the one before it, so it starts with your personal details.",
  1: "Your email address needs verifying before the next step, so enter the code we sent you and you can continue.",
  2: "Your business details come before the photos and the password, so this step is next.",
  3: "We cannot create your account without your profile photo and a photo of your ID, so those come first.",
};

const LOST_PROGRESS_NOTICE =
  "We no longer have the details you entered earlier, and each step builds on the one before it, so the flow starts again with your personal details.";

export const signupNotice = ({ target, startedBefore = false }) => {
  if (target === 0 && startedBefore) return LOST_PROGRESS_NOTICE;
  return NOTICES[target] || NOTICES[0];
};

/**
 * Where the URL should actually take this visitor, or null when the step it names
 * is reachable. Only ever backwards: a step banked in the context stays reachable,
 * because a professional who goes back to edit their details must be able to
 * return to where they were.
 */
export const signupRedirect = ({
  pathname,
  formData,
  imageFiles,
  emailVerified,
  startedBefore = false,
}) => {
  const requested = stepIndexFrom(pathname);
  const target = earliestIncompleteStep({ formData, imageFiles, emailVerified });
  if (target >= requested) return null;
  return { to: stepPath(target), notice: signupNotice({ target, startedBefore }) };
};
