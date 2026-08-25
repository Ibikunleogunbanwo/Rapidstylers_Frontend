
import Featured from "../../components/featuredStylists";
import elevateLook from "../../assets/images/elevateLook.png";
import scissors from "../../assets/svg-icons/scissors.svg";
import Footer from "../../components/footer";
import canada from "../../assets/images/canada.png";
import canada2 from "../../assets/images/signup.jpg";
import { Link } from "react-router-dom";
import Hero from "./newHeroSection";
// import rapidGIF from "../../assets/Videos/stylers.gif";
import about from "../../assets/images/about_landing.png"
import stylistImg1 from "../../assets/images/stylist 1.png"
import stylistImg2 from "../../assets/images/stylist 2.png"
import ScrollContainer from "../../components/img-slider";
import AdSlot from "../../components/adSlot";
import { useEffect, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
];

const FALLBACK_BLOGS = [
  { img: "https://img.freepik.com/free-photo/ai-generated-cute-girl-pic_23-2150649874.jpg?w=826", cat: "Braiding", title: "The Ultimate Guide to Braiding: From Basic to Intricate Styles", date: "May 29, 2024" },
  { img: "https://img.freepik.com/free-photo/side-view-woman-styling-hair_23-2149659566.jpg?t=st=1708868604~exp=1708872204~hmac=a724d6651959e05a587b791dba7dbab024b8dc529d20566c14741d134583e345&w=826", cat: "Styling", title: "Quick and Easy Hairstyles for Busy Mornings", date: "May 29, 2024" },
  { img: "https://img.freepik.com/free-photo/medium-shot-woman-arranging-hair_23-2149634993.jpg?t=st=1708868767~exp=1708872367~hmac=44c9b42f97f98a74588368862e364a6e2f7938b61e1563dcc8fd3ef51b42be57&w=826", cat: "Hair Care", title: "Healthy Hair Tips: Essential Care and Maintenance Guide", date: "May 29, 2024" },
  { img: "https://img.freepik.com/free-photo/cool-girl-with-short-hair-looking-into-camera-background-white-backdrop-brunette-lady-with-glass-beige-outside-posing-backdrop-wall_197531-29357.jpg?t=st=1708868867~exp=1708872467~hmac=8acc269316521de8d8e9ca7cf302d3ef600de561bee3350a281a67bd7644845a&w=826", cat: "Trends", title: "Short and Chic: Modern Hairstyles for Short Haircuts", date: "May 29, 2024" },
];

const normalizeBlog = (p) => ({
  img: p.imageUrl || p.img || "",
  cat: p.category || p.cat || "Article",
  title: p.title || "Untitled",
  date: p.dateCreated || p.date || "",
});

