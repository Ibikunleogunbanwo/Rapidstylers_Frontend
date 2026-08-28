import { Link, useLocation } from "react-router-dom";
const NavItems = () => {
  const location = useLocation();
  return (
    <div className="grid gap-10 pt-8 pb-14 px-8 lg:px-0 text-sm font-medium fixed bg-white lg:bg-transparent">
      <div>
        <Link
          to="/dashboard"
          className={`py-4 px-4 rounded-md ${
            location.pathname === "/dashboard"
              ? "bg-brand text-white cursor-default"
              : "cursor-pointer"
          }`}
        >
          Dashboard
        </Link>
      </div>
      <div>
        <Link
          to="/bookAppointment"
          className={`py-4 px-4 rounded-md ${
            location.pathname === "/bookAppointment"
              ? "bg-brand text-white cursor-default"
              : "cursor-pointer"
          }`}
        >
          Book an appointment
        </Link>
      </div>
      <div>
        <Link
          to="/accountSettings"
          className={`py-4 px-4 rounded-md ${
            location.pathname === "/accountSettings"
              ? "bg-brand text-white cursor-default"
              : "cursor-pointer"
          }`}
        >
          Account settings
        </Link>
      </div>
      <div>
        <Link
          to="/feedback"
          className={`py-4 px-4 rounded-md ${
            location.pathname === "/feedback"
              ? "bg-brand text-white cursor-default"
              : "cursor-pointer"
          }`}
        >
          User feedbacks
        </Link>
      </div>
    </div>
  );
};

export default NavItems;
