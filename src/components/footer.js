import logo from "../assets/svg-icons/logo.svg";
import instagram from "../assets/svg-icons/instagram.svg";
import x from "../assets/svg-icons/x.svg";
import Input from "./input";
import mockup from "../assets/images/Mockup.svg";
import playstore from "../assets/images/google_play-en-us.svg";
import appstore from "../assets/images/app_store_en-us.svg";


const Footer = () => {
  const currentYear = new Date().getFullYear()
    return ( 
        <div className="bg-black text-white">
          <div className="px-4 md:px-[100px] bg-black border-b border-[#c4c4c450] py-10">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
             <div className="col-span-1 lg:col-span-8 pe-0 lg:pe-32 text-center lg:text-start">
              <p className="text-3xl">Never miss an appointment!</p>
              <p className="text-[#c4c4c4]">Get easy access to professional styling services from our mobile app <span className="underline  decoration-2 text-brand font-medium">coming soon </span>to Android and IOS devices</p>
              <div className="flex justify-center lg:justify-start gap-4 mt-5">
                <img src={playstore} alt="" />
                <img src={appstore} alt="" />
              </div>
             </div>
             <div className="col-span-1 lg:col-span-4">
              <div className="w-full flex justify-center"><img src={mockup} alt="" className="" /></div>
             </div>
           </div>
          </div>
          <div className="px-4 md:px-[50px] py-12">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              <div className="col-span-1 lg:col-span-2">
                <div className="grid text-start">
                  <span className="text-lg font-semibold">Join our newsletter</span>
                  <span>Get access to resources on exchange rate, new features and more</span>
                  <div className="gap-3 mt-3 grid grid-cols-12 items-center">
                    <div className="col-span-9"><Input /></div>
                    <div className="col-span-3">
                      <button className="py-[18px] text-sm w-full bg-brand rounded-md text-white">Join!</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 lg:col-span-4 ps-0 lg:ps-10 pt-10 lg:pt-0">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  <div className="grid">
                    <p className="text-[15px]">Legal</p>
                    <div className="grid gap-2 mt-3 text-sm text-[#c4c4c4]">
                      <span>Terms and conditions</span>
                      <span>Privacy policy</span>
                    </div>
                  </div>
                  <div className="grid">
                    <p className="text-[15px]">Resources</p>
                    <div className="grid gap-2 mt-3 text-sm text-[#c4c4c4]">
                      <span>Blog</span>
                      <span>FAQs</span>
                      <span>Support</span>
                    </div>
                  </div>
                  <div className="grid">
                    <p className="text-[15px]">Company</p>
                    <div className="grid gap-2 mt-3 text-sm text-[#c4c4c4]">
                      <span>About Rapid Stylers</span>
                      <span>Register as a stylist</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 md:px-[50px] py-6 flex justify-between items-end">
            <div className="gap-2 grid grid-cols-1">
              <img src={logo} alt="" className="h-12"/>
              <span className="text-white/60">© {currentYear} RapidStylers. All rights reserved</span>
            </div>
            <div className="flex gap-4">
              <img src={instagram} alt="" />
              <img src={x} alt="" />
            </div>
          </div>
        </div>
     );
}
 
export default Footer;