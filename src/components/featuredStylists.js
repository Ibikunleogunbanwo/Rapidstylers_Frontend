import ServiceCard from "./serviceCard";
// import illustration from "../assets/images/hairdresser team-cuate.svg"
import React, { useState } from 'react';

const Featured = () => {
  const [selectedOption, setSelectedOption] = useState('barbers');

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const idleStylist = "bg-white/50 text-brand border border-brand py-3 px-6 rounded-md text-xs cursor-pointer"
  const activeStylist = "m-0 bg-brand text-white py-3 px-6 rounded-md text-xs cursor-pointer";

    return ( 
        <div className="px-4 md:px-[50px]">
          <p className="mb-4 text-3xl">Discover professionals.</p>
          <div className="flex gap-2 mb-4 text-sm font-medium">
            <span
             className={`${selectedOption === 'barbers' ? 'active' + activeStylist : idleStylist}`}
             onClick={() => handleOptionClick('barbers')} 
            >
              Barbers
            </span>
            <span
             className={`${selectedOption === 'hairdressers' ? 'active' + activeStylist : idleStylist}`}
             onClick={() => handleOptionClick('hairdressers')}
            >
              Hairdressers
            </span>
          </div>
          <div style={{ display: selectedOption === 'barbers' ? 'block' : 'none' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ServiceCard 
              coverImg={"https://img.freepik.com/free-photo/two-male-customers-enjoy-expert-barber-skills-generated-by-ai_188544-29058.jpg?t=st=1703431462~exp=1703435062~hmac=4ab38af8ec130447954f031d023986f44cc8c48204321d495a2ebcbdad876011&w=1060"}
              name={"Flawless Fades"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
              <ServiceCard 
              coverImg={"https://img.freepik.com/free-photo/comfortable-old-fashioned-chair-rustic-antique-elegance-indoors-generated-by-ai_188544-29043.jpg?t=st=1703442032~exp=1703445632~hmac=196b4afc7a365ea2c3b579b3cf7046236cb78c72c27d06e89422b7d2ee1c1371&w=1060"}
              name={"Elon barbing unit"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
              <ServiceCard
              coverImg={"https://img.freepik.com/premium-photo/working-as-barber_891336-4311.jpg?w=826"}
              name={"Barbershop name that is too looong to fit the row"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
              <ServiceCard 
              coverImg={"https://img.freepik.com/free-photo/young-african-american-man-visiting-barbershop_1157-47693.jpg?w=900&t=st=1703442117~exp=1703442717~hmac=48e916562ef2d1ddbfa14b08bbe9b96f21233ca061ee43e80754c544fc8a6d11"}
              name={"Barber soft - X"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
            </div>
          </div>
          <div style={{ display: selectedOption === 'hairdressers' ? 'block' : 'none' }}>
            {/* <div className="flex justify-center p-4">
              <div className="text-center grid">
                <img src={illustration} alt="" className="h-40 justify-self-center"/>
                <p className="font-semibold">There are currently no rated <span className="text-brand">Hairdressers</span></p>
                <p className="text-sm text-black/50">Stylists with the highest ratings will appear here for greater exposure.</p>
              </div>
            </div> */}
            <div  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ServiceCard 
              coverImg={"https://img.freepik.com/free-photo/woman-washing-head-hairsalon_1157-27179.jpg?w=826&t=st=1708858397~exp=1708858997~hmac=94b475a47b6b9ca354ee5f2e0eff696d4a212106f4fb464ece7fd1faaf5a84f1"}
              name={"Flawless Hair-Salon"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
              <ServiceCard 
              coverImg={"https://img.freepik.com/free-photo/woman-washing-head-hairsalon_1157-27179.jhttps://img.freepik.com/premium-photo/african-american-hairdresser-working-with-dreadlocks-salon_795422-9612.jpg?w=1060"}
              name={"Flawless Hair-Salon"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
              <ServiceCard 
              coverImg={"https://img.freepik.com/premium-photo/female-beautiful-hairstylist_63106-680.jpg?w=740"}
              name={"Flawless Hair-Salon"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
              <ServiceCard 
              coverImg={"https://img.freepik.com/premium-photo/style-revolution-portrait-stylist-creating-new-looks_890580-2783.jpg?w=900"}
              name={"Flawless Hair-Salon"}
              distance={"24km"}
              rating={"5.0"}
              reviews={"419"}
              />
            </div>
          </div>
      </div>
     );
}
 
export default Featured;