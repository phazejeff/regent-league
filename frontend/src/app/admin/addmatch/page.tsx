import AdminNavigationBar from "@/app/components/AdminNavigationBar";
// import AddMatchPage from "../../components/AddMatchPage";
import AddUpcomingMatch from "@/app/components/AddUpcomingPage";
import ManageUpcoming from "@/app/components/ManageUpcoming";
import ManageMatches from "@/app/components/ManageMatches";

export default function AddMatch() {
  return (
    <div>
      <AdminNavigationBar />
      <AddUpcomingMatch />
      <ManageUpcoming />
      <ManageMatches />
      {/* <AddMatchPage /> */}
    </div>
  );
}
