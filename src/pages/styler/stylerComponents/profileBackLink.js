import { Link } from "react-router-dom";
import arrow from "../../../assets/svg-icons/black-arrow-back.svg";

/** A real, labelled link back to My profile for the profile sub-pages. */
const ProfileBackLink = () => (
  <Link
    to="/styler-dashboard/profile"
    aria-label="Back to My profile"
    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
  >
    <img src={arrow} alt="" className="h-5" />
  </Link>
);

export default ProfileBackLink;
