import React from "react";
import { Link } from "react-router-dom";
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from "../../utils/constant";

const NotFound = () => {
  document.title = "Page Not Found | RapidStylers";
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-brand">404</p>
        <p className="text-2xl font-bold text-gray-900 mt-4">Page not found</p>
        <p className="text-sm text-gray-500 mt-2">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 py-3 px-8 bg-brand rounded-md text-sm text-white font-semibold hover:opacity-90"
        >
          Go Home
        </Link>
        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
          <p className="font-semibold text-gray-700">Need a hand? Reach us</p>
          <p className="mt-1">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-brand transition-colors">{SUPPORT_EMAIL}</a>
            {" \u00b7 "}
            <a href={`tel:${SUPPORT_PHONE_TEL}`} className="hover:text-brand transition-colors">{SUPPORT_PHONE}</a>
          </p>
          <p className="mt-0.5">{SUPPORT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
