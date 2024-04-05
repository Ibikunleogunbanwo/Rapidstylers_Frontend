const Advert = () => {
    return ( 
        <div className=" bg-[#1d1d1d] text-white rounded-md">
          <p className="p-4">Advertisement:</p>
          <div className="px-1 rounded-sm h-[160px] overflow-hidden">
            <img src="https://img.freepik.com/free-photo/charging-station-powering-up-electric-car_157027-3485.jpg?t=st=1703707040~exp=1703710640~hmac=c524b60c959d65ee1c36b192a0842dffae1139cb89fd709b95dff839791f4248&w=1060" alt="" className="object-cover h-[160px] w-full rounded-md" />
          </div>
          <div className="p-4">
            <p className=" capitalize">Find your perfect fit: used cars at unbeatable prices:</p>
            <p className="lg:text-sm text-white/50">Shop from home and schedule test drives online</p>
          </div>
          <div className="p-4 mb-4">
            <span className="py-4 px-6 bg-white text-black rounded-md text-sm font-semibold">Shop now!</span>
          </div>
        </div>
     );
}
 
export default Advert;

// bg-[#37474F]