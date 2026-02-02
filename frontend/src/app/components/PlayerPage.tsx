"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
  logo: string;
}

interface Match {
  score1: number;
  score2: number;
  datetime: string;
  team1: Team;
  team2: Team;
}

interface Map {
  map_num: number;
  map_name: string;
  team1_score: number;
  team2_score: number;
  map_picker_name: string;
  match: Match;
}

interface MapStats {
  K: number;
  A: number;
  D: number;
  ADR: number;
  hs_percent: number;
  KPR: number;
  map: Map;
}

interface Player {
  name: string;
  real_name: string;
  year: string;
  major: string;
  main: boolean;
  faceit_url: string;
  hometown: string;
  former_player: boolean;
  team: Team;
  team_sub?: Team | null;
  map_stats: MapStats[];
}

interface PlayerPageProps {
    playerId: number;
}

function faceitLevelClasses(level: number) {
  switch (level) {
    case 1:
    case 2:
      return "bg-gray-600 text-white";
    case 3:
    case 4:
      return "bg-green-600 text-white";
    case 5:
    case 6:
      return "bg-blue-600 text-white";
    case 7:
    case 8:
      return "bg-purple-600 text-white";
    case 9:
      return "bg-orange-500 text-black";
    case 10:
      return "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]";
    default:
      return "bg-gray-700 text-white";
  }
}

