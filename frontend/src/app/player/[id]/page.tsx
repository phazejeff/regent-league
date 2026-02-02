import PlayerPage from "@/app/components/PlayerPage";
import NavigationBar from "@/app/components/NavigationBar";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { id: number } }
): Promise<Metadata> {
  const paramsAwaited = await params;
  const res = await fetch(
    `${process.env.API_ROOT}/player/${paramsAwaited.id}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return {
      title: "Player",
    };
  }

  const player = await res.json();

  return {
    title: `${player.name} - Regent League`,
    description: `${player.real_name} - ${player.former_player ? 'Former player for ' : ''} ${player.team.school}`,
    openGraph: {
      title: `${player.name} - Regent League`,
      description: `${player.real_name} - ${player.former_player ? 'Former player for ' : ''} ${player.team.school}`,
      url: `https://regentsleague.com/player/${player.id}`,
      images: [
        {
          url: `${process.env.API_ROOT}/photos/${player.team.logo}`,
          height: 512,
          alt: `${player.team.name} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${player.name} - Regent League`,
      description: `${player.real_name} - ${player.former_player ? 'Former player for ' : ''} ${player.team.school}`,
      images: [`${process.env.API_ROOT}/photos/${player.team.logo}`],
    },
  };
}

export default async function Player({ params }: { params: { id: number }}) {
  const paramsAwaited = await params;
  return (
    <div>
      <NavigationBar />
      <PlayerPage playerId={paramsAwaited.id}/>
    </div>
  );
}
