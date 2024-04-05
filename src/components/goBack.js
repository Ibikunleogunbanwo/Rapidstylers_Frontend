import arrow from "../assets/svg-icons/black-arrow-back.svg"

const Back = () => {
    const back = () => { window.history.back();};
    return ( 
        <div>
          <img src={arrow} alt="" onClick={back} className="h-5 mt-[2px] cursor-pointer" />
        </div>
     );
}
 
export default Back;