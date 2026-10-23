import PublishedSeo from "./components/publishedSeo";
import React, { lazy, Suspense } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { LocationProvider } from './context/LocationContext';
import ScrollToTop from './components/scrollToTop';
import IdleTimeout from './components/IdleTimeout';
import DemoMode from './components/demoMode';
import CustomerRoleRedirect from './components/customerRoleRedirect';
import { OwnerOnly } from './pages/admin/adminAccess';

const SiteContent = lazy(() => import('./pages/admin/siteContent'));
const NewsletterAdmin = lazy(() => import('./pages/admin/newsletter'));
const ServiceAreas = lazy(() => import('./pages/admin/serviceAreas'));
const Promotions = lazy(() => import('./pages/admin/promotions'));
const SignupFunnel = lazy(() => import('./pages/admin/signupFunnel'));
const StylistLocationSettings = lazy(() => import('./components/stylistLocationSettings'));
const NewsletterConfirm = lazy(() => import('./pages/generalPages/newsletterLinks').then(module => ({default:module.NewsletterConfirm})));
const NewsletterUnsubscribe = lazy(() => import('./pages/generalPages/newsletterLinks').then(module => ({default:module.NewsletterUnsubscribe})));

const LandingPage = lazy(() => import('./pages/generalPages/landing'));
const Login = lazy(() => import('./pages/generalPages/login'));
const SearchResults = lazy(() => import('./pages/generalPages/searchResults'));
const ElevateLooks = lazy(() => import('./pages/generalPages/elevateYourLooks'));
const Blog = lazy(() => import('./pages/generalPages/blog'));
const BlogPost = lazy(() => import('./pages/generalPages/blogPost'));
const AboutUs = lazy(() => import('./pages/generalPages/aboutUs'));
const PersonalDetails = lazy(() => import('./pages/users/auth/personalDetails'));
const SecureAccount = lazy(() => import('./pages/users/auth/secureAccount'));
const UserLayout = lazy(() => import('./pages/users/userLayout'));
const VerifyUserEmailAddress = lazy(() => import('./pages/users/auth/verifyEmailAddress'));
const ResetPassword = lazy(() => import('./pages/users/auth/resetPassword'));
const StylerSignUp = lazy(() => import('./pages/styler/stylerSignUp/stylerSignUp'));
const StylerPersonalDetails = lazy(() => import('./pages/styler/stylerSignUp/personalDetails'));
const BusinessDetails = lazy(() => import('./pages/styler/stylerSignUp/businessDetails'));
const CreatePassword = lazy(() => import('./pages/styler/stylerSignUp/createPassword'));
const ImagesStep = lazy(() => import('./pages/styler/stylerSignUp/imagesStep'));
const StylerVerifyEmail = lazy(() => import('./pages/styler/stylerSignUp/stylerVerifyEmail'));
const StylerLayout = lazy(() => import('./pages/styler/stylerLayout/stylerLayout'));
const StylerDashboard = lazy(() => import('./pages/styler/stylerDashboard'));
const StylerAppointments = lazy(() => import('./pages/styler/stylerAppointments'));
const StylerCalendar = lazy(() => import('./pages/styler/stylerCalendar'));
const StylerAvailability = lazy(() => import('./pages/styler/stylerAvailability'));
const MyWork = lazy(() => import('./pages/styler/myWork'));
const StylerPayouts = lazy(() => import('./pages/styler/stylerPayouts'));
const Services = lazy(() => import('./pages/styler/stylerServices'));
const StylerProfile = lazy(() => import('./pages/styler/stylerProfile'));
const UpdateCoverPhoto = lazy(() => import('./pages/styler/updateCoverPhoto'));
const BusinessInformation = lazy(() => import('./pages/styler/updateBusinessInformation'));
const PersonalInformation = lazy(() => import('./pages/styler/updatePersonalInformation'));
const Reviews = lazy(() => import('./pages/styler/reviews'));
const StylerChangePassword = lazy(() => import('./pages/styler/stylerChangePassword'));
const StylerSupport = lazy(() => import('./pages/styler/stylerSupport'));
const StylerNotifications = lazy(() => import('./pages/styler/stylerNotifications'));
const StylerQuotes = lazy(() => import('./pages/styler/stylerQuotes'));
const AdminLogin = lazy(() => import('./pages/admin/adminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));
const ManageCategories = lazy(() => import('./pages/admin/manageCategories'));
const ManageBlog = lazy(() => import('./pages/admin/manageBlog'));
const ManageStylers = lazy(() => import('./pages/admin/manageStylers'));
const AdminOperations = lazy(() => import('./pages/admin/operations'));
const AdminPayments = lazy(() => import('./pages/admin/payments'));
const AdminRecovery = lazy(() => import('./pages/admin/recovery'));
const AdminAnnouncements = lazy(() => import('./pages/admin/announcements'));
const AdminBookingsPage = lazy(() => import('./pages/admin/bookings'));
const AdminAccounts = lazy(() => import('./pages/admin/adminAccounts'));
const PublicStylist = lazy(() => import('./pages/users/pages/stylistRoute'));
const PublicStylistProfile = lazy(() => import('./pages/users/pages/stylistProfile'));
const NotFound = lazy(() => import('./pages/generalPages/notFound'));
const TermsAndConditions = lazy(() => import('./pages/generalPages/termsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/generalPages/privacyPolicy'));
const Faqs = lazy(() => import('./pages/generalPages/faqs'));
const ContactSupport = lazy(() => import('./pages/generalPages/contactSupport'));

function App() {
  return (
    <div className='bg-[#f5f5f5] min-h-screen'>
      <ToastContainer
        className="rapidstylers-toasts"
        limit={2}
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        draggable
        pauseOnHover={false}
        theme="light"
      />
      <LocationProvider>
      <BrowserRouter>
      <DemoMode />
      <ScrollToTop />
      <PublishedSeo />
      <IdleTimeout />
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f5f5f5]">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />
            <p className="text-sm font-semibold text-gray-500">Loading RapidStylers…</p>
          </div>
        }
      >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/newsletter/confirm" element={<NewsletterConfirm />} />
        <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
        {/* Admin areas: a signed-in customer is sent to their dashboard. */}
        <Route element={<CustomerRoleRedirect area="admin" />}>
        <Route path="/admin/content" element={<OwnerOnly><SiteContent /></OwnerOnly>} />
        <Route path="/admin/newsletter" element={<OwnerOnly><NewsletterAdmin /></OwnerOnly>} />
        <Route path="/admin/service-areas" element={<OwnerOnly><ServiceAreas /></OwnerOnly>} />
        <Route path="/admin/promotions" element={<OwnerOnly><Promotions /></OwnerOnly>} />
        <Route path="/admin/signup-funnel" element={<OwnerOnly><SignupFunnel /></OwnerOnly>} />
        </Route>
        <Route path="/login" element={<Login />} />
        {/* The page the sign-in screen's "Forgot password?" link has always
            pointed at in its copy, and which the FAQ describes in detail. */}
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/elevate-your-looks" element={<ElevateLooks />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/verifyEmailAddress" element={<VerifyUserEmailAddress />} />
        <Route path="/personalDetails" element={<PersonalDetails />} />
        <Route path="/secureAccount" element={<SecureAccount />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        {/* Public discovery pages. Browsing professionals does not require an account. */}
        <Route path="/stylist/:stylerTypeId/:stylerTypeName" element={<PublicStylist />} />
        <Route path="/stylistProfile/:stylerId/:stylerName" element={<PublicStylistProfile />} />
        <Route path='/styler-signup' element={<StylerSignUp />}>
          <Route index element={<StylerPersonalDetails />}/>
          <Route path='verify-email' element={<StylerVerifyEmail />}/>
          <Route path='business-details' element={<BusinessDetails />}/>
          <Route path='photos' element={<ImagesStep />}/>
          <Route path='secure-account' element={<CreatePassword />}/>
        </Route>
        <Route path='/styler-dashboard' element={<CustomerRoleRedirect area="professionals"><StylerLayout /></CustomerRoleRedirect>} >
          <Route index element={<StylerDashboard />} />
          <Route path='appointments' element={<StylerAppointments />} />
          <Route path='quotes' element={<StylerQuotes />} />
          <Route path='appointment-locations' element={<StylistLocationSettings />} />
          <Route path='calendar' element={<StylerCalendar />} />
          <Route path='availability' element={<StylerAvailability />} />
          <Route path='my-work' element={<MyWork />} />
          <Route path='payouts' element={<StylerPayouts />} />
          <Route path='services' element={<Services />} />
          <Route path='profile' element={<StylerProfile />} />
          <Route path='update-cover-photo' element={<UpdateCoverPhoto />} />
          <Route path='update-business-information' element={<BusinessInformation />} />
          <Route path='update-personal-information' element={<PersonalInformation />} />
          <Route path='reviews' element={<Reviews />} />
          <Route path='change-password' element={<StylerChangePassword />} />
          <Route path='support' element={<StylerSupport />} />
          <Route path='notifications' element={<StylerNotifications />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<CustomerRoleRedirect area="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/categories" element={<OwnerOnly><ManageCategories /></OwnerOnly>} />
        <Route path="/admin/blog" element={<OwnerOnly><ManageBlog /></OwnerOnly>} />
        <Route path="/admin/stylers" element={<ManageStylers />} />
        <Route path="/admin/operations" element={<AdminOperations />} />
        <Route path="/admin/payments" element={<OwnerOnly managerTo={params => params.get("section") === "bookings" ? "/admin/bookings" : null}><AdminPayments /></OwnerOnly>} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/accounts" element={<OwnerOnly><AdminAccounts /></OwnerOnly>} />
        <Route path="/admin/recovery" element={<OwnerOnly><AdminRecovery /></OwnerOnly>} />
        <Route path="/admin/announcements" element={<OwnerOnly><AdminAnnouncements /></OwnerOnly>} />
        </Route>
        {/* Customer area. Only known account workflows mount the authenticated shell. */}
        <Route path="/dashboard/*" element={<UserLayout />} />
        <Route path="/bookAppointment" element={<UserLayout />} />
        <Route path="/accountSettings" element={<UserLayout />} />
        <Route path="/updatePersonalInformation" element={<UserLayout />} />
        <Route path="/savedStylist" element={<UserLayout />} />
        <Route path="/myQuotes" element={<UserLayout />} />
        <Route path="/changePassword" element={<UserLayout />} />
        <Route path="/notificationSettings" element={<UserLayout />} />
        <Route path="/notifications" element={<UserLayout />} />
        <Route path="/support" element={<UserLayout />} />
        <Route path="/loyalty" element={<UserLayout />} />
        <Route path="/feedback" element={<UserLayout />} />
        <Route path="/searchAStyler" element={<UserLayout />} />
        <Route path="/signOut" element={<UserLayout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </LocationProvider>
    </div>
  );
}

export default App;
