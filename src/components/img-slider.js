import React from 'react';

const ScrollContainer = ({children}) => {
  const handleMouseEnter = () => {
    const element = document.querySelector(".scroll-element");
    if (element) {
      element.style.animationPlayState = "paused";
    }
  };

  const handleMouseLeave = () => {
    const element = document.querySelector(".scroll-element");
    if (element) {
      element.style.animationPlayState = "running";
    }
  };
  return (
    <div class="scroll-parent">
      <div class="scroll-element primary flex gap-4" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="w-80 md:w-96 lg:w-[500px] p-8 rounded border hover:border-brand hover:text-brand transition-colors cursor-default">
          <div className='grid gap-1'>
            <span className='text-lg'>Be Your Own Boss, Own Your Schedule</span>
            <span>Ditch the salon grind and set your own hours with flexible scheduling that fits your life. No more commutes, fixed schedules, or limited earning potential.</span>
          </div>
        </div>
        <div className="w-80 md:w-96 lg:w-[500px] p-8 rounded border hover:border-brand hover:text-brand transition-colors cursor-default">
        <div className='grid gap-1'>
          <span className='text-lg'>Connect With Cients Who Value You</span>
          <span>Skip the walk-in roulette and work with clients who appreciate your skills, style, and personality. Our matching algorithm ensures you get booked by clients who are the perfect fit for your expertise.</span>
        </div>
        </div>  
        <div className="w-80 md:w-96 lg:w-[500px] p-8 rounded border hover:border-brand hover:text-brand transition-colors cursor-default">
          <div className='grid gap-1'>
            <span className='text-lg'>Earn More, Keep More</span>
            <span>Maximize your earning potential with transparent commission rates and access to a wider client base than you could reach on your own. No hidden fees or salon overhead cuts into your profits.</span>
          </div>
        </div>  
        <div className="w-80 md:w-96 lg:w-[500px] p-8 rounded border hover:border-brand hover:text-brand transition-colors cursor-default">
          <div className='grid gap-1'>
            <span className='text-lg'>Build Your Brand, Grow Your Reputation</span>
            <span>Showcase your talent and build a loyal following through personalized profiles, client reviews, and community features. RapidStylers helps you establish your unique brand and attract even more clients</span>
          </div>
        </div>  
        <div className="w-80 md:w-96 lg:w-[500px] p-8 rounded border hover:border-brand hover:text-brand transition-colors cursor-default">
          <div className='grid gap-1'>
            <span className='text-lg'>Be Part Of A Supportive Community</span>
            <span>Network with fellow professionals, share best practices, and access exclusive training and development opportunities. Grow your skills, stay inspired, and never feel isolated.</span>
          </div>
        </div>  
        <div className="w-80 md:w-96 lg:w-[500px] p-8 rounded border hover:border-brand hover:text-brand transition-colors cursor-default">
          <div className='grid gap-1'>
            <span className='text-lg'>Be Your Own Boss, Own Your Schedule</span>
            <span>Ditch the salon grind and set your own hours with flexible scheduling that fits your life. No more commutes, fixed schedules, or limited earning potential.</span>
          </div>
        </div> 
      </div>
    </div>
  );
};

export default ScrollContainer;
