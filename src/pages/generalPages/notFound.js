import React from "react";
import { Link } from "react-router-dom";

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
      </div>
    </div>
  );
};

export default NotFound;
