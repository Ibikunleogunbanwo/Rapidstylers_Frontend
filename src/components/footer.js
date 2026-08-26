import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/svg-icons/logo.svg";
import instagram from "../assets/svg-icons/instagram.svg";
import x from "../assets/svg-icons/x.svg";
import Input from "./input";
import mockup from "../assets/images/Mockup.svg";
import playstore from "../assets/images/google_play-en-us.svg";
import appstore from "../assets/images/app_store_en-us.svg";
import { showSuccessToastMessage } from "../utils/constant";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const joinNewsletter = (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!value) {
      return;
    }
    showSuccessToastMessage("You are on the list. We will keep you posted.");
    setEmail("");
  };

  return (
    <div className="bg-black text-white">
      <div className="px-4 md:px-[100px] bg-black border-b border-white/10 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="col-span-1 lg:col-span-8 pe-0 lg:pe-32 text-center lg:text-start">
            <p className="text-3xl md:text-4xl font-bold tracking-tight">Never miss an appointment!</p>
            <p className="mt-3 text-white/70 leading-relaxed">
              Get easy access to professional styling services from our mobile
              app <span className="underline decoration-2 text-brand font-medium">coming soon</span> to
              Android and iOS devices
            </p>
            <div className="flex justify-center lg:justify-start gap-4 mt-6">
              <img src={playstore} alt="Google Play" className="h-11 md:h-12 w-auto opacity-80" />
              <img src={appstore} alt="App Store" className="h-11 md:h-12 w-auto opacity-80" />
            </div>
          </div>
          <div className="col-span-1 lg:col-span-4">
            <div className="w-full flex justify-center">
              <img src={mockup} alt="RapidStylers mobile app" className="max-w-[300px] md:max-w-[400px] w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 md:px-[50px] py-12">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">
          <div className="col-span-1 lg:col-span-2">
            <div className="grid text-start">
              <span className="text-lg font-semibold tracking-tight">Join our newsletter</span>
              <span className="mt-2 text-white/60 leading-relaxed">Get access to styling tips, new features and more</span>
              <form onSubmit={joinNewsletter} className="flex gap-3 mt-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Email address"
                    name="newsletterEmail"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 px-6 py-[13px] text-sm font-medium bg-brand rounded-md text-white hover:opacity-90 transition"
                >
                  Join!
                </button>
              </form>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-4 ps-0 lg:ps-10 pt-10 lg:pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="grid">
                <p className="text-[15px] font-semibold">Legal</p>
                <div className="grid gap-2 mt-3 text-sm text-white/60">
                  <Link to="/terms-and-conditions" className="hover:text-white transition">Terms and conditions</Link>
                  <Link to="/privacy-policy" className="hover:text-white transition">Privacy policy</Link>
                </div>
              </div>
              <div className="grid">
                <p className="text-[15px] font-semibold">Resources</p>
                <div className="grid gap-2 mt-3 text-sm text-white/60">
                  <Link to="/blog" className="hover:text-white transition">Blog</Link>
                  <Link to="/faqs" className="hover:text-white transition">FAQs</Link>
                  <Link to="/contact-support" className="hover:text-white transition">Support</Link>
                </div>
              </div>
              <div className="grid">
                <p className="text-[15px] font-semibold">Company</p>
                <div className="grid gap-2 mt-3 text-sm text-white/60">
                  <Link to="/about" className="hover:text-white transition">About RapidStylers</Link>
                  <Link to="/styler-signup" className="hover:text-white transition">Register as a stylist</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 md:px-[50px] py-6 flex justify-between items-end">
        <div className="gap-2 grid grid-cols-1">
          <Link to="/" aria-label="RapidStylers home">
            <img src={logo} alt="" className="h-12 hover:opacity-90 transition" />
          </Link>
          <span className="text-white/60">© {currentYear} RapidStylers. All rights reserved</span>
        </div>
        <div className="flex gap-4">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RapidStylers on Instagram"
          >
            <img src={instagram} alt="Instagram" className="hover:opacity-80 transition" />
          </a>
          <a
            href="https://x.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RapidStylers on X"
          >
            <img src={x} alt="X" className="hover:opacity-80 transition" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
