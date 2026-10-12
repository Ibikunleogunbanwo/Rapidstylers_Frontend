import { NewsletterPreference } from "../../components/newsletter";
import { getAuthToken, getUserRole, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";
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
              <NewsletterPreference />
              <div className="space-y-6 pt-6 border-t">
                <Link to="/styler-dashboard/appointment-locations" className="flex justify-between items-center">Appointment locations and travel fees<img src={arrow} alt="" className="h-6"/></Link>
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
                <Link to={"/styler-dashboard/change-password"} className="flex justify-between items-center">
                  <div>Change password</div>
                  <div><img src={arrow} alt="" className="h-6"/></div>
                </Link>
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