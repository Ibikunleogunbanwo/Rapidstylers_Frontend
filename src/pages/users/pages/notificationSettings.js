import Back from "../../../components/goBack";

const NotificationSettings = () => {
  document.title = "Notification settings - TrimTech";
  return (
    <div className="bg-white rounded-lg border">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Notification settings.</span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2 mb-2">
          <p className="font-semibold">Send me email notifications when:</p>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" name="" id=""/>
            <span className="mb-[2px]">Appointment is approved</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="" id=""/>
            <span className="mb-[2px]">Appointment is cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="" id=""/>
            <span className="mb-[2px]">There is a new stylist in my location</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
