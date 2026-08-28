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
      {/* Coming soon — mobile app promo */}
      <div className="relative overflow-hidden px-4 md:px-[100px] bg-black border-b border-white/10 py-16 md:py-24">
        <div className="pointer-events-none absolute -top-40 -right-24 h-[420px] w-[420px] rounded-full bg-brand/20 blur-[120px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full bg-brand/10 blur-[110px]" aria-hidden="true" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="col-span-1 lg:col-span-8 pe-0 lg:pe-24 text-center lg:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" aria-hidden="true" />
              Coming soon
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              Never miss an appointment!
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Get easy access to professional styling services from our mobile app,
              delivered right to your phone on Android and iOS devices.
            </p>
            <div className="flex justify-center lg:justify-start gap-4 mt-8 flex-wrap">
              <a href="#newsletter" aria-label="Google Play coming soon" className="group flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-3 transition hover:border-brand/50 hover:bg-white/10 hover:shadow-lg hover:shadow-brand/20">
                <img src={playstore} alt="Google Play" className="h-6 w-auto" />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] uppercase tracking-wide text-white/50">Coming soon</span>
                  <span className="block text-sm font-semibold">Google Play</span>
                </span>
              </a>
              <a href="#newsletter" aria-label="App Store coming soon" className="group flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-3 transition hover:border-brand/50 hover:bg-white/10 hover:shadow-lg hover:shadow-brand/20">
                <img src={appstore} alt="App Store" className="h-6 w-auto" />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] uppercase tracking-wide text-white/50">Coming soon</span>
                  <span className="block text-sm font-semibold">App Store</span>
                </span>
              </a>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-4">
            <div className="relative w-full flex justify-center">
              <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-[80px]" aria-hidden="true" />
              <img src={mockup} alt="RapidStylers mobile app" className="relative max-w-[280px] md:max-w-[360px] w-full h-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter + links */}
      <div id="newsletter" className="px-4 md:px-[50px] py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
          <div className="col-span-1 lg:col-span-2">
            <div className="grid text-start">
              <h3 className="text-lg font-semibold tracking-tight">Join our newsletter</h3>
              <span className="mt-2 text-white/60 leading-relaxed max-w-xs">Get access to styling tips, new features and more</span>
              <form onSubmit={joinNewsletter} className="flex gap-3 mt-5 items-center">
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
                  className="shrink-0 px-6 py-[13px] text-sm font-semibold bg-brand rounded-md text-white hover:bg-brand/85 transition shadow-lg shadow-brand/20"
                >
                  Join!
                </button>
              </form>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-4 ps-0 lg:ps-10 pt-10 lg:pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 items-start">
              <div className="grid">
                <p className="text-[15px] font-semibold uppercase text-white/80 tracking-wide text-sm">Legal</p>
                <div className="grid gap-2.5 mt-4 text-sm text-white/60">
                  <Link to="/terms-and-conditions" className="hover:text-brand transition">Terms and conditions</Link>
                  <Link to="/privacy-policy" className="hover:text-brand transition">Privacy policy</Link>
                </div>
              </div>
              <div className="grid">
                <p className="text-[15px] font-semibold uppercase text-white/80 tracking-wide text-sm">Resources</p>
                <div className="grid gap-2.5 mt-4 text-sm text-white/60">
                  <Link to="/blog" className="hover:text-brand transition">Blog</Link>
                  <Link to="/faqs" className="hover:text-brand transition">FAQs</Link>
                  <Link to="/contact-support" className="hover:text-brand transition">Support</Link>
                </div>
              </div>
              <div className="grid">
                <p className="text-[15px] font-semibold uppercase text-white/80 tracking-wide text-sm">Company</p>
                <div className="grid gap-2.5 mt-4 text-sm text-white/60">
                  <Link to="/about" className="hover:text-brand transition">About RapidStylers</Link>
                  <Link to="/styler-signup" className="hover:text-brand transition">Register as a stylist</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-4 md:px-[50px] py-7 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
        <div className="gap-2 grid grid-cols-1 text-center sm:text-start">
          <Link to="/" aria-label="RapidStylers home" className="justify-self-center sm:justify-self-start">
            <img src={logo} alt="" className="h-12 hover:opacity-90 transition" />
          </Link>
          <span className="text-white/60 text-sm">© {currentYear} RapidStylers. All rights reserved</span>
        </div>
        <div className="flex gap-3">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RapidStylers on Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-brand hover:bg-brand/10 hover:text-brand"
          >
            <img src={instagram} alt="Instagram" className="h-4 w-4 opacity-80" />
          </a>
          <a
            href="https://x.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RapidStylers on X"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-brand hover:bg-brand/10 hover:text-brand"
          >
            <img src={x} alt="X" className="h-4 w-4 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
