import { SUPPORT_EMAIL, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";
import arrow from "../../assets/svg-icons/black-arrow.svg";
import { Link } from "react-router-dom";

const StylerProfile = () => {
    const link = 'https://bitly.com/a/sign_in?rd=/Blc2aqs0vet/links/bit.ly/3NooO35/detaiBlc2aqs0vetBlc2aqs0vet/links/bit.ly/3NooO35/detaiBlc2aqs0vetrrrtrtgwgw';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
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
              <div className="grid md:flex gap-4 justify-between pb-6">
                <div className="truncate w-full md:w-[80%] text-gray-500">{link}</div>
                <div className="md:w-[20%] text-end">
                    <span className="text-xs font-medium cursor-pointer text-brand" onClick={copyToClipboard}>Copy link</span>
                </div>
              </div>
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