export default function PlayerPage({ playerId }: PlayerPageProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [faceitElo, setFaceitElo] = useState<number | null>(null);
  const [faceitLevel, setFaceitLevel] = useState<number | null>(null);
  const [poops, setPoops] = useState<number[]>([]);

  function getFaceitUsername(url: string) {
    try {
      const parts = new URL(url).pathname.split("/");
      return parts[parts.length - 1]; // last segment
    } catch {
      return null;
    }
  }

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const res = await fetch(`${process.env.API_ROOT}/player/${playerId}`);
        const data = await res.json();
        setPlayer(data);
      } catch (error) {
        console.error("Failed to fetch player:", error);
      } finally {
        setLoading(false);
      }
    }
    if (playerId) fetchPlayer();
  }, [playerId]);

  useEffect(() => {
    async function fetchFaceit(username: string) {
      try {
        const res = await fetch(`/api/faceit/${username}`);
        const data = await res.json();

        setFaceitElo(data.elo);
        setFaceitLevel(data.level);
      } catch (err) {
        console.error("Failed to load Faceit stats", err);
      }
    }

    if (player?.faceit_url) {
      const username = getFaceitUsername(player.faceit_url);
      if (username) fetchFaceit(username);
    }
  }, [player]);

  if (loading) return <p className="text-center py-10">Loading player...</p>;
  if (!player) return <p className="text-center py-10">Player not found</p>;

  // Aggregate stats
  const totalMaps = player.map_stats.length;
  const agg = player.map_stats.reduce(
    (acc, s) => {
      acc.K += s.K;
      acc.A += s.A;
      acc.D += s.D;
      acc.ADR += s.ADR;
      acc.hs_percent += s.hs_percent;
      acc.KPR += s.KPR;
      return acc;
    },
    { K: 0, A: 0, D: 0, ADR: 0, hs_percent: 0, KPR: 0 }
  );
  const avg = {
    K: agg.K / totalMaps,
    A: agg.A / totalMaps,
    D: agg.D / totalMaps,
    ADR: agg.ADR / totalMaps,
    hs_percent: agg.hs_percent / totalMaps,
    KPR: agg.KPR / totalMaps,
  };

  // Group by matches
  const matches: { [key: string]: MapStats[] } = {};
  player.map_stats.forEach((ms) => {
    const matchId = `${ms.map.match.team1.name}-${ms.map.match.team2.name}-${ms.map.match.datetime}`;
    if (!matches[matchId]) matches[matchId] = [];
    matches[matchId].push(ms);
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Overview Card */}
      <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          
          {/* LEFT: Player Info */}
          <div>
            <h1
              className={`text-3xl font-bold ${
                Number(playerId) === 14 ? "hover:cursor-pointer" : ""
              }`}
              onClick={() => {
                if (Number(playerId) === 14) {
                  setPoops((p) => [...p, Date.now()]);
                }
              }}
            >
              {player.name}
            </h1>
            <div className="relative h-0">
              {poops.map((id) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 1, y: 0, x: Math.random() * 150, scale: Math.random() + 1 }}
                  animate={{ opacity: 0, y: 500, x: Math.random() * 150, scale: 1.4 }}
                  transition={{ duration: Math.random() * 3 + 1, ease: "easeOut" }}
                  onAnimationComplete={() =>
                    setPoops((p) => p.filter((x) => x !== id))
                  }
                  className="absolute text-3xl"
                >
                  💩
                </motion.div>
              ))}
            </div>
            <p className="text-lg text-gray-300">{player.real_name}</p>
            <p className="text-lg text-gray-300">{player.hometown}</p>
            <p className="mt-1 text-sm">
              {player.year} • {player.major}
            </p>

            <div className="flex items-center gap-6 mt-4">
              {/* Main Team */}
              <div className="flex items-center gap-2">
                {player.team.logo && (
                  <Image
                    src={`${process.env.API_ROOT}/photos/${player.team.logo}`}
                    alt={player.team.name}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                )}
                <span className="font-semibold">
                  <Link href={`/team/${player.team.id}`} className="hover:underline">
                    {player.team.name}
                  </Link>
                </span>
              </div>

              {/* Sub Team */}
              {player.team_sub && (
                <div className="flex items-center gap-2">
                  {player.team_sub.logo && (
                    <Image
                      src={`${process.env.API_ROOT}/photos/${player.team_sub.logo}`}
                      alt={player.team_sub.name}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  )}
                  <span className="font-semibold">
                    <Link href={`/team/${player.team_sub.id}`} className="hover:underline">
                      {player.team_sub.name}
                    </Link>{" "}
                    (sub)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Faceit Stats */}
          {(faceitElo !== null || faceitLevel !== null) && (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-900/60 px-5 py-4 text-sm text-zinc-200 min-w-[180px]">
              {faceitLevel !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">
                    Level {faceitLevel}
                  </span>
                </div>
              )}

              {faceitElo !== null && (
                <div className="text-center">
                  <span className="text-xs uppercase tracking-wide text-zinc-400">
                    Faceit Elo
                  </span>
                  <div className="text-lg font-semibold text-white">
                    {faceitElo}
                  </div>
                </div>
              )}

              <Link
                href={player.faceit_url}
                target="_blank"
                className="mt-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                View Faceit →
              </Link>
            </div>
          )}
        </div>

        {/* Aggregated Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div>
            <p className="text-lg font-bold">{avg.K.toFixed(1)}</p>
            <p className="text-sm">Kills Per Game</p>
          </div>
          <div>
            <p className="text-lg font-bold">{avg.A.toFixed(1)}</p>
            <p className="text-sm">Assists Per Game</p>
          </div>
          <div>
            <p className="text-lg font-bold">{avg.D.toFixed(1)}</p>
            <p className="text-sm">Deaths Per Game</p>
          </div>
          <div>
            <p className="text-lg font-bold">{avg.ADR.toFixed(1)}</p>
            <p className="text-sm">ADR</p>
          </div>
          <div>
            <p className="text-lg font-bold">{avg.hs_percent.toFixed(1)}%</p>
            <p className="text-sm">HS%</p>
          </div>
          <div>
            <p className="text-lg font-bold">{avg.KPR.toFixed(1)}</p>
            <p className="text-sm">KPR</p>
          </div>
        </div>
      </div>

      {/* Match Stats */}
      <div className="space-y-4 text-white">
        {Object.entries(matches).map(([matchId, maps]) => {
          const { match } = maps[0].map;
          return (
            <div
              key={matchId}
              className="bg-black/20 backdrop-blur-md rounded-xl p-4 shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">
                  {match.team1.name} vs {match.team2.name}
                </h2>
                <span className="text-sm opacity-70">
                  {new Date(match.datetime).toLocaleString()}
                </span>
              </div>
              <div className="text-sm mb-4">
                Final Score: {match.score1} - {match.score2}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {maps.map((ms, i) => (
                  <div
                    key={i}
                    className="bg-black/30 rounded-lg p-3 flex flex-col text-sm"
                  >
                    <span className="font-semibold">
                      Map {ms.map.map_num}: {ms.map.map_name}
                    </span>
                    <span>
                      Score: {ms.map.team1_score} - {ms.map.team2_score}
                    </span>
                    <span>K/A/D: {ms.K}/{ms.A}/{ms.D}</span>
                    <span>ADR: {ms.ADR}</span>
                    <span>HS%: {ms.hs_percent}%</span>
                    <span>KPR: {ms.KPR}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
