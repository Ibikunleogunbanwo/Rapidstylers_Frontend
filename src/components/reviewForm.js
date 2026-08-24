import React, { useState } from "react";
import { APIService } from "../hooks/remote/apiService";
import { showSuccessToastMessage } from "../utils/constant";

/**
 * Review form for a COMPLETED booking. Submits via /create_review — the
 * backend enforces ownership, completed-only status, and one review per
 * booking. `onDone` is called after a successful submit.
 */
const ReviewForm = ({ bookingId, stylerId, onDone }) => {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (!bookingId || !stylerId || rating === 0 || submitting) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      await APIService.createReview({
        bookingId,
        stylerId,
        ratingScore: String(rating),
        reviewMessage: message.trim(),
      });
      showSuccessToastMessage("Review submitted");
      if (onDone) onDone();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm font-semibold">Write a review:</p>
      <div className="flex gap-2 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            className={`text-2xl cursor-pointer ${star <= rating ? "text-brand" : "text-brand/30"}`}
          >
            &#9733;
          </span>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows="2"
        className="w-full p-3 rounded-md border border-[#c4c4c432] bg-[#c4c4c410] focus:outline-0 mt-3"
        placeholder="Share your experience with this professional…"
      ></textarea>
      {errorMsg && (
        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span>{errorMsg}</span>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="py-2 px-6 bg-brand rounded-md text-sm text-white font-semibold mt-2 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
};

export default ReviewForm;
