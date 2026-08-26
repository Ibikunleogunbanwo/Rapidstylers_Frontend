import Hero from "./heroSection";
import about1 from "../../assets/images/about-1.webp";
import about2 from "../../assets/images/about-2.jpg"
import Footer from "../../components/footer";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Unwavering quality",
    body: "Discover a handpicked network of top-tier professionals, vetted for their skills and dedication. From classic cuts to bold transformations, explore a wide range of services delivered with flawless precision.",
    icon: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  },
  {
    title: "Effortless trust",
    body: "Our transparent rating and feedback system empowers you to choose a professional with confidence. Read real stories, discover hidden gems, and find someone who shares your passion for beauty.",
    icon: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  },
  {
    title: "A thriving community",
    body: "We're more than just appointments. Connect with fellow beauty enthusiasts, share experiences, and discover your next style inspiration, all within our supportive network.",
    icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  },
];

const checklist = [
  "Handpicked, vetted beauty professionals",
  "In-home appointments on your schedule",
  "Transparent ratings, reviews and pricing",
];

const AboutUs = () => {
  document.title="About us | RapidStylers"
  return (
    <div className="grid gap-10 md:gap-14">
      <Hero height="62vh" />

      {/* Intro */}
      <div className="px-4 md:px-[50px] max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 bg-white rounded-3xl shadow-[0_2px_30px_rgba(147,129,255,0.1)] p-6 md:p-12">
          <div className="relative h-[320px] md:h-[420px] lg:h-auto">
            <img
              src={about2}
              alt="A RapidStylers professional at work"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-lg"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">Who we are</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
              Introducing RapidStylers, your gateway to{" "}
              <span className="text-brand">exceptional beauty services</span>,
              reimagined.
            </h2>
            <p className="mt-4 text-black/60 leading-relaxed">
              Forget battling traffic, squeezing into fully booked appointment
              slots, or settling for "good enough" professionals. We bring the
              quality of the salon directly to you, on your terms.
            </p>
            <ul className="mt-6 grid gap-3">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-brand/15 text-brand flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="text-[15px] text-black/80">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="inline-block mt-8 py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 transition"
            >
              Find a professional
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 md:px-[50px] max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 bg-white rounded-3xl shadow-[0_2px_30px_rgba(147,129,255,0.1)] p-6 md:p-12">
          <div className="order-2 lg:order-1">
            <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">What we offer</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Beyond convenience, RapidStylers offers
            </h2>
            <div className="grid gap-4 mt-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-5 rounded-2xl border border-gray-100 bg-[#faf9ff] hover:border-brand/60 hover:bg-white hover:shadow-[0_8px_30px_rgba(147,129,255,0.18)] hover:-translate-y-0.5 transition-all cursor-default"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d={feature.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold">{feature.title}</p>
                      <p className="text-black/60 text-[15px] leading-relaxed mt-1">
                        {feature.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[320px] md:h-[480px] lg:h-auto order-1 lg:order-2">
            <img
              src={about1}
              alt="The RapidStylers community"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
