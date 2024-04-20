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
        <Route path='*' element={<UserLayout/>}/>
      </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;
