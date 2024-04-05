import Hero from "../components/heroSection";
import about1 from "../assets/images/about-1.jpg";
import about2 from "../assets/images/about-2.jpg"
import Footer from "../components/footer";

const AboutUs = () => {
  document.title="About us - RapidStylers"
  return (
    <div className="grid gap-12">
      <Hero />
      <div className="mt-16 px-4 md:px-[50px]">
        <p className="text-3xl font-medium">
        Tired of the Salon Struggle? Escape to RapidStylers!
        </p>
        <p className="mt-4">
        <span className="text-brand font-medium">Imagine this:</span> the clock races by, your schedule's crammed, and that
        essential haircut slips further out of reach. Sound familiar? You're
        not alone. Between juggling commitments and battling inconvenient
        salon hours, finding time for yourself feels like a luxury. But what
        if there was a better way?
        </p>
      </div>
      <div className="px-4 md:px-[50px] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <img src={about2} alt="" className="rounded-md object-cover"/>
        </div>
        <div>
          <p className="text-2xl">Introducing RapidStylers, your gateway to exceptional haircare, reimagined.</p>
          <p>Forget battling traffic, squeezing into booked-solid appointments, or settling for "good enough" stylists. We bring the luxury of the salon directly to you, on your terms.</p>
        </div>
      </div>
      <div className="px-4 md:px-[50px] grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="">
          <p className="text-3xl">Beyond convenience, RapidStylers offer</p>
          <div className="grid gap-4 mt-6">
            <div className="p-4 rounded border hover:border-brand hover:text-brand cursor-default transition-colors">
              <p><span className="font-medium">Unwavering quality:</span> Discover a handpicked network of top-tier stylists, vetted for their skills and dedication. From classic cuts to bold transformations, explore a wide range of services delivered with flawless precision.</p>
            </div>
            <div className="p-4 rounded border hover:border-brand hover:text-brand cursor-default transition-colors">
              <span className="font-medium">Effortless trust:</span> Our transparent rating and feedback system empowers you to choose a stylist with confidence. Read real stories, discover hidden gems, and find someone who shares your passion for hair
            </div>
            <div className="p-4 rounded border hover:border-brand hover:text-brand cursor-default transition-colors">
            <span className="font-medium">A thriving community:</span> We're more than just appointments. Connect with fellow beauty enthusiasts, share experiences, and discover your next hair inspiration - all within our supportive network.
            </div>
          </div>
        </div>
        <div className="h-full overflow-hidden rounded-md">
          <img src={about1} alt="" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
