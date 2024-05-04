import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/dashboard";
import UserTopBar from "./topBar";
import UserSideBar from "./sideBar";
import Humour from "../../../components/trimTechHumour";
import Advert from "../../../components/advert";
import { useState } from "react";
import { useSelector } from "react-redux";
import LogOut from "../auth/logout";
import BookAppointment from "../pages/bookAnAppointment";
const UserLayout = () => {
    const userSession = useSelector((state)=>state.user.userSessionData);
    const [sideBarVisibility, setSideBarVisibility] = useState(false);
    const [pageTitle, setPageTitle] = useState("");
    const toggleSideBar = () => {
        setSideBarVisibility(!sideBarVisibility);
    }
    const closeSideBar = () => {
        setSideBarVisibility(false);
    }
    if(!userSession){
        return <LogOut/>;
    }
    return (
        <div>
            <UserTopBar toggleSideBar={toggleSideBar} />
            <div className="grid grid-cols-1 lg:grid-cols-12 pt-[70px]">
                <div className="px-4 col-span-1 lg:col-span-2">
                    <UserSideBar sideBarVisibility={sideBarVisibility} sideBarTitle={pageTitle} closeSideBar={closeSideBar} />
                </div>
                <div className="p-2 col-span-1 lg:col-span-10">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                        <div className="col-span-1 lg:col-span-7">
                            <Routes>
                                <Route path="/dashboard" element={<Dashboard setPageTile={setPageTitle} />} />
                                <Route path="/bookAppointment" element={<BookAppointment setPageTile={setPageTitle}/>}/>
                                <Route path="/signOut" element={<LogOut/>}/>
                            </Routes>
                        </div>
                        <div className="col-span-1 lg:col-span-3">
                            <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-4 p-4 md:p-0">
                                <Humour />
                                <Advert />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserLayout;