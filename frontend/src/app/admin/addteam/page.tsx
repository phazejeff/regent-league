import AdminNavigationBar from "@/app/components/AdminNavigationBar";
import AddTeamPage from "../../components/AddTeamPage";
import DivsAndGroupsEditor from "@/app/components/EditGroups";

export default function Matches() {
  return (
    <div>
      <AdminNavigationBar />
      <AddTeamPage />
      <DivsAndGroupsEditor />
    </div>
  );
}
