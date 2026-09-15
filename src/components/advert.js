import { Link } from "react-router-dom";
import barbers from "../assets/images/barbers.jpg";

/**
 * The sidebar booking card, in the site's quiet register: a hairline card on
 * white, an 4:3 photo in a hairline frame, and one solid-brand pill CTA (the
 * same shape as the empty state's). It used to be a dark slab with a shadow
 * hotlinking an expired-token freepik image, which rendered as a broken
 * request in production.
 */
const Advert = () => {
  return (
    <div className="rounded-lg border border-black/10 bg-white overflow-hidden">
      <p className="px-5 pt-4 text-[11px] uppercase tracking-[0.2em] text-muted font-semibold">
        Advertisement
      </p>
      <div className="px-5 pt-3">
        <img
          src={barbers}
          alt="Barber at work"
          className="aspect-[4/3] w-full rounded-md border border-black/10 object-cover"
          loading="lazy"
        />
      </div>
      <div className="px-5 pt-4">
        <p className="font-semibold leading-snug text-onSurface">
          Find your perfect fit: top beauty professionals near you
        </p>
        <p className="text-sm text-muted mt-1">
          Book from home and enjoy in-home appointments
        </p>
      </div>
      <div className="px-5 pb-5 pt-4">
        <Link
          to="/bookAppointment"
          className="inline-block rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Book now
        </Link>
      </div>
    </div>
  );
};

export default Advert;
