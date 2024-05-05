import { useEffect } from "react";
import Back from "../../../components/goBack";
import ServiceCard from "../../../components/serviceCard";

const SavedStylist = ({setPageTitle}) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Saved Stylist - Rapid Styler";
  }));
  return (
    <div className="bg-white rounded-lg border">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Saved stylists.</span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ServiceCard 
          coverImg={"https://img.freepik.com/free-photo/comfortable-old-fashioned-chair-rustic-antique-elegance-indoors-generated-by-ai_188544-29043.jpg?t=st=1704719864~exp=1704723464~hmac=ebf47550715304eb51ef6f999131714cc1009b54d24d54bb5e9802c8d9305e81&w=1060"}
          name={"Next barbing saloon"}
          rating={"4.19"}
          reviews={"419"}
          distance={"42km"}
        />
      </div>
    </div>
  );
};

export default SavedStylist;
