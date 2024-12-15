import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/generalPages/landing';
import ElevateLooks from './pages/generalPages/elevateYourLooks';
import AboutUs from './pages/generalPages/aboutUs';
import PersonalDetails from './pages/users/auth/personalDetails';
import SecureAccount from './pages/users/auth/secureAccount';
import UserLayout from './pages/users/userLayout';
import { ToastContainer } from 'react-toastify';
import VerifyUserEmailAddress from './pages/users/auth/verifyEmailAddress';
import StylerSignUp from './pages/styler/stylerSignUp/stylerSignUp';
import StylerPersonalDetails from './pages/styler/stylerSignUp/personalDetails';
import BusinessDetails from './pages/styler/stylerSignUp/businessDetails';
import CreatePassword from './pages/styler/stylerSignUp/createPassword';
import StylerLayout from './pages/styler/stylerLayout/stylerLayout';
import StylerDashboard from './pages/styler/stylerDashboard';
import StylerAppointments from './pages/styler/stylerAppointments';
import Services from './pages/styler/stylerServices';
import StylerProfile from './pages/styler/stylerProfile';
import UpdateCoverPhoto from './pages/styler/updateCoverPhoto';
import BusinessInformation from './pages/styler/updateBusinessInformation';
import PersonalInformation from './pages/styler/updatePersonalInformation';
import ChangePassword from './pages/styler/changePassword';
import Reviews from './pages/styler/reviews';

function App() {
  return (
    <div className='bg-[#f5f5f5] min-h-screen'>
      <ToastContainer position='top-center' theme='colored' newestOnTop={true} bodyClassName={() => 'toastBody flex items-center text-sm'}/>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/elevate-your-looks" element={<ElevateLooks />} />
        <Route path="/verifyEmailAddress" element={<VerifyUserEmailAddress />} />
        <Route path="/personalDetails" element={<PersonalDetails />} />
        <Route path="/secureAccount" element={<SecureAccount />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path='/styler-signup' element={<StylerSignUp />}>
          <Route index element={<StylerPersonalDetails />}/>
          <Route path='business-details' element={<BusinessDetails />}/>
          <Route path='secure-account' element={<CreatePassword />}/>
        </Route>
        <Route path='/styler-dashboard' element={<StylerLayout />} >
          <Route index element={<StylerDashboard />} />
          <Route path='appointments' element={<StylerAppointments />} />
          <Route path='services' element={<Services />} />
          <Route path='profile' element={<StylerProfile />} />
          <Route path='update-cover-photo' element={<UpdateCoverPhoto />} />
          <Route path='update-business-information' element={<BusinessInformation />} />
          <Route path='update-personal-information' element={<PersonalInformation />} />
          <Route path='update-password' element={<ChangePassword />} />
          <Route path='reviews' element={<Reviews />} />
        </Route>
        <Route path='*' element={<UserLayout/>}/>
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
