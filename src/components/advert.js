const Advert = () => {
    return ( 
        <div className=" bg-[#1d1d1d] text-white rounded-md">
          <p className="p-4">Advertisement:</p>
          <div className="px-1 rounded-sm h-[160px] overflow-hidden">
            <img src="https://img.freepik.com/free-photo/side-view-woman-styling-hair_23-2149659566.jpg?t=st=1708868604~exp=1708872204~hmac=a724d6651959e05a587b791dba7dbab024b8dc529d20566c14741d134583e345&w=826" alt="" className="object-cover h-[160px] w-full rounded-md" />
          </div>
          <div className="p-4">
            <p className=" capitalize">Find your perfect fit: top beauty professionals near you</p>
            <p className="lg:text-sm text-white/50">Book from home and enjoy in-home appointments</p>
          </div>
          <div className="p-4 mb-4">
            <span className="py-4 px-6 bg-white text-black rounded-md text-sm font-semibold">Book now!</span>
          </div>
        </div>
     );
}
 
export default Advert;

// bg-[#37474F]