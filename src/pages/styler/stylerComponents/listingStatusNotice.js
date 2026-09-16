import { useEffect, useState } from "react";
import { APIService } from "../../../hooks/remote/apiService";
import { SUPPORT_EMAIL } from "../../../utils/constant";

/**
 * The one thing a professional cannot work out from their own dashboard.
 *
 * Public search, the profile page and nearby results all require a business
 * address, because visiting the professional is the default way a booking is
 * delivered and a customer with no destination cannot travel. So a profile
 * with no address is invisible, and nothing on the dashboard said why: the
 * professional simply saw no new bookings. This notice names the cause and
 * gives them the one action that fixes it.
 *
 * It renders nothing while loading and nothing when an address is on file, so
 * it can sit in the dashboard shell without becoming furniture.
 */
const ListingStatusNotice = () => {
  const [summary, setSummary] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    APIService.getStylerBusinessSummary()
      .then((response) => setSummary(response.data?.data || null))
      .catch(() => setSummary(null))
      .finally(() => setLoaded(true));
  }, []);

  // Unknown state (still loading, or the summary could not be read) stays
  // silent: a warning that might be wrong is worse than no warning.
  if (!loaded || !summary || summary.addressOnFile !== false) return null;

  return (
    <div className="mx-4 mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">
        You are not showing in search
      </p>
      <p className="mt-1 max-w-[640px] text-[13px] leading-[1.6] text-amber-800">
        Your profile has no business address, and clients travel to that address when
        they book a visit, so we cannot list a profile without one. Email us your
        address and we will add it. You will appear in search as soon as it is on file.
      </p>
      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=Business%20address%20for%20my%20RapidStylers%20profile`}
        className="mt-2 inline-block text-[13px] font-semibold text-amber-900 underline"
      >
        Send us your address
      </a>
    </div>
  );
};

export default ListingStatusNotice;
