import logo from "../../../assets/svg-icons/colouredLogo.svg";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { StylerSignupProvider, useStylerSignup } from "../../../context/StylerSignupContext";
import { STEPS, awaitsStoredPhotos, readStoredSignupEmail, signupRedirect, stepIndexFrom } from "./signupFlow";

/**
 * Professional signup, in two pieces: the provider that accumulates the answers,
 * and the flow that renders the step the URL names, or refuses to and sends the
 * visitor to the step that is actually next for them.
 *
 * The split is deliberate. A component cannot read a context it creates itself,
 * and the guard has to read the answers to know which step has been earned.
 */
const StylerSignUp = () => (
  <StylerSignupProvider>
    <StylerSignUpFlow />
  </StylerSignupProvider>
);

/**
 * The signup shell.
 *
 * This is the same shell as the customer registration flow and sign-in: the
 * doodle panel on the left, the form column on the right. What it adds is the
 * rail, because this flow is five steps rather than two. The rail replaces a
 * cramped run of "1. Personal · 2. Verify Email · …" text whose current step you
 * had to work out yourself; here the step you are on is the lit one, the ones
 * behind you are marked done, and the ones ahead stay quiet.
 *
 * The steps build on each other, so a URL naming a later step than the answers
 * support is not a step anyone can take: it is a half-filled form that fails at
 * the very end, after the photos have been uploaded and the account has been
 * rejected. So the flow reads the URL before rendering it, and sends the visitor
 * to their earliest unfinished step, saying why.
 *
 * That judgement has one blind spot, which the draft introduces and this closes.
 * The typed answers are read synchronously, so the earlier steps are decided
 * before the first paint; the two photos are binary and arrive from IndexedDB a
 * moment later. Judging the photos and password steps in that moment would read an
 * empty photo set and send a professional back to the photos step just as their
 * photos were arriving, so those two steps wait for the read instead.
 */
export const StylerSignUpFlow = () => {
  const location = useLocation();
  const { formData, imageFiles, emailVerified, restoringPhotos } = useStylerSignup();

  const current = stepIndexFrom(location.pathname);
  const waiting = restoringPhotos && awaitsStoredPhotos(location.pathname);

  const redirect = waiting
    ? null
    : signupRedirect({
        pathname: location.pathname,
        formData,
        imageFiles,
        emailVerified,
        startedBefore: Boolean(readStoredSignupEmail()),
      });

  if (redirect) {
    // `replace`, so the skipped-ahead URL does not sit in history for the back
    // button to return to. The note travels as location state, which is what keeps
    // it to one step: the next step's own navigation carries no state, so the
    // explanation cannot follow the professional through the rest of the flow.
    return <Navigate to={redirect.to} replace state={{ signupNotice: redirect.notice }} />;
  }

  const step = STEPS[current];
  const notice = location.state?.signupNotice;

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left panel: what this flow is, and how far along the visitor is. */}
      <div className="col-span-1 lg:col-span-8 h-screen overflow-hidden hidden lg:block relative">
        <div className="bg-stylerDoodle h-full w-full bg-repeat bg-auto"></div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white px-10">
          <div className="max-w-sm grid gap-8">
            <p className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.02em]">
              Become a <span className="text-brand">RapidStylers</span> professional
            </p>
            <ol className="grid gap-4">
              {STEPS.map((entry, i) => {
                const done = i < current;
                const here = i === current;
                return (
                  <li
                    key={entry.label}
                    aria-current={here ? "step" : undefined}
                    className={`flex items-center gap-3 ${here ? "" : "opacity-50"}`}
                  >
                    <span
                      className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        done || here ? "bg-brand text-white" : "border-2 border-white text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm">{entry.label}</span>
                    {/* Sighted visitors read the lit circle; this is the same
                        fact for anyone who cannot see it. */}
                    {(done || here) && (
                      <span className="sr-only">{done ? "Completed" : "Current step"}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Right panel: the step itself. */}
      <div className="col-span-1 lg:col-span-4">
        <div className="grid content-between h-full">
          <div className="p-5 md:p-10 mb-6 md:mb-0 w-full max-h-screen overflow-y-auto">
            <img src={logo} alt="RapidStylers" className="h-10 mb-8" />

            {/* The counter is the mobile answer to the rail, and repeats the
                rail's own numbering rather than inventing its own. */}
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
              Step {current + 1} of {STEPS.length}
            </p>
            <p className="mt-2 text-[22px] font-normal tracking-[-0.01em] text-onSurface">
              {step.label}
            </p>
            {step.lead && <p className="mt-1 text-sm text-black/60">{step.lead}</p>}

            {notice && (
              // Not an error: nothing went wrong, the visitor simply arrived at a
              // step the flow cannot hand them yet. A hairline box rather than the
              // red of a failure, and announced, because this redirect happened
              // without a page load for a screen reader to react to.
              <p
                role="status"
                className="mt-4 rounded-lg border border-black/10 p-3 text-[13px] leading-[1.55] text-black/60"
              >
                {notice}
              </p>
            )}

            <div className="mt-6">
              {/* Holding the step for the length of one storage read, which is a
                  frame in practice. Rendered rather than left blank, because a
                  slow browser is the only way anyone sees this. */}
              {waiting ? (
                <p className="text-sm text-black/55">Getting back the photos you picked…</p>
              ) : (
                <Outlet />
              )}
            </div>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
  );
};

export default StylerSignUp;
