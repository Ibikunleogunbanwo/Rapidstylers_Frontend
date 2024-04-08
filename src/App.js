import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/landing';
import ElevateLooks from './pages/generalPages/elevateYourLooks';
import Dashboard from './pages/users/pages/dashboard';
import Layout from './pages/users/userLayout/layout';
import BookAppointment from './pages/users/pages/bookAnAppointment';
import Hairstylist from './pages/users/pages/stylist';
import Error from './pages/error';
import StylistProfile from './pages/stylistProfile';
import AccountSettings from './pages/users/pages/accountsettings';
import UpdateInformation from './pages/users/pages/updatePersonal';
import ChangePassword from './pages/users/pages/changePassword';
import SavedStylist from './pages/users/pages/savedStylists';
import NotificationSettings from './pages/users/pages/notificationSettings';
import PaymentDetails from './pages/users/pages/paymentDetails';
import Feedback from './pages/users/pages/feedback';
import CreateAccountAdmin from './admin/create-account';
import AdminLayout from './admin/admin-layout';
import AdminDashboard from './admin/dashboard';
import Verify from './pages/users/auth/verifyOTP';
import AboutUs from './pages/generalPages/aboutUs';
import Personaldetails from './pages/users/auth/personalDetails';
import SecureAccount from './pages/users/auth/secureAccount';

function App() {
  return (
    <div className='bg-[#f5f5f5] min-h-screen'>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/elevate-your-looks" element={<ElevateLooks />} />
        <Route path="/secure-account" element={<SecureAccount />} />
        <Route path="/verify-otp" element={<Verify />} />
        <Route path="/personal-details" element={<Personaldetails />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/dashboard" element={<Layout />} >
          <Route path="" element={<Dashboard />} />
          <Route path="book-appointment" element={<BookAppointment />} />
          <Route path="choose-stylist" element={<Hairstylist />} />
          <Route path="stylist-profile" element={<StylistProfile />} />
          <Route path="account-settings" element={<AccountSettings />} />
          <Route path="update-personal-information" element={<UpdateInformation />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="saved-stylists" element={<SavedStylist />} />
          <Route path="notification-settings" element={<NotificationSettings />} />
          <Route path="payment-details" element={<PaymentDetails />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />} >
          <Route path="" element={<AdminDashboard />} />
        </Route>
        <Route path='/admin-create-account' element={<CreateAccountAdmin />}/>
        <Route path="*" element={<Error />} />
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
