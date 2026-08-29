import { useLocation } from "react-router-dom";
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
import UpdateInformation from "../pages/updatePersonal";
import SavedStylist from "../pages/savedStylists";
import ChangePassword from "../pages/changePassword";
import NotificationSettings from "../pages/notificationSettings";
import Feedback from "../pages/feedback";
import SearchStyler from "../pages/searchStylers";
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
    // The customer area mounts this shell at each flat URL (App.js), so an
    // inner <Routes> can never match — React Router consumes the matched path
    // prefix, leaving the dashboard routes unreachable (everything fell to
    // NotFound). Resolve the page directly from the current pathname instead.
    const { pathname } = useLocation();
    const page = (() => {
        switch (pathname) {
            case "/dashboard": return <Dashboard setPageTitle={setPageTitle} />;
            case "/bookAppointment": return <BookAppointment setPageTitle={setPageTitle} setStylerSearchName={setStylerSearchName} />;
            case "/accountSettings": return <AccountSettings setPageTitle={setPageTitle} />;
            case "/updatePersonalInformation": return <UpdateInformation setPageTitle={setPageTitle} />;
            case "/savedStylist": return <SavedStylist setPageTitle={setPageTitle} />;
            case "/changePassword": return <ChangePassword setPageTitle={setPageTitle} />;
            case "/notificationSettings": return <NotificationSettings setPageTitle={setPageTitle} />;
            case "/notifications": return <Notifications setPageTitle={setPageTitle} />;
            case "/support": return <Support setPageTitle={setPageTitle} />;
            case "/loyalty": return <Loyalty setPageTitle={setPageTitle} />;
            case "/feedback": return <Feedback setPageTitle={setPageTitle} />;
            case "/searchAStyler": return <SearchStyler setPageTitle={setPageTitle} stylerSearchName={stylerSearchName} />;
            case "/signOut": return <LogOut />;
            default: return <NotFound />;
        }
    })();
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
                            {page}
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