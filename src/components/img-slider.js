import React from 'react';

const benefits = [
  {
    title: "Be Your Own Boss, Own Your Schedule",
    body: "Ditch the salon grind and set your own hours with flexible scheduling that fits your life. No more commutes, fixed schedules, or limited earning potential.",
  },
  {
    title: "Connect With Clients Who Value You",
    body: "Skip the walk-in roulette and work with clients who appreciate your skills, style, and personality. Our matching algorithm ensures you get booked by clients who are the perfect fit for your expertise.",
  },
  {
    title: "Earn More, Keep More",
    body: "Maximize your earning potential with transparent commission rates and access to a wider client base than you could reach on your own. No hidden fees or salon overhead cuts into your profits.",
  },
  {
    title: "Build Your Brand, Grow Your Reputation",
    body: "Showcase your talent and build a loyal following through personalized profiles, client reviews, and community features. RapidStylers helps you establish your unique brand and attract even more clients",
  },
  {
    title: "Be Part Of A Supportive Community",
    body: "Network with fellow professionals, share best practices, and access exclusive training and development opportunities. Grow your skills, stay inspired, and never feel isolated.",
  },
];

const Card = ({ title, body }) => (
  <div className="w-80 md:w-96 lg:w-[500px] p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_20px_rgba(147,129,255,0.08)] hover:shadow-[0_10px_34px_rgba(147,129,255,0.22)] hover:-translate-y-1 transition-all duration-300 cursor-default shrink-0 mr-6">
    <div className="grid gap-3">
      <span className="h-1 w-12 rounded-full bg-brand"></span>
      <span className="text-lg font-bold leading-snug">{title}</span>
      <span className="text-[15px] leading-relaxed text-black/60">{body}</span>
    </div>
  </div>
);

const ScrollContainer = () => {
  const handleMouseEnter = () => {
    const element = document.querySelector(".scroll-track");
    if (element) {
      element.style.animationPlayState = "paused";
    }
  };

  const handleMouseLeave = () => {
    const element = document.querySelector(".scroll-track");
    if (element) {
      element.style.animationPlayState = "running";
    }
  };

  return (
    <div className="scroll-parent">
      <div className="scroll-track" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Track is rendered twice so translateX(-50%) loops seamlessly */}
        {benefits.map((b, i) => <Card key={`a-${i}`} {...b} />)}
        {benefits.map((b, i) => <Card key={`b-${i}`} {...b} />)}
      </div>
    </div>
  );
};

export default ScrollContainer;
