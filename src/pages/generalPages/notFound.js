import React from "react";
import { Link } from "react-router-dom";
import { Section, Eyebrow } from "../../components/pageSections";
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from "../../utils/constant";

const NotFound = () => {
  document.title = "Page Not Found | RapidStylers";
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
