import { useLocation, Navigate, useNavigate } from "react-router-dom";
import NotFound from "../../generalPages/notFound";
import Dashboard from "../pages/dashboard";
import UserTopBar from "./topBar";
import UserSideBar from "./sideBar";
import Advert from "../../../components/advert";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LogOut from "../auth/logout";
import { userLogOut } from "../../../hooks/local/userReducer";
import { setIntendedRoute, getAuthToken, getUserRole, isAdminOwner } from "../../../utils/constant";
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
import MyQuotes from "../pages/myQuotes";
import { StylistList } from "../pages/stylist";
import { useUnreadNotifications } from "./unreadNotifications";

const UserLayout = () => {
    const userSession = useSelector((state)=>state.user.userSessionData);
    const [sideBarVisibility, setSideBarVisibility] = useState(false);
    const [pageTitle, setPageTitle] = useState("");
    const [stylerSearchName, setStylerSearchName] = useState("");
    const menuButtonRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // Set in the same render as the logout, so the guard below sends the
    // person home instead of to /login with this page remembered.
    const [signedOut, setSignedOut] = useState(false);
    // Sign out is a button running the logout action (never a GET link
    // another site could point at). /signOut still works for old links, but
    // only asks: the same action runs when its Sign out button is pressed.
    const signOut = () => {
        setSignedOut(true);
        dispatch(userLogOut());
        navigate("/", { replace: true });
    };
    const toggleSideBar = () => {
        setSideBarVisibility(!sideBarVisibility);
    }
    const closeSideBar = () => {
        menuButtonRef.current?.focus();
        setSideBarVisibility(false);
    }
    // The customer area mounts this shell at each flat URL (App.js), so an
    // inner <Routes> can never match — React Router consumes the matched path
    // prefix, leaving the dashboard routes unreachable (everything fell to
    // NotFound). Resolve the page directly from the current pathname instead.
    const { pathname } = useLocation();
    const unreadNotifications = useUnreadNotifications(pathname);
    const showDiscoveryCard = pathname === "/dashboard";
    const page = (() => {
        switch (pathname) {
            case "/dashboard": return <Dashboard setPageTitle={setPageTitle} />;
            case "/bookAppointment": return <BookAppointment setPageTitle={setPageTitle} setStylerSearchName={setStylerSearchName} />;
            case "/accountSettings": return <AccountSettings setPageTitle={setPageTitle} />;
            case "/updatePersonalInformation": return <UpdateInformation setPageTitle={setPageTitle} />;
            case "/savedStylist": return <SavedStylist setPageTitle={setPageTitle} />;
            case "/myQuotes": return <MyQuotes setPageTitle={setPageTitle} />;
            case "/changePassword": return <ChangePassword setPageTitle={setPageTitle} />;
            case "/notificationSettings": return <NotificationSettings setPageTitle={setPageTitle} />;
            case "/notifications": return <Notifications setPageTitle={setPageTitle} />;
            case "/support": return <Support setPageTitle={setPageTitle} />;
            case "/loyalty": return <Loyalty setPageTitle={setPageTitle} />;
            case "/feedback": return <Feedback setPageTitle={setPageTitle} />;
            case "/searchAStyler": return <SearchStyler setPageTitle={setPageTitle} stylerSearchName={stylerSearchName} />;
            case "/signOut": return <LogOut setPageTitle={setPageTitle} onConfirm={signOut} onCancel={() => navigate("/dashboard")} />;
            default:
                // A service's professional list (/stylist/:id/:name), kept inside
                // the dashboard for a signed-in customer (see pages/stylistRoute).
                if (pathname.startsWith("/stylist/")) return <StylistList setPageTitle={setPageTitle} />;
                return <NotFound />;
        }
    })();
    // Signed-out visitors on a customer route are sent to /login (remembering
    // the page they wanted) so signing in returns them there — not bounced to
    // the public home page.
    const token = getAuthToken();
    const role = getUserRole();
    if (signedOut || (!token && pathname === "/signOut")) {
        return <Navigate to="/" replace />;
    }
    if (token && role !== "CUSTOMER") {
        return <Navigate to={role === "STYLER" ? "/styler-dashboard" : role === "ADMIN" ? (isAdminOwner() ? "/admin/categories" : "/admin") : "/login"} replace />;
    }
    if(!token || !userSession){
        setIntendedRoute(pathname);
        return <Navigate to="/login" replace />;
    }
    return (
        <div>
            <UserTopBar toggleSideBar={toggleSideBar} menuOpen={sideBarVisibility} menuButtonRef={menuButtonRef} account={userSession} onSignOut={signOut} />
            <div className="grid grid-cols-1 lg:grid-cols-12 pt-[70px]">
                <div className="px-4 col-span-1 lg:col-span-2">
                    <UserSideBar sideBarVisibility={sideBarVisibility} sideBarTitle={pageTitle} closeSideBar={closeSideBar} onSignOut={signOut} unreadNotifications={unreadNotifications} />
                </div>
                <div className="p-2 col-span-1 lg:col-span-10">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                        <div className={showDiscoveryCard ? "col-span-1 lg:col-span-7" : "col-span-1 lg:col-span-10"}>
                            {page}
                        </div>
                        {showDiscoveryCard && <div className="col-span-1 lg:col-span-3">
                            <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-4 p-4 md:p-0">
                                <Advert />
                            </div>
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserLayout;
