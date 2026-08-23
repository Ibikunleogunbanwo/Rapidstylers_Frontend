import icon from "../assets/svg-icons/trimtech-humour.svg"

const Humour = () => {
    return ( 
        <div className="bg-brand rounded-md px-4 py-10 md:py-6 flex items-center">
          <div className="grid gap-4 text-center">
          <img src={icon} alt="" className="justify-self-center" />
            <p className="mb-0 pb-0">
              <span className="text-white text-sm">They say you can't buy happiness, but a fresh style comes pretty close</span>
            </p>
          </div>
        </div>
     );
}
 
export default Humour;