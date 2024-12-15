import { showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";
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
        <div className="border rounded-md">
          <div className="border-b p-4 text-sm font-medium">
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
                <Link to={"/styler-dashboard/update-password"} className="flex justify-between items-center">
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