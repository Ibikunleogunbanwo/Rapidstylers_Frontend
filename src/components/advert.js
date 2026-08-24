import { Link } from "react-router-dom";

const Advert = () => {
  return (
    <div className="bg-[#1d1d1d] text-white rounded-2xl overflow-hidden shadow-md">
      <p className="px-4 pt-4 pb-2 text-[11px] uppercase tracking-[0.2em] text-white/50 font-semibold">
        Advertisement
      </p>
      <div className="px-1">
        <img
          src="https://img.freepik.com/free-photo/side-view-woman-styling-hair_23-2149659566.jpg?t=st=1708868604~exp=1708872204~hmac=a724d6651959e05a587b791dba7dbab024b8dc529d20566c14741d134583e345&w=826"
          alt="Woman styling her hair"
          className="object-cover h-[160px] w-full rounded-lg"
        />
      </div>
      <div className="p-4 pb-2">
        <p className="font-semibold capitalize leading-snug">
          Find your perfect fit: top beauty professionals near you
        </p>
        <p className="lg:text-sm text-white/50 mt-1">
          Book from home and enjoy in-home appointments
        </p>
      </div>
      <div className="p-4">
        <Link
          to="/bookAppointment"
          className="inline-block py-3 px-6 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 active:scale-[0.98] transition"
        >
          Book now!
        </Link>
      </div>
    </div>
  );
};

export default Advert;
