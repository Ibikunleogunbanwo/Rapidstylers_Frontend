import React, { useState } from "react";

const Rating = ({ maxRating = 5, initialRating = 0, onRatingChange }) => {
  const [rating, setRating] = useState(initialRating);
  const [selectedRating, setSelectedRating] = useState(null);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setSelectedRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  return (
    <div className="grid mt-2">
      <div className="flex gap-3 justify-self-center">
        {[...Array(maxRating)].map((_, index) => (
          <span
            key={index}
            onClick={() => handleRatingChange(index + 1)}
            className={`text-2xl cursor-pointer ${index < rating ? "text-brand" : "text-brand/30"}`}
          >
            &#9733;
          </span>
        ))}
      </div>
      <div className="hidden">Rating Output: {selectedRating}</div>
      <div className="mt-2">
        <textarea name="" id="" cols="30" rows="3" className="w-full  p-4 md:p-3 rounded-md border border-[#c4c4c432] bg-[#c4c4c410] focus:outline-0" placeholder="Start typing..."></textarea>
        <button className="py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold mt-2">Submit review</button>
      </div>
    </div>
  );
};

export default Rating;
