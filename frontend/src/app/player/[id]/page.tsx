import PlayerPage from "@/app/components/PlayerPage";
import NavigationBar from "@/app/components/NavigationBar";

export default async function Player({ params }: { params: { id: number }}) {
  const paramsAwaited = await params;
  return (
    <div>
      <NavigationBar />
      <PlayerPage playerId={paramsAwaited.id}/>
    </div>
  );
}
