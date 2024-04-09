import bookmark from "../../../assets/svg-icons/bookmark.svg";
import SelectService from "../../../components/selectService";
import Back from "../../../components/goBack"

const StylistProfile = () => {
  document.title = "Book a service - TrimTech";

  return (
    <div className="bg-white border rounded-lg">
      <div className="flex items-center justify-between border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <div className="flex gap-2 items-center">
          <Back />
          <span>Cutting Edge Saloon</span>
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
            19 Osadebe Street, Ogui New Layout/43 Street, Achara Layout.
          </div>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Bio:</span>
          <p className="text-black/50">
            Achieve a fuller, thicker head of hair without going under the
            knife. We offer advanced non-surgical hair replacement solutions,
            including scalp micropigmentation and hair extensions, to address
            hair loss concerns efficiently and effectively.
          </p>
        </div>
        <div className="mb-8 md:mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">500</p>
            <p className="text-sm text-black/50">Appointments</p>
          </div>
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">89%</p>
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
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Venue health and safety rules:</span>
          <p className="text-black/50">
          Our barbershop prioritizes client and staff well-being through strict health and safety measures. Clients wear masks, maintain a six-foot distance, and use disposable items. We encourage appointment bookings, limit client waiting, and discourage accompanying guests. Regular health screenings and communication keep everyone informed.
          </p>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Services:</span>
          <SelectService />
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Portfolio:</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <img
              src="https://img.freepik.com/free-photo/ai-generated-cute-girl-pic_23-2150649916.jpg?t=st=1703594682~exp=1703598282~hmac=73526701750bbf321b834567f522149fc132a315987dd64567366c01a2be4836&w=360"
              alt=""
              className="aspect-square rounded-md object-cover"
            />
            <img
              src="https://img.freepik.com/free-photo/young-adult-woman-with-curly-brown-hair-smiling-generated-by-ai_188544-39044.jpg?t=st=1703595330~exp=1703598930~hmac=238e53df5c36bc1b7219af2f043fea17f6bb9eebcdb6ef11107f66f2719f0957&w=1060"
              alt=""
              className="aspect-square rounded-md object-cover"
            />
            <img
              src="https://img.freepik.com/free-photo/portrait-person-daily-life-new-york-city_23-2150820012.jpg?t=st=1703594718~exp=1703598318~hmac=eb7455451f857b4b11684113482fe85ab7182b74123ea6c781874420e26667cc&w=1060"
              alt=""
              className="aspect-square rounded-md object-cover"
            />
            <img
              src="https://img.freepik.com/free-photo/close-up-beautiful-girl-portrait_23-2150799905.jpg?t=st=1703594724~exp=1703598324~hmac=0a4b6d64e8377b4e9f5259f752476a627b156b51653fa76480baff4508c11947&w=740"
              alt=""
              className="aspect-square rounded-md object-cover"
            />
            <img
              src="https://img.freepik.com/free-photo/beautiful-fashion-model-with-long-curly-blond-hair-elegance-generated-by-artificial-intelligence_25030-62882.jpg?t=st=1703594727~exp=1703598327~hmac=0e889a84417724acfbadef154a79e9fba78a4e24abfbab6ee30a04e470533547&w=1060"
              alt=""
              className="aspect-square rounded-md object-cover"
            />
            <img
              src="https://img.freepik.com/free-photo/close-up-beautiful-girl-portrait_23-2150799885.jpg?t=st=1703590977~exp=1703594577~hmac=87441f4d6826feabf08c8b51120f0ec62748bb75a912236d8e56d5b547f03b9d&w=740"
              alt=""
              className="aspect-square rounded-md object-cover"
            />
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
          <div className="py-4 border-b">
            <div className="flex justify-between items-center font-semibold">
              <span>Nurudeen Faniyi:</span>
              <span className="text-brand">5.0</span>
            </div>
            <p className="text-black/50">
              I had the most amazing experience at this place! My stylist
              was absolutely incredible. They listened carefully to my wants and
              needs and created a hair style that was both flattering and
              manageable. The salon itself was clean, inviting, and relaxing. I
              will definitely be returning for all my future hair care needs!
            </p>
          </div>
          <div className="py-4 border-b">
            <div className="flex justify-between items-center font-semibold">
              <span>Akinyele Roqeeb:</span>
              <span className="text-brand">4.0</span>
            </div>
            <p className="text-black/50">
              I highly recommend Cutting edge saloon to anyone looking for a great hair
              salon. They are truly a top-notch establishment!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylistProfile;
