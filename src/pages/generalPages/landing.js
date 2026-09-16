
import Featured from "../../components/featuredStylists";
import scissors from "../../assets/svg-icons/scissors.svg";

import Footer from "../../components/footer";
import canada from "../../assets/images/canada.webp";
import canada2 from "../../assets/images/signup.jpg";
import { Link } from "react-router-dom";
// Real photos of the Canadian cities the platform operates in, plus a short
// street-level video loop for the Canada band. Resized for web on import.
import photoCalgaryStreet from "../../assets/images/canada/calgary-tower-street.jpg";
import photoCalgarySkyline from "../../assets/images/canada/calgary-skyline-dusk.jpg";
import photoTorontoAerial from "../../assets/images/canada/toronto-aerial.jpg";
import photoAutumnLeaves from "../../assets/images/canada/autumn-leaves.jpg";
import photoMontrealWheel from "../../assets/images/canada/montreal-wheel.jpg";
import cityLoop from "../../assets/images/canada/city-loop.mp4";
import Hero from "./newHeroSection";
// import rapidGIF from "../../assets/Videos/stylers.gif";
// The "for clients" card used stylist-1.jpg, which is the same braiding close-up
// as the gallery's natural-hair tile — a tight portrait crop that cut the
// forehead at the card's 16:10 ratio. barbers.jpg shows a client in the chair
// with a professional at work, crops cleanly, and appears nowhere else.
import forClientsImg from "../../assets/images/barbers.jpg"
import stylistImg2 from "../../assets/images/stylist-2.jpg"
import ScrollContainer from "../../components/img-slider";
import AdSlot from "../../components/adSlot";
import { useEffect, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";
import { ELEVATE_GRID, curatedById } from "../../utils/curatedGallery";

// The same curated photos the gallery page leads with, resolved from its list so
// the two cannot drift (they previously kept separate copies of the paths).
const GALLERY_GRID = ELEVATE_GRID;

/**
 * The brand story block used `about-landing.jpg`: a glossy manicure close-up,
 * 3204x2304 with no EXIF, bundled in src/assets and belonging to nobody — not
 * work we did, and not attributable to anyone we could credit. It now shows our
 * own reviewed work, resolved by id so renaming the file fails the build rather
 * than leaving a hole where the picture goes.
 */
const BRAND_STORY_PHOTO = curatedById("g-lashes-2");

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

// Offline fallback for when the blog API is unreachable. The old entries used
// freepik URLs whose 2024 signature links had expired, so the cards rendered
// broken images exactly when the backend was down. These are our own verified
// work photos from the public gallery, matched to each article's topic.
const FALLBACK_BLOGS = [
  { img: "/images/gallery/g-braids-2.jpg", cat: "Braiding", title: "The Ultimate Guide to Braiding: From Basic to Intricate Styles", date: "May 29, 2024" },
  { img: "/images/gallery/g-natural-hair-1.jpg", cat: "Styling", title: "Quick and Easy Hairstyles for Busy Mornings", date: "May 29, 2024" },
  { img: "/images/gallery/g-natural-hair-3.jpg", cat: "Hair Care", title: "Healthy Hair Tips: Essential Care and Maintenance Guide", date: "May 29, 2024" },
  { img: "/images/gallery/g-buzz-cut-1.jpg", cat: "Trends", title: "Short and Chic: Modern Hairstyles for Short Haircuts", date: "May 29, 2024" },
];

const normalizeBlog = (p) => ({
  id: p.id ?? null,
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
    <div id="blog" className="mx-auto max-w-[1240px] px-5 py-20 md:px-[50px] md:py-28 lg:px-[100px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted">From the blog</p>
          <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
            Get inspired with RapidStylers
          </h2>
          <p className="mt-3 text-[14px] leading-[1.6] text-black/60">Helpful articles written by beauty professionals.</p>
        </div>
        <Link
          to="/blog"
          className="text-[13px] font-semibold text-black/55 hover:text-brand transition-colors w-fit"
        >
          Read all articles →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        {visible.map((post, i) => (
          <Link
            key={post.title + i}
            to={post.id ? `/blog/${post.id}` : "/blog"}
            className="group"
          >
            <div className="aspect-[4/5] overflow-hidden bg-neutral">
              <img
                src={post.img}
                alt=""
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </div>
            <div className="pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{post.cat}</span>
              <p className="text-[15px] font-medium leading-snug mt-2 text-onSurface">{post.title}</p>
              <p className="text-xs text-black/45 mt-2">{post.date}</p>
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
                src={BRAND_STORY_PHOTO.src}
                alt={BRAND_STORY_PHOTO.alt}
                decoding="async"
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
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Who we are</p>
              <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
                A vetted professional, at your door. You choose the time.
              </h2>
              <p className="mt-5 text-[14px] leading-[1.7] text-black/60 max-w-[520px]">
                We are a Canadian booking platform for hair, nails and beauty.
                Search for the service you want, look through the professional's
                work, read reviews from clients who booked them, then pick a time
                that suits you. No phone calls, and no waiting for a salon to
                open.
              </p>
              <Link
                to={"/about"}
                className="mt-8 inline-flex items-center rounded-full bg-[#1A1A1A] px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
              >
                Read our story
              </Link>
            </div>
          </div>
        </div>

        {/* Featured stylists */}
        <div className="mt-16">
          <Featured />
        </div>

        {/* Brand loop + quote */}
        <div className="my-16 px-5 md:px-[50px] text-center grid gap-4 justify-items-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            src={cityLoop}
            aria-label="RapidStylers logo animation"
            className="w-full max-w-[420px] rounded-lg"
          />
          <div className="flex justify-center">
            <img src={scissors} alt="" className="h-5" />
          </div>
          <p className="text-[13px] text-black/45">
            Style is a way to say who you are without having to speak
          </p>
        </div>

        {/* benefits for clients */}
        <div className="px-4 md:px-[50px] py-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-6 bg-black">
          <div className="">
            <img src={canada2} alt="" loading="lazy" decoding="async" className="rounded-3xl hidden lg:block" />
            <img src={canada} alt="" loading="lazy" decoding="async" className="block lg:hidden" />
          </div>
          <div className="">
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-white mb-8">Why choose RapidStylers?</h2>
            <div className="gap-6 grid">
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">01</div>
                  <div>
                    <span className="text-[15px] font-medium">Salon Quality, At Home</span>
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
                    <span className="text-[15px] font-medium">Your Perfect Match, Every Time</span>
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
                    <span className="text-[15px] font-medium">Convenience, Redefined</span>
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
                    <span className="text-[15px] font-medium">Community, Not Just a Service</span>
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
                    <span className="text-[15px] font-medium">Beyond the Basics</span>
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
        <div className="bg-neutral">
          <div className="px-5 md:px-[50px] lg:px-[100px] py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-[1240px] mx-auto">
            <div className="text-center lg:text-start">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted">The gallery</p>
              <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
                Elevate your style.
              </h2>
              <p className="mt-4 text-[14px] leading-[1.6] text-black/60 max-w-[440px] mx-auto lg:mx-0">
                Explore our exclusive collection of trendsetting styles for
                men and women.
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <Link
                  to={"/elevate-your-looks"}
                  className="inline-flex items-center rounded-full bg-[#1A1A1A] px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
                >
                  Browse gallery
                </Link>
              </div>
            </div>
            <div className="relative grid grid-cols-2 gap-3 md:gap-4">
              {GALLERY_GRID.map((img) => (
                <img
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-square object-cover"
                />
              ))}
            </div>
          </div>
        </div>

        {/* benefits for stylists*/}
        <div className="px-4 md:px-[50px] grid gap-8 my-20 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="lg:w-1/2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-brand">
                For beauty professionals
              </p>
              <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
                Calling all <span className="text-brand">beauty professionals!</span>
              </h2>
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
        <section className="bg-[#f7f7f8] px-4 py-16 sm:px-6 md:px-[50px] md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
                  Your next move
                </p>
                <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
                  Beauty that fits your life.
                </h2>
              </div>
              <p className="max-w-md text-base leading-relaxed text-black/55 md:text-right">
                Whether you are booking a fresh look or building your beauty business, there is a place for you here.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <article className="group overflow-hidden rounded-2xl bg-[#1e1e1e] text-white shadow-[0_18px_45px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_24px_55px_rgba(0,0,0,0.18)]">
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
                  <img
                    src={forClientsImg}
                    alt="A client in the chair while a barber finishes their cut"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
                  <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:left-6 sm:top-6">
                    For clients
                  </span>
                </div>
                <div className="flex min-h-[242px] flex-col p-6 sm:p-8">
                  <h3 className="text-xl font-normal leading-tight tracking-[-0.01em] sm:text-2xl">
                    Your best look, at home.
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
                    Save time and effort with trusted beauty professionals who bring cuts, colour, nails, lashes, and more to your door.
                  </p>
                  <Link
                    to="/login"
                    className="mt-auto inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#1e1e1e] transition hover:bg-brand hover:text-white sm:w-fit"
                  >
                    Book an appointment
                    <span aria-hidden="true" className="text-base">→</span>
                  </Link>
                </div>
              </article>

              <article className="group overflow-hidden rounded-2xl bg-[#1e1e1e] text-white shadow-[0_18px_45px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_24px_55px_rgba(0,0,0,0.18)]">
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
                  <img
                    src={stylistImg2}
                    alt="Beauty professional ready to serve a client"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
                  <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:left-6 sm:top-6">
                    For professionals
                  </span>
                </div>
                <div className="flex min-h-[242px] flex-col p-6 sm:p-8">
                  <h3 className="text-xl font-normal leading-tight tracking-[-0.01em] sm:text-2xl">
                    Turn your talent into a business.
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
                    Grow your client base, manage bookings, and offer in-home services with the support of the RapidStylers community.
                  </p>
                  <Link
                    to="/styler-signup"
                    className="mt-auto inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#1e1e1e] transition hover:bg-brand hover:text-white sm:w-fit"
                  >
                    Register as a beauty professional
                    <span aria-hidden="true" className="text-base">→</span>
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Ad unit (renders nothing until REACT_APP_ADSENSE_CLIENT is configured) */}
        <div className="px-4 md:px-[50px] max-w-5xl mx-auto w-full">
          <AdSlot slot="landing_mid" />
        </div>

        {/* Blog section — fetched from API, 4 fallback posts if backend is down */}
        <BlogSection />

        {/* Across Canada: real photos of the cities we operate in */}
        <div className="bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-[50px] md:py-28 lg:px-[100px]">
            <div className="max-w-[680px]">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Coast to coast</p>
              <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
                Built for Canadian cities.
              </h2>
              <p className="mt-4 text-[14px] leading-[1.6] text-black/60">
                RapidStylers connects clients and professionals across the
                country. These are the streets our professionals travel every
                day, from Calgary to Toronto to Montreal.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <figure className="m-0">
                <img src={photoCalgaryStreet} alt="Centre Street Bridge looking toward the Calgary Tower" className="aspect-[3/4] w-full object-cover" loading="lazy" decoding="async" />
                <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">Calgary, Alberta</figcaption>
              </figure>
              <figure className="m-0">
                <img src={photoTorontoAerial} alt="Aerial view of downtown Toronto and the CN Tower" className="aspect-[3/4] w-full object-cover" loading="lazy" decoding="async" />
                <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">Toronto, Ontario</figcaption>
              </figure>
              <figure className="m-0">
                <img src={photoMontrealWheel} alt="The La Grande Roue de Montreal ferris wheel reflected in the Old Port basin" className="aspect-[3/4] w-full object-cover" loading="lazy" decoding="async" />
                <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">Montreal, Quebec</figcaption>
              </figure>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <figure className="m-0">
                <img src={photoAutumnLeaves} alt="Maple leaves turning orange against a blue sky" className="aspect-[16/9] w-full object-cover" loading="lazy" decoding="async" />
                <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">Canadian autumn</figcaption>
              </figure>
              <figure className="m-0">
                <img src={photoCalgarySkyline} alt="An observation tower seen from below through golden autumn branches" className="aspect-[16/9] w-full object-cover" loading="lazy" decoding="async" />
                <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">Through the autumn leaves</figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* Stylist by location */}
        <div className="relative overflow-hidden border-b border-white/10 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(147,129,255,0.12),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(147,129,255,0.08),transparent_50%)]"></div>
          <div className="relative px-4 md:px-[50px] py-20 lg:py-28 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.25em] text-brand">Nationwide coverage</p>
              <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-white">
                Find beauty professionals<br />anywhere in <span className="text-brand">Canada.</span>
              </h2>
              <p className="text-white/50 mt-4 text-[14px] leading-[1.6] max-w-xl mx-auto">
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

        {/* Footer */}
        <div>
          <Footer />
        </div>
      </div>
    );
}
 
export default LandingPage;
