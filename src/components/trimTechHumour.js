import icon from "../assets/svg-icons/trimtech-humour.svg"

const Humour = () => {
    return ( 
        <div className="bg-brand rounded-md px-4 py-10 md:py-6 flex items-center">
          <div className="grid gap-4 text-center">
          <img src={icon} alt="" className="justify-self-center" />
            <p className="mb-0 pb-0">
              <span className="text-white text-sm">The barber just opened a restaurant, but the only thing on the menu is haircuts</span> <br />
              <span className="text-sm text-white/60">- <br />punpress.com/barbers-puns/</span>
            </p>
          </div>
        </div>
     );
}
 
export default Humour;