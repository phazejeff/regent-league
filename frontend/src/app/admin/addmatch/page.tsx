import AdminNavigationBar from "@/app/components/AdminNavigationBar";
// import AddMatchPage from "../../components/AddMatchPage";
import AddUpcomingMatch from "@/app/components/AddUpcomingPage";
import ManageUpcoming from "@/app/components/ManageUpcoming";

export default function AddMatch() {
  return (
    <div>
      <AdminNavigationBar />
      <AddUpcomingMatch />
      <ManageUpcoming />
      {/* <AddMatchPage /> */}
    </div>
  );
}
