import { Link } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import close from "../../../assets/svg-icons/closeBlack.svg";

const UserSideBar = ({ sideBarVisibility, sideBarTitle, closeSideBar }) => {
    return (
        <div>
            {/* Desktop */}
            <div className="hidden md:block">
            <div className="grid gap-10 pt-8 pb-14 px-8 lg:px-0 text-sm font-medium fixed bg-white lg:bg-transparent">
                <div> 
                    <Link to="/dashboard" className={`py-4 px-4 rounded-md ${sideBarTitle === "Dashboard"
                                ? "bg-brand text-white cursor-default"
                                : "cursor-pointer"}`}>Dashboard</Link>
                </div>
                <div> 
                    <Link to="/dashboard" className={`py-4 px-4 rounded-md ${sideBarTitle === "/dashboard"
                                ? "bg-brand text-white cursor-default"
                                : "cursor-pointer"}`}>Book an Appointment</Link>
                </div>
                <div> 
                    <Link to="/dashboard" className={`py-4 px-4 rounded-md ${sideBarTitle === "/dashboard"
                                ? "bg-brand text-white cursor-default"
                                : "cursor-pointer"}`}>Account Settings</Link>
                </div>
                <div> 
                    <Link to="/dashboard" className={`py-4 px-4 rounded-md ${sideBarTitle === "/dashboard"
                                ? "bg-brand text-white cursor-default"
                                : "cursor-pointer"}`}>UserFeedbacks</Link>
                </div>
           </div>
            </div>
    
            {/* Mobile */}
            <div className={`w-full fixed rounded-md md:hidden ${sideBarVisibility ? "block" : "hidden"}`}>
                <div className="bg-white p-8 m-2 rounded-md h-full shadow-md">
                    <div className="flex justify-between">
                        <img src={logo} alt="" className="h-10" />
                        <img src={close} alt="" onClick={closeSideBar} className="h-5" />
                    </div>
                    <div className="grid gap-6 mt-8 ">
                        <div onClick={closeSideBar}>
                            <Link to="/dashboard" className={`py-4 rounded-md ${sideBarTitle === "Dashboard"
                                ? "text-brand cursor-default font-medium"
                                : "cursor-pointer text-black/50"}`}> Dashboard</Link>
                        </div>
                        <div onClick={closeSideBar}>
                            <Link to="/dashboard/book-appointment" className={`py-4 rounded-md ${sideBarTitle === "/dashboard/book-appointment"
                                ? "text-brand cursor-default font-medium"
                                : "cursor-pointer text-black/50"}`}>Book an appointment</Link>
                        </div>
                        <div onClick={closeSideBar}>
                            <Link to="/dashboard/account-settings" className={`py-4 rounded-md ${sideBarTitle === "/dashboard/account-settings"
                                ? "text-brand cursor-default font-medium"
                                : "cursor-pointer text-black/50"}`}>Account settings</Link>
                        </div>
                        <div onClick={closeSideBar}>
                            <Link to="/dashboard/feedback" className={`py-4 rounded-md ${sideBarTitle === "/dashboard/feedback"
                                ? "text-brand cursor-default font-medium"
                                : "cursor-pointer text-black/50"}`}> Feedback</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserSideBar;