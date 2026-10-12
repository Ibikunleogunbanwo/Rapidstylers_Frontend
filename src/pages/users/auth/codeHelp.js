import { Link } from "react-router-dom";

/**
 * Shown under every sign-up code step. A code can land in spam, and for privacy
 * the site never says whether an address already has an account: that person is
 * emailed a note instead of a code, so this line tells them where to go next.
 */
export const CodeHelp = ({ className = "mt-4" }) => (
  <p className={`${className} text-xs leading-[1.6] text-black/55`}>
    No code? Check spam. If you already have a RapidStylers account,{" "}
    <Link to="/login" className="font-semibold text-brand hover:underline">sign in instead</Link>.
  </p>
);

export default CodeHelp;
