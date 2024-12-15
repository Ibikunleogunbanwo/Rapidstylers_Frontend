import bookmark from "../../../assets/svg-icons/bookmark.svg";
import SelectService from "../../../components/selectService";
import Back from "../../../components/goBack"
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSingleStylerProfile } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";

const StylistProfile = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Book Appointment");
    document.title = "Book an appointment - Rapid Styler";
  }));
  let { stylerId, stylerName } = useParams();
  stylerId = atob(stylerId);
  
  const stylerProfile = useSingleStylerProfile(stylerId);

  return (
    <div className="bg-white border rounded-lg">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center justify-between border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <div className="flex gap-2 items-center">
          <Back />
          <span>{atob(stylerName)}</span>
        </div>
        <div>
          <img src={bookmark} alt="" className="h-5" />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-8 md:mb-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Address:</span>
            <span className="text-sm text-brand">[ Get directions ]</span>
          </div>
          <div className="text-black/50">
            {stylerProfile.stylerInformation?.businessAddress}
          </div>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Bio:</span>
          <p className="text-black/50">{stylerProfile.stylerInformation?.description}     </p>
        </div>
        <div className="mb-8 md:mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">500</p>
            <p className="text-sm text-black/50">Appointments</p>
          </div>
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">{stylerProfile?.ratingPercentage}</p>
            <p className="text-sm text-black/50">Success rate</p>
          </div>
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">500</p>
            <p className="text-sm text-black/50">Appointments</p>
          </div>
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">4.5</p>
            <p className="text-sm text-black/50">Average rating</p>
          </div>
        </div>
        {/* <div className="mb-8 md:mb-4">
          <span className="font-semibold">Venue health and safety rules:</span>
          <p className="text-black/50">
          Our barbershop prioritizes client and staff well-being through strict health and safety measures. Clients wear masks, maintain a six-foot distance, and use disposable items. We encourage appointment bookings, limit client waiting, and discourage accompanying guests. Regular health screenings and communication keep everyone informed.
          </p>
        </div> */}
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Services:</span>
          {
            stylerProfile.stylerSubService && stylerProfile.stylerSubService.length > 0 && (
              stylerProfile.stylerSubService.map((val, key) => {
                return (
                  <div key={key}>
                    <SelectService serviceName={val.name} servicePrice={val.price}  subServiceId={val.id} stylerId={stylerId}/>
                  </div>
                )
              })
            )
          }

        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Portfolio:</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {stylerProfile.stylerPortfolio && stylerProfile.stylerPortfolio.length > 0 && (
              stylerProfile.stylerPortfolio.map((val, key) => {
                return (
                  <div key={key}>
                    <img
                      src={val.imageUrl}
                      alt={val.name}
                      className="aspect-square rounded-md object-cover"
                    />
                  </div>
                )
              })
            )}

          </div>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Reviews:</span>
          <div className="mt-4 bg-brand p-4 rounded-md flex gap-3">
            <div className="text-white font-medium">star</div>
            <div className="text-white/50">
              <span>4.0</span>(out of 5) - Based on<span> 419</span> reviews
            </div>
          </div>
          {
            stylerProfile.stylerReviews && stylerProfile.stylerReviews.length > 0 &&(
              stylerProfile.stylerReviews.map((val, key) => {
                return (
                  <div className="py-4 border-b" key={key}>
                  <div className="flex justify-between items-center font-semibold">
                    <span>{val.userName}</span>
                    <span className="text-brand">{val.ratingScore}</span>
                  </div>
                  <p className="text-black/50">{val.message}</p>
                </div>
                )
              })
            )
          }

  
        </div>
      </div>
    </div>
  );
};

export default StylistProfile;
