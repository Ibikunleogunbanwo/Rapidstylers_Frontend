import { Link } from "react-router-dom";

const Error = () => {
    return ( 
        <div className="h-screen bg-red-500 text-white text-center grid place-items-center">
            <div>
              <p className=" font-semibold text-3xl mb-6">Something went wrong</p>
              <Link to={"/"} className="underline">Back to Home</Link>
            </div>
        </div>
     );
}
 
export default Error;