import AdminNavigationBar from "@/app/components/AdminNavigationBar";
import AddPlayersPage from "../../components/AddPlayersPage";
import PlayerEditor from "@/app/components/PlayerEditor";

export default function AddPlayers() {
  return (
    <div>
      <AdminNavigationBar />
      <AddPlayersPage />
      <PlayerEditor />
    </div>
  );
}
