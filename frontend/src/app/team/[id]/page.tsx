import NavigationBar from "@/app/components/NavigationBar";
import TeamPage from '../../components/TeamPage';
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { id: number } }
): Promise<Metadata> {
  const paramsAwaited = await params;
  const res = await fetch(
    `${process.env.API_ROOT}/team/${paramsAwaited.id}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return {
      title: "Team",
    };
  }

  const team = await res.json();

  return {
    title: `${team.name}`,
    description: `${team.school} — ${team.div} Division, Group ${team.group}`,
    openGraph: {
      title: team.name,
      description: `${team.school} — ${team.div} Division, Group ${team.group}`,
      url: `https://regentsleague.com/team/${team.id}`,
      images: [
        {
          url: `${process.env.API_ROOT}/photos/${team.logo}`,
          width: 512,
          height: 512,
          alt: `${team.name} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: team.name,
      description: `${team.school} — ${team.div} Division, Group ${team.group}`,
      images: [`${process.env.API_ROOT}/photos/${team.logo}`],
    },
  };
}

export default async function Team({ params }: { params: { id: number }}) {
  const paramsAwaited = await params;
  return (
    <div>
      <NavigationBar />
      <TeamPage team_id={paramsAwaited.id}/>
    </div>
  );
}
