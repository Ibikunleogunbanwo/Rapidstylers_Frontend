
import Featured from "../../components/featuredStylists";
import elevateLook from "../../assets/images/elevateLook.png";
import scissors from "../../assets/svg-icons/scissors.svg";
import Footer from "../../components/footer";
import heroImg from "../../assets/images/hero.png";
import canada from "../../assets/images/canada.png";
import canada2 from "../../assets/images/signup.jpg";
import { Link } from "react-router-dom";
import Hero from "./heroSection";
import rapidGIF from "../../assets/Videos/stylers.gif";
import stylistImg1 from "../../assets/images/stylist 1.png"
import stylistImg2 from "../../assets/images/stylist 2.png"
import ScrollContainer from "../../components/img-slider";

const LandingPage = () => {
  document.title="Welcome - RapidStylers";

    return (
      <div className="grid">
        {/* Hero section */}
        <Hero
          height="85vh"
          landingTitle="Get convenient, high-quality hair services without leaving your home."
          titleAddOn="Our platform connects you with top-rated local barbers and stylists for in-home appointments."
          landingHeroImg={heroImg}
        />

        {/* About us*/}
        <div className="px-4 md:px-[50px] mt-14">
          <div className=" grid grid-cols-1 md:grid-cols-5 gap-10 py-16 bg-black text-white rounded-lg items-center">
            <div className="col-span-1 md:col-span-3 px-10 order-2 md:order-1">
              <p className="text-3xl">Our brand story.</p>
              <p className="font-medium mt-3">
                Tired of the Salon Struggle? Escape to RapidStylers!
              </p>
              <p className="text-white/60">
                Imagine this: the clock races by, your schedule's crammed, and
                that essential haircut slips further out of reach. Sound
                familiar? You're not alone. Between juggling commitments and
                battling inconvenient salon hours, finding time for yourself
                feels like a luxury. But what if there was a better way?
              </p>
              <div className="mt-8">
                <Link to={"/about"} className="py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold">
                  Read more...
                </Link>
              </div>
            </div>
            <div className="rounded-lg col-span-1 md:col-span-2 order-1 md:order-2">
              <img
                src={rapidGIF}
                alt="My GIF"
                className=" w-full object-cover"
              />
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
                    <span>Salon Luxury, Delivered</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      Escape the salon wait and enjoy premium haircare in the
                      comfort of your own home. Our skilled professionals bring
                      the luxury spa experience directly to you, saving you time
                      and stress.
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
                      Tired of salon roulette? Our AI-powered matching algorithm
                      connects you with the ideal stylist based on your unique
                      needs, preferences, and style goals. No more settling for
                      anything less than perfect.
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">03</div>
                  <div>
                    <span>Convinience Redefined</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      Book appointments, manage payments, and leave feedback –
                      all at your fingertips. Our user-friendly app empowers you
                      to control your haircare experience with ease and
                      flexibility.
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
                      More than just appointments, RapidStylers fosters a
                      vibrant community of clients and professionals. Connect,
                      share experiences, and build lasting relationships – all
                      within our supportive network.
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-white">
                <div className="flex gap-5">
                  <div className="">05</div>
                  <div>
                    <span>Beyond Haircuts</span>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="border-l ms-2 mt-2"></div>
                  <div className="text-white/60 ps-2">
                    <span>
                      Our services extend beyond basic cuts and styles. Explore
                      a wide range of options, from coloring and treatments to
                      beard grooming and specialty styles, all delivered with
                      the same exceptional quality and convenience.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 md:ms-8">
              <button className="py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold">
                Book your appointment today!
              </button>
            </div>
          </div>
        </div>

        {/* Elevate your looks */}
        <div className="bg-[#F0EBF6] px-4 md:px-[50px] grid grid-cols-1 lg:grid-cols-5 py-[50px] items-center space-y-10 lg:space-y-0">
          <div className="col-span-2 lg:px-10">
            <div className="text-center lg:text-start ">
              <p className="text-3xl mb-4 text-brand">Elevate your style.</p>
              <p className="">
                Explore Our Exclusive Collection of Trendsetting Hairstyles for
                Men and Women
              </p>
            </div>
            <div className="mt-3 flex justify-center lg:justify-start">
              <Link
                to={"/elevate-your-looks"}
                className="py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold"
              >
                Browse gallery
              </Link>
            </div>
          </div>
          <div className="col-span-3">
            <img src={elevateLook} alt="" className="w-full" />
          </div>
        </div>

        {/* benefits for stylists*/}
        <div className="px-4 md:px-[50px] grid gap-6 my-16">
          <div>
            <p className="w-full lg:w-1/2 mt-4">
              <span className="text-3xl">
                Calling all beauty professionals!
              </span>{" "}
              <br />
              <span>
                Join now to start receiving online booking appointments
                effortlessly.
              </span>
            </p>
          </div>
          <div className="z-0"><ScrollContainer /></div>
        </div>

        {/* Book appointment / register */}
        <div className="px-4 md:px-[50px] grid grid-cols-1 lg:grid-cols-2 gap-4 my-16">
          <div className="rounded-lg overflow-hidden">
            <div className="overflow-hidden">
              <img src={stylistImg1} alt="" className="w-full object-cover object-top hover:scale-110 transition-all"/>
            </div>
            <div className="bg-[#1e1e1e] p-4 md:p-6 text-white">
              <p className="text-lg">Transform your style!</p>
              <p className="text-white/60">
                Save time and effort with in-home haircuts, coloring, styling,
                and more.
              </p>
              <div className="flex">
                <span className="bg-white rounded-md text-sm text-[#1e1e1e] font-semibold mt-6 py-4 px-8">
                  Book an appointment
                </span>
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
                <span className="bg-white rounded-md text-sm text-[#1e1e1e] font-semibold mt-6 py-4 px-8">
                  Register as a stylist
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Blog section */}
        <div className="px-4 md:px-[50px] grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-4 grid">
            <span className="text-3xl">Blog</span>
            <div className="grid gap-4 lg:flex justify-between items-center">
              <span>
                Get inspired with RapidStylers. Read helpful articles written by
                professionals.
              </span>
              <span className="text-sm text-black/50">
                [Read all articles here]
              </span>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border px-1 pt-1 pb-3 bg-white">
            <div className="h-[250px] md:h-[170px] overflow-hidden rounded-t-lg">
              <img
                src="https://img.freepik.com/free-photo/ai-generated-cute-girl-pic_23-2150649874.jpg?w=360"
                alt=""
                className="object-cover w-full hover:scale-125 transition-all"
              />
            </div>
            <p className="font-semibold text-sm my-3 px-3">
              The Ultimate Guide to Braiding: From Basic to Intricate Styles g:
              From Basic to Intricate Styles
            </p>
            <p className="text-sm text-slate-400 px-3">29.05.2024</p>
          </div>
          <div className="rounded-lg overflow-hidden border px-1 pt-1 pb-3 bg-white">
            <div className="h-[250px] md:h-[170px] overflow-hidden rounded-t-lg">
              <img
                src="https://img.freepik.com/free-photo/side-view-woman-styling-hair_23-2149659566.jpg?t=st=1708868604~exp=1708872204~hmac=a724d6651959e05a587b791dba7dbab024b8dc529d20566c14741d134583e345&w=740"
                alt=""
                className="object-cover w-full hover:scale-125 transition-all"
              />
            </div>
            <p className="font-semibold text-sm my-3 px-3">
              Quick and Easy Hairstyles for Busy Mornings
            </p>
            <p className="text-sm text-slate-400 px-3">29.05.2024</p>
          </div>
          <div className="rounded-lg overflow-hidden border px-1 pt-1 pb-3 bg-white">
            <div className="h-[250px] md:h-[170px] overflow-hidden rounded-t-lg">
              <img
                src="https://img.freepik.com/free-photo/medium-shot-woman-arranging-hair_23-2149634993.jpg?t=st=1708868767~exp=1708872367~hmac=44c9b42f97f98a74588368862e364a6e2f7938b61e1563dcc8fd3ef51b42be57&w=826"
                alt=""
                className="object-cover w-full hover:scale-125 transition-all"
              />
            </div>
            <p className="font-semibold text-sm my-3 px-3">
              Healthy Hair Tips: Essential Care and Maintenance Guide
            </p>
            <p className="text-sm text-slate-400 px-3">29.05.2024</p>
          </div>
          <div className="rounded-lg overflow-hidden border px-1 pt-1 pb-3 bg-white">
            <div className="h-[250px] md:h-[170px] overflow-hidden rounded-t-lg">
              <img
                src="https://img.freepik.com/free-photo/cool-girl-with-short-hair-looking-into-camera-background-white-backdrop-brunette-lady-with-glass-beige-outside-posing-backdrop-wall_197531-29357.jpg?t=st=1708868867~exp=1708872467~hmac=8acc269316521de8d8e9ca7cf302d3ef600de561bee3350a281a67bd7644845a&w=826"
                alt=""
                className="object-cover w-full hover:scale-125 transition-all"
              />
            </div>
            <p className="font-semibold text-sm my-3 px-3">
              Short and Chic: Modern Hairstyles for Short Haircuts
            </p>
            <p className="text-sm text-slate-400 px-3">29.05.2024</p>
          </div>
        </div>

        {/* Stylist by location */}
        <div className="px-4 md:px-[50px] mt-16">
          <p className="text-3xl">Find your stylists anywhere in canada.</p>
          <div className="grid gap-3 mt-3">
            <p className="font-bold">Hairdressers</p>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <li className="truncate">Alberta</li>
              <li className="truncate">British Columbia</li>
              <li className="truncate">Manitoba</li>
              <li className="truncate">New Brunswick</li>
              <li className="truncate">Newfoundland and Labrador</li>
              <li className="truncate">Nova Scotia</li>
              <li className="truncate">Ontario</li>
              <li className="truncate">Prince Edward Island</li>
              <li className="truncate">Quebec</li>
              <li className="truncate">Saskatchewan</li>
            </ul>
          </div>
          <div className="grid gap-3 mt-12">
            <p className="font-bold">Barbers</p>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <li className=" truncate">Alberta</li>
              <li className=" truncate">British Columbia</li>
              <li className=" truncate">Manitoba</li>
              <li className=" truncate">New Brunswick</li>
              <li className=" truncate">Newfoundland and Labrador</li>
              <li className=" truncate">Nova Scotia</li>
              <li className=" truncate">Ontario</li>
              <li className=" truncate">Prince Edward Island</li>
              <li className=" truncate">Quebec</li>
              <li className=" truncate">Saskatchewan</li>
            </ul>
          </div>
        </div>

        {/* Quote */}
        <div className="my-16 px-4 md:px-[50px] text-center grid gap-3">
          <div className="flex justify-center">
            <img src={scissors} alt="" className="h-5" />
          </div>
          <p className="text-[#c4c4c4]">
            The barber just opened a restaurant, but the only thing on the menu
            is haircuts
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