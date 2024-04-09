import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/generalPages/landing';
import ElevateLooks from './pages/generalPages/elevateYourLooks';
import Verify from './pages/users/auth/verifyOTP';
import AboutUs from './pages/generalPages/aboutUs';
import PersonalDetails from './pages/users/auth/personalDetails';
import SecureAccount from './pages/users/auth/secureAccount';
import UserLayout from './pages/users/userLayout';

function App() {
  return (
    <div className='bg-[#f5f5f5] min-h-screen'>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/elevate-your-looks" element={<ElevateLooks />} />
        <Route path="/secure-account" element={<SecureAccount />} />
        <Route path="/verify-otp" element={<Verify />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path='*' element={<UserLayout/>}/>
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
