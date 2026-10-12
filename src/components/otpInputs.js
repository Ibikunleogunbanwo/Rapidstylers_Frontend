// Controlled single-digit OTP box. The digit lives in React state (via the
// `value` prop) rather than the raw DOM, so it is always re-rendered visibly
// and can never be wiped or hidden by a re-render. The explicit text color
// guarantees the digit is dark on every browser/OS regardless of defaults.
//
// This is the one code box for the whole site: the customer verification, the
// customer quick-account step and the professional signup step all render it, so
// the three cannot look or behave differently. It fills the width its caller
// gives it, which is how one component serves three layouts: every caller puts
// six of these in a `grid-cols-6` row.
//
// The styling is the site's hairline register rather than the heavy bordered
// box it used to be (a grey fill, a two-pixel brand border and a bold digit),
// which was one of the last surfaces still wearing the old look.
//
// Deliberately NOT `required`. It was, and that quietly made the browser block
// submission whenever a box was empty, so a half-typed code never reached the
// page and the page's own message ("Enter all 6 digits of the code") could not be
// shown. Every caller checks the length itself and explains it in the site's
// voice, which is the behaviour we want in place of a native tooltip.
//
// The first box carries autocomplete="one-time-code", so a phone can offer the
// code from the email or SMS in one tap. That fill arrives as all six digits in
// the first box, which is why the first box alone accepts six characters: every
// caller spreads a full code across the row.
export const OTP_AUTOFILL = "one-time-code";

/** The six digits when a box received a whole code at once (autofill), else null. */
export const filledCode = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length === 6 ? digits.split("") : null;
};

const OtpInputs = ({ id, value, onChange, onKeyDown, onPaste, inputRef, autoFill = false }) => {
    return (
        <input
            type="text"
            inputMode="numeric"
            name={id}
            id={id}
            maxLength={autoFill ? 6 : 1}
            autoComplete={autoFill ? OTP_AUTOFILL : "off"}
            value={value || ""}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            ref={inputRef}
            className="h-12 w-full min-w-0 rounded-md border border-black/15 bg-white text-center text-lg text-onSurface caret-brand transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            aria-label={`Code digit ${id.replace(/[^0-9]/g, "")}`}
        />
    );
}
export default OtpInputs;
