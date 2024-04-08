import { Link } from "react-router-dom";
// import arrow from "../assets/svg-icons/black-arrow.svg"
import ServiceCard from "../../../components/serviceCard";
import Back from "../../../components/goBack";

const Hairstylist = () => {
  document.title="Select a stylist - TrimTech"
  return (
    <div className="bg-white border rounded-lg">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Hairstylists.</span>
      </div>
      <div className="p-4">
        <p className="text-black/50 mb-4 text-sm font-medium">Suggested stylists based on your location:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={"/dashboard/stylist-profile"}>
          <ServiceCard 
            coverImg={"https://img.freepik.com/free-photo/stylist-woman-taking-care-her-client-afro-hair_23-2149259367.jpg?w=900&t=st=1704030929~exp=1704031529~hmac=7861cebf8cf782ab846ca8f5ffb75aa6e54176927081386eed4e5e18020a05cc"}
            name={"Cutting Edge Saloon"}
            distance={"24km"}
            rating={"5.0"}
            reviews={"200"}
          />
          </Link>
          <ServiceCard 
            coverImg={"https://img.freepik.com/free-photo/woman-getting-her-hair-done-salon_23-2148976118.jpg?w=740&t=st=1704032436~exp=1704033036~hmac=c8f075f828c0a07ce84221708155d8ba8a225c3fd0a390dcdf6e83cdaab1f815"}
            name={"Shear Elegance Saloon"}
            distance={"24km"}
            rating={"5.0"}
            reviews={"200"}
          />
          <ServiceCard 
            coverImg={"https://img.freepik.com/premium-photo/female-beautiful-hairstylist_63106-680.jpg?w=740"}
            name={"Glamour Locks Salon"}
            distance={"24km"}
            rating={"5.0"}
            reviews={"200"}
          />
          <ServiceCard 
            coverImg={"https://img.freepik.com/premium-photo/working-as-barber_891336-4454.jpg?w=826"}
            name={"Hair Haven"}
            distance={"24km"}
            rating={"5.0"}
            reviews={"200"}
          />
        </div>

        <button className="bg-brand text-white py-3 px-6 rounded-md mt-6 md:text-sm">Load more stylists</button>
        
      </div>
    </div>
  );
};

export default Hairstylist;
