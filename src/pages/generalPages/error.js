import { Link } from "react-router-dom";
import { Section, Eyebrow } from "./pageSections";

const Error = () => {
  return (
    <div className="min-h-screen bg-white">
      <Section pad="pt-[18vh] pb-24" className="text-center">
        <Eyebrow>Something went wrong</Eyebrow>
        <h1 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
          That didn't work. Sorry about that.
        </h1>
        <p className="mx-auto mt-4 max-w-[420px] text-[13px] leading-[1.6] text-black/55">
          Try again in a moment. If it keeps happening, the support page has our
          email and phone.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-[#1A1A1A] px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Back home
          </Link>
          <Link
            to="/contact-support"
            className="text-[13px] underline underline-offset-4 transition-colors hover:text-brand"
          >
            Get help
          </Link>
        </div>
      </Section>
    </div>
  );
};

export default Error;
