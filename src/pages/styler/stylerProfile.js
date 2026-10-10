import { getAuthToken, getUserRole, SUPPORT_EMAIL, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";
import arrow from "../../assets/svg-icons/black-arrow.svg";
import { Link } from "react-router-dom";

const StylerProfile = () => {
    // JWT subject is used only to build a public link; API authorization remains server-side.
    let link = "";
    try {
      const segment = getAuthToken().split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const { sub } = JSON.parse(atob(segment));
      if (getUserRole() === "STYLER" && typeof sub === "string" && sub) {
        link = `${window.location.origin}/stylistProfile/${encodeURIComponent(btoa(sub))}/${btoa("stylist")}`;
      }
    } catch { /* A malformed session needs a new login, never a fabricated profile. */ }

  const copyToClipboard = () => {
    Promise.resolve().then(() => navigator.clipboard.writeText(link))
      .then(() => {
        // console.log('Link copied to clipboard');
        showSuccessToastMessage("Link copied to clipboard")
      })
      .catch(err => {
        console.error('Failed to copy the link:', err);
        showErrorToastMessage("Failed to copy the link")    
      });
  };
    return ( 
        <div className="rounded-lg border border-black/10">
          <div className="border-b border-black/10 p-4 text-[11px] uppercase tracking-[0.25em] text-muted">
            My profile
          </div>
          <div className="p-4">
            <div className="text-sm">
              <p>Share profile:</p>
              {link ? <div className="grid gap-3 pb-6">
                <a href={link} className="text-brand underline">View public profile</a>
                <p className="break-all text-gray-500">{link}</p>
                <button type="button" className="text-left text-xs font-medium text-brand" onClick={copyToClipboard}>Copy link</button>
              </div> : <p className="pb-6" role="alert">Sign in again to load your public profile link.</p>}
              <div className="space-y-6 pt-6 border-t">
                <Link to={"/styler-dashboard/update-cover-photo"} className="flex justify-between items-center">
                  <div>Update cover photo</div>
                  <div><img src={arrow} alt="" className="h-6"/></div>
                </Link>
                <Link to={"/styler-dashboard/update-business-information"} className="flex justify-between items-center">
                  <div>Update business information</div>
                  <div><img src={arrow} alt="" className="h-6"/></div>
                </Link>
                <Link to={"/styler-dashboard/update-personal-information"} className="flex justify-between items-center">
                  <div>Update personal information</div>
                  <div><img src={arrow} alt="" className="h-6"/></div>
                </Link>
                {/* The password screen this used to open was inert: three fields and
                    a button, with no form and no request behind either. It is gone
                    rather than half-built, because a professional cannot change
                    their own password yet: the reset and update endpoints both look
                    the account up in the customers table and professionals live in
                    their own. Saying so, with a way to reach us, beats a screen that
                    quietly does nothing. */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div>Change password</div>
                    <p className="pt-1 text-xs opacity-60">
                      Contact support and we will change it for you.
                    </p>
                  </div>
                  <a
                    href={"mailto:" + SUPPORT_EMAIL}
                    className="shrink-0 text-xs font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
                <Link to={"/styler-dashboard/reviews"} className="flex justify-between items-center">
                  <div>Reviews</div>
                  <div><img src={arrow} alt="" className="h-6"/></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
     );
}
 
export default StylerProfile;