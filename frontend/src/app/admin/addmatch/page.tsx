import AdminNavigationBar from "@/app/components/AdminNavigationBar";
import AddMatchPage from "../../components/AddMatchPage";
import AddUpcomingMatch from "@/app/components/AddUpcomingPage";

export default function AddMatch() {
  return (
    <div>
      <AdminNavigationBar />
      <AddUpcomingMatch />
      <AddMatchPage />
    </div>
  );
}