const BlogSection = () => {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    let mounted = true;
    APIService.listBlog()
      .then((res) => {
        if (mounted && Array.isArray(res.data?.data)) {
          setPosts(res.data.data.slice(0, 4).map(normalizeBlog));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const visible = posts || FALLBACK_BLOGS;

  return (
    <div id="blog" className="px-4 md:px-[50px] py-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">From the blog</p>
          <p className="text-3xl md:text-4xl font-bold mt-2 font-serif">Get inspired with RapidStylers</p>
          <p className="mt-2 text-black/60">Helpful articles written by beauty professionals.</p>
        </div>
        <Link
          to="/blog"
          className="text-sm font-semibold text-black/50 hover:text-brand transition-colors w-fit"
        >
          Read all articles →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
        {visible.map((post, i) => (
          <Link
            key={post.title + i}
            to="/blog"
            className="group rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-[0_2px_20px_rgba(147,129,255,0.08)] hover:shadow-[0_10px_30px_rgba(147,129,255,0.2)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-48 overflow-hidden">
              <img
                src={post.img}
                alt=""
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand">{post.cat}</span>
              <p className="font-semibold text-sm leading-snug mt-2">{post.title}</p>
              <p className="text-xs text-slate-400 mt-3">{post.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const LandingPage = () => {
  document.title="Welcome - RapidStylers";

  useEffect(() => {
    if (window.location.hash === "#blog") {
      const el = document.getElementById("blog");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

    return (
      <div className="grid">
        {/* Hero section */}
        <Hero height="90vh" />

        {/* About us*/}
        <div className="bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 py-20 px-4 md:px-[50px] lg:px-[100px] gap-12 items-center max-w-7xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-3 bg-brand/15 rounded-3xl -rotate-2"></div>
              <img
                src={about}
                alt="About RapidStylers"
                className="relative w-full object-cover rounded-3xl shadow-xl"
              />
              <div className="absolute -bottom-6 right-4 md:right-8 bg-black text-white rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">In-home appointments</p>
                  <p className="text-xs text-white/60">On your schedule</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">Our brand story</p>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 leading-tight font-serif">
                Tired of the salon struggle?{" "}
                <span className="text-brand">Meet RapidStylers.</span>
              </h2>
              <p className="mt-5 text-black/60 leading-relaxed">
                The clock races by, your schedule is packed, and booking the
                appointment you need keeps slipping out of reach. Sound
                familiar? You're not alone. Between work, errands and
                inconvenient salon hours, finding time for yourself feels
                like a luxury. But what if there was a better way?
              </p>
              <Link
                to={"/about"}
                className="inline-block mt-8 py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 transition"
              >
                Read our story
              </Link>
            </div>
          </div>
        </div>

        {/* Featured stylists */}
        <div className="my-16">
          <Featured />
        </div>

        {/* benefits for clients */}
        <div className="px-4 md:px-[50px] py-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-6 bg-black">
          <div className="">
            <img src={canada2} alt="" className="rounded-3xl hidden lg:block" />
            <img src={canada} alt="" className="block lg:hidden" />
          </div>
          <div className="">
            <p className="text-3xl mb-4 text-white">Why choose RapidStylers?</p>
            <div className="gap-6 grid">
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">01</div>
                  <div>
                    <span>Salon Quality, At Home</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      Skip the wait and enjoy premium beauty services in the
                      comfort of your own home. Our vetted professionals bring
                      the salon experience directly to you, saving you time and
                      stress.
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">02</div>
                  <div>
                    <span>Your Perfect Match, Every Time</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      Tired of guessing who to book? Our smart matching connects
                      you with the ideal professional based on your needs,
                      preferences and style goals. No more settling for anything
                      less than perfect.
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">03</div>
                  <div>
                    <span>Convenience, Redefined</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      Book appointments, manage payments and leave feedback, all
                      at your fingertips. Our easy to use app puts your beauty
                      routine in your control, with the flexibility you deserve.
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">04</div>
                  <div>
                    <span>Community, Not Just a Service</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      RapidStylers is more than appointments. It is a thriving
                      community of clients and professionals. Connect, share
                      experiences and build lasting relationships within our
                      supportive network.
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">05</div>
                  <div>
                    <span>Beyond the Basics</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      Our services go beyond cuts and styles. Explore a wide
                      range of options, from coloring and treatments to nails,
                      lashes and more, all delivered with the same exceptional
                      quality and convenience.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 md:ms-8">
              <Link
                to={"/login"}
                className="inline-block py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 transition"
              >
                Book your appointment today!
              </Link>
            </div>
          </div>
        </div>

        {/* Elevate your looks */}
        <div className="relative overflow-hidden bg-[#F0EBF6]">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand/10 blur-3xl"></div>
          <div className="relative px-4 md:px-[50px] py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="text-center lg:text-start">
              <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">The gallery</p>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 leading-tight font-serif">
                Elevate your <span className="text-brand">style.</span>
              </h2>
              <p className="mt-4 text-black/60 text-lg">
                Explore our exclusive collection of trendsetting styles for
                men and women.
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <Link
                  to={"/elevate-your-looks"}
                  className="inline-block py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 transition"
                >
                  Browse gallery
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src={elevateLook}
                alt="Style gallery"
                className="w-full rounded-2xl shadow-[0_20px_60px_rgba(147,129,255,0.3)]"
              />
            </div>
          </div>
        </div>

        {/* benefits for stylists*/}
        <div className="px-4 md:px-[50px] grid gap-8 my-20 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="lg:w-1/2">
              <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">
                For beauty professionals
              </p>
              <p className="text-4xl md:text-5xl font-bold mt-2 leading-tight font-serif">
                Calling all <span className="text-brand">beauty professionals!</span>
              </p>
              <p className="mt-3 text-lg text-black/60">
                Join now to start receiving online booking appointments
                effortlessly.
              </p>
            </div>
            <Link
              to={"/styler-signup"}
              className="shrink-0 w-fit py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90 transition"
            >
              Join us
            </Link>
          </div>
          <div className="z-0 min-w-0">
            <ScrollContainer />
          </div>
        </div>

        {/* Book appointment / register */}
        <div className="px-4 md:px-[50px] grid grid-cols-1 lg:grid-cols-2 gap-4 my-16">
          <div className="rounded-lg overflow-hidden">
            <div className="overflow-hidden">
              <img
                src={stylistImg1}
                alt=""
                className="w-full object-cover object-top hover:scale-110 transition-all"
              />
            </div>
            <div className="bg-[#1e1e1e] p-4 md:p-6 text-white">
              <p className="text-lg">Transform your style!</p>
              <p className="text-white/60">
                Save time and effort with in-home beauty services, from cuts
                and color to nails and lashes.
              </p>
              <div className="flex">
                <Link
                  to={"/login"}
                  className="bg-white rounded-md text-sm text-[#1e1e1e] font-semibold mt-6 py-4 px-8 inline-block hover:opacity-90 transition"
                >
                  Book an appointment
                </Link>
              </div>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden">
            <div className="overflow-hidden">
              <img
                src={stylistImg2}
                alt=""
                className="w-full object-cover object-top hover:scale-110 transition-all"
              />
            </div>
            <div className="bg-[#1e1e1e] p-4 md:p-6 text-white">
              <p className="text-lg">Become a RapidStylers professional.</p>
              <p className="text-white/60">
                Join our community of beauty professionals offering in-home
                services.
              </p>
              <div className="flex">
                <Link
                  to={"/styler-signup"}
                  className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center bg-white rounded-md text-sm text-[#1e1e1e] font-semibold mt-6 py-3 px-6 sm:px-8 hover:opacity-90 transition"
                >
                  Register as a beauty professional
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Ad unit (renders nothing until REACT_APP_ADSENSE_CLIENT is configured) */}
        <div className="px-4 md:px-[50px] max-w-5xl mx-auto w-full">
          <AdSlot slot="landing_mid" />
        </div>

        {/* Blog section — fetched from API, 4 fallback posts if backend is down */}
        <BlogSection />

        {/* Stylist by location */}
        <div className="relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(147,129,255,0.12),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(147,129,255,0.08),transparent_50%)]"></div>
          <div className="relative px-4 md:px-[50px] py-20 lg:py-28 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">Nationwide coverage</p>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 leading-tight font-serif text-white">
                Find beauty professionals<br />anywhere in <span className="text-brand">Canada.</span>
              </h2>
              <p className="text-white/50 mt-3 text-lg max-w-xl mx-auto">
                Choose a province to discover top-rated stylists near you.
              </p>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {PROVINCES.map((province) => (
                <li key={province}>
                  <Link
                    to={`/search?province=${encodeURIComponent(province)}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white/80 hover:bg-brand hover:border-brand hover:text-white hover:shadow-[0_0_30px_rgba(147,129,255,0.35)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand group-hover:text-white shrink-0 transition-colors">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-sm truncate">{province}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quote */}
        <div className="my-16 px-4 md:px-[50px] text-center grid gap-3">
          <div className="flex justify-center">
            <img src={scissors} alt="" className="h-5" />
          </div>
          <p className="text-[#c4c4c4]">
            Style is a way to say who you are without having to speak
          </p>
        </div>

        {/* Footer */}
        <div>
          <Footer />
        </div>
      </div>
    );
}
 
export default LandingPage;
