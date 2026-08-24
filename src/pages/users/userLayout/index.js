import { Routes, Route } from "react-router-dom";
import NotFound from "../../generalPages/notFound";
import Dashboard from "../pages/dashboard";
import UserTopBar from "./topBar";
import UserSideBar from "./sideBar";
import Humour from "../../../components/rapidStylerHumour";
import Advert from "../../../components/advert";
import { useState } from "react";
import { useSelector } from "react-redux";
import LogOut from "../auth/logout";
import BookAppointment from "../pages/bookAnAppointment";
import Stylist from "../pages/stylist";
import StylistProfile from "../pages/stylistProfile";
import UpdateInformation from "../pages/updatePersonal";
import SavedStylist from "../pages/savedStylists";
import ChangePassword from "../pages/changePassword";
import NotificationSettings from "../pages/notificationSettings";
import Feedback from "../pages/feedback";
import SearchStyler from "../pages/searchStylers";
import CardDetails from "../pages/cardDetails";
import AccountSettings from "../pages/accountsettings";
import Notifications from "../pages/notifications";
import Support from "../pages/support";
import Loyalty from "../pages/loyalty";

const UserLayout = () => {
    const userSession = useSelector((state)=>state.user.userSessionData);
    const [sideBarVisibility, setSideBarVisibility] = useState(false);
    const [pageTitle, setPageTitle] = useState("");
    const [stylerSearchName, setStylerSearchName] = useState("");
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
                                <Route path="/dashboard" element={<Dashboard setPageTitle={setPageTitle} />} />
                                <Route path="/bookAppointment" element={<BookAppointment setPageTitle={setPageTitle} setStylerSearchName={setStylerSearchName}/>}/>
                                <Route path="/stylist/:stylerTypeId/:stylerTypeName" element={<Stylist setPageTitle={setPageTitle}/>}/>
                                <Route path="/stylistProfile/:stylerId/:stylerName" element={<StylistProfile setPageTitle={setPageTitle}/>}/>
                                <Route path="/accountSettings" element={<AccountSettings setPageTitle={setPageTitle}/>}/>
                                <Route path="/updatePersonalInformation" element={<UpdateInformation setPageTitle={setPageTitle}/>}/>
                                <Route path="/savedStylist" element={<SavedStylist setPageTitle={setPageTitle}/>}/>
                                <Route path="/changePassword" element={<ChangePassword setPageTitle={setPageTitle}/>}/>
                                <Route path="/CardDetails" element={<CardDetails setPageTitle={setPageTitle}/>}/>
                                <Route path="/notificationSettings" element={<NotificationSettings setPageTitle={setPageTitle}/>}/>
                                <Route path="/notifications" element={<Notifications setPageTitle={setPageTitle}/>}/>
                                <Route path="/support" element={<Support setPageTitle={setPageTitle}/>}/>
                                <Route path="/loyalty" element={<Loyalty setPageTitle={setPageTitle}/>}/>
                                <Route path="/feedback" element={<Feedback setPageTitle={setPageTitle}/>}/>
                                <Route path="/searchAStyler" element={<SearchStyler setPageTitle={setPageTitle} stylerSearchName={stylerSearchName}/>}/>
                                <Route path="/signOut" element={<LogOut/>}/>
                                <Route path="*" element={<NotFound />} />
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