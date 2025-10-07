import NavigationBar from "@/app/components/NavigationBar";
import TeamPage from '../../components/TeamPage';

export default async function Team({ params }: { params: { id: number }}) {
  const paramsAwaited = await params;
  return (
    <div>
      <NavigationBar />
      <TeamPage team_id={paramsAwaited.id}/>
    </div>
  );
}
