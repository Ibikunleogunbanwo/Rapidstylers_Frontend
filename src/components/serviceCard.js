// import star from "../assets/svg-icons/star.svg"

const ServiceCard = ({coverImg, name, rating, reviews, status, distance }) => {
    return ( 
        <div className="rounded-lg overflow-hidden border px-1 pt-1 pb-3 bg-white">
          <div className="h-[250px] md:h-[170px] overflow-hidden rounded-t-lg">
            <img src={coverImg} alt="" className="object-cover w-full h-full hover:scale-125 transition-all" />
          </div>
          <p className="font-semibold truncate text-sm my-3 px-3">{name}</p>
          <div className="grid grid-cols-2 gap-3 px-3">
            <div>
              <p className="text-sm text-slate-400">Status:</p>
              <p className={`text-xs font-bold ${status === "Online" ? 'text-green-700':'text-red-700' }`}>{status}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Average rating:</p>
              <p className="text-xs"><span className="font-bold">{rating} <span className="text-black/50">({reviews} reviews)</span></span></p>
            </div>
          </div>
          {distance != null && (
            <div className="px-3 mt-2">
              <span className="text-[11px] text-brand font-medium">📍 {distance} km away</span>
            </div>
          )}
        </div>
     );
}
 
export default ServiceCard;