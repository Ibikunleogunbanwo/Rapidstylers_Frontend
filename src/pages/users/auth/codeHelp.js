import { Link } from "react-router-dom";

/**
 * Shown under every sign-up code step (customer and professional).
 *
 * A code can land in spam, junk or a promotions tab, and the resend control sits
 * above the boxes, so the first line says where to look and how to get another.
 *
 * For privacy the site never says whether an address already has an account:
 * the backend answers a sign-up request the same way either way, and a person who
 * already has one is emailed sign-in instructions instead of a code. The second
 * line covers that case without saying which case this is, and gives both ways
 * forward.
 */
export const CodeHelp = ({ className = "mt-4" }) => (
  <div className={`${className} grid gap-2 text-xs leading-[1.6] text-black/55`}>
    <p>
      No code? Check your spam or junk folder and any promotions tab. It can take a
      minute or two to arrive; after that, use Resend code above to get a new one.
    </p>
    <p>
      If this email already has a RapidStylers account, we've sent sign-in
      instructions instead of a code. You can{" "}
      <Link to="/login" className="font-semibold text-brand hover:underline">sign in</Link>
      {" "}or{" "}
      <Link to="/resetPassword" className="font-semibold text-brand hover:underline">reset your password</Link>.
    </p>
  </div>
);

export default CodeHelp;
