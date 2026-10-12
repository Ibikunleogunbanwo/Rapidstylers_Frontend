import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Section, Eyebrow } from "../../components/pageSections";
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from "../../utils/constant";

/**
 * Tells search engines not to index this page. A mistyped or retired URL
 * answers with the app shell (status 200), so without this a crawler would file
 * every bad link as a real page. The previous robots value comes back on leave.
 */
export const useNoIndex = () => {
  useEffect(() => {
    let element = document.head.querySelector('meta[name="robots"]');
    const existed = Boolean(element);
    const previous = element?.getAttribute("content");
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute("name", "robots");
      document.head.appendChild(element);
    }
    element.setAttribute("content", "noindex, nofollow");
    return () => {
      if (!existed) element.remove();
      else if (previous != null) element.setAttribute("content", previous);
    };
  }, []);
};

const NotFound = () => {
  useEffect(() => {
    document.title = "Page Not Found | RapidStylers";
  }, []);
  useNoIndex();
  return (
    <div className="min-h-screen bg-white">
      <Section pad="pt-[18vh] pb-24" className="text-center">
        <p className="text-[clamp(4rem,10vw,7rem)] font-normal leading-none tracking-[-0.03em] text-brand">
          404
        </p>
        <h1 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-[420px] text-[13px] leading-[1.6] text-black/55">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center rounded-full bg-[#1A1A1A] px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          Back home
        </Link>
        <div className="mx-auto mt-14 max-w-[420px] border-t border-black/10 pt-6 text-[12px] leading-[1.7] text-black/50">
          <Eyebrow className="!text-black/40">Need a hand? Reach us</Eyebrow>
          <p className="mt-2">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-brand">{SUPPORT_EMAIL}</a>
            {" \u00b7 "}
            <a href={`tel:${SUPPORT_PHONE_TEL}`} className="transition-colors hover:text-brand">{SUPPORT_PHONE}</a>
          </p>
          <p>{SUPPORT_ADDRESS}</p>
        </div>
      </Section>
    </div>
  );
};

export default NotFound;
