/**
 * Customer signup: the four steps its rail names, and the one place their order
 * and their "you are here" marker live.
 *
 * The rail was copy-pasted into all three pages, each carrying its own `steps`
 * array and its own hand-typed current index (3, 2, 4). The labels agreed, but
 * three copies of a list and three typed-in markers are three chances to drift
 * apart, and none of them was tied to the page the visitor was actually on.
 *
 * Both pieces below read the step from the route, so nothing has to be kept in
 * step by hand. The rail is the desktop form of it, hidden below `lg`; the
 * counter is the same numbering in text, and it is what a customer on a phone
 * gets. That arrangement is the professional flow's, and this is the customer
 * flow matching it.
 *
 * Step 1 has no route of its own: registering the email address happens in the
 * sign-in modal on the home page, which is why the rail names a step that no URL
 * can be.
 */

import { useLocation } from "react-router-dom";

export const STEPS = [
  { label: "Register email address", path: null },
  { label: "Verify email address", path: "/verifyEmailAddress" },
  { label: "Personal details", path: "/personalDetails" },
  { label: "Secure your account", path: "/secureAccount" },
];

/** The step the path names, or the first step when it names none of them. */
export const stepIndexFrom = (pathname) => {
  const index = STEPS.findIndex((step) => step.path && step.path === pathname);
  return index === -1 ? 0 : index;
};

/**
 * The step this page is, read from the URL rather than passed in, which is what
 * stops a page from marking itself as some step it is not. `useLocation` is
 * called defensively because the page tests stub the router module, and a stub
 * that omits the hook should render the rail at its first step rather than take
 * the page down.
 */
const useStepIndex = () => {
  const location = (typeof useLocation === "function" ? useLocation() : null) || {};
  return stepIndexFrom(location.pathname);
};

/** The rail: the step you are on is lit, the ones behind you are marked done. */
export const CustomerSignupRail = () => {
  const current = useStepIndex();

  return (
    <div className="grid gap-4">
      {STEPS.map((step, index) => (
        <div
          key={step.label}
          className={`flex items-center gap-3 ${index === current ? "" : "opacity-50"}`}
        >
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
              index <= current ? "bg-brand text-white" : "border-2 border-white text-white"
            }`}
          >
            {index + 1}
          </div>
          <div className="text-sm">{step.label}</div>
        </div>
      ))}
    </div>
  );
};

/** The same numbering in text, which is the only form a phone gets. */
export const CustomerSignupCounter = () => (
  <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
    Step {useStepIndex() + 1} of {STEPS.length}
  </p>
);
