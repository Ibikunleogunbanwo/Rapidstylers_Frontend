import History from "../components/appointment-history";
import Appointments from "../components/upcoming-appointments";

const Dashboard = () => {
  document.title = "Dashboard - TrimTech";
  return (
    <div className="bg-white border rounded-lg">
      <div className="border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">Dashboard</div>
      <div className="p-4">
        <p className="text-sm font-semibold">Upcoming appointments:</p>
        <Appointments />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold">Appointment history:</p>
        <History />
      </div>
    </div>
  );
};

export default Dashboard;
