// LazyComponent.js
import React from 'react';
import heropic from "../assets/images/hero.png"
import heropic2 from "../assets/images/elevateLook.png"


const LazyComponent = () => {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <img src={heropic} alt="" />
        <img src={heropic2} alt="" />
      </div>
    </div>
  );
};

export default LazyComponent;
