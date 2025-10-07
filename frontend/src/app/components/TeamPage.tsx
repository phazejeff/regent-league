"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface Player {
  id: number;
  name: string;
  real_name: string | null;
  major: string;
  year: string;
  main: boolean;
}

interface TeamInfo {
  id: number;
  name: string;
  logo: string;
  div: string;
  group: string;
  address?: string | null;
  school?: string | null;
  mainColor?: string;
}

interface PlayerStat {
  K: number;
  A: number;
  D: number;
  ADR: number;
  hs_percent: number;
  accuracy: number;
  player: Player;
}

interface MapData {
  map_num: number;
  map_name: string;
  team1_score: number;
  team2_score: number;
  map_picker_name: string;
  winner_id: number;
  player_stats: PlayerStat[];
}

interface Match {
  id: number;
  datetime: string;
  score1: number;
  score2: number;
  team1: TeamInfo;
  team2: TeamInfo;
  maps: MapData[];
  winner_id?: number;
  week?: number;
  division?: string;
}

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
  logo: string;
  address: string;
  school: string;
  players: Player[];
  sub_players: Player[];
  matches_as_team1: Match[];
  matches_as_team2: Match[];
  upcoming_as_team1: Match[];
  upcoming_as_team2: Match[];
  mainColor: string;
}

interface TeamPageProps {
  team_id: number;
}

export default function TeamPage({ team_id }: TeamPageProps) {
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      const res = await fetch(`${process.env.API_ROOT}/team/${team_id}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    }
    if (team_id) fetchTeam();
  }, [team_id]);

  if (!team) {
    return (
      <div className="flex justify-center items-center min-h-screen text-muted-foreground">
        Loading team info...
      </div>
    );
  }

  // Combine matches
  const pastMatches = [...team.matches_as_team1, ...team.matches_as_team2].sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  );
  const upcomingMatches = [...team.upcoming_as_team1, ...team.upcoming_as_team2].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  // Helper to get opponent
  const getOpponent = (match: Match) =>
    match.team1.id === team.id ? match.team2 : match.team1;

  // Helper to determine win/loss
  const isWin = (match: Match) => match.winner_id === team.id;

  const isMapWin = (map: MapData) => map.winner_id === team.id;

  return (
    <div className="min-h-screen text-foreground py-10 px-4 md:px-12 lg:px-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <Image
          src={`${process.env.API_ROOT}/photos/${team.logo}`}
          alt={team.name}
          width={150}
          height={150}
          className="rounded-xl shadow-md object-contain"
        />
        <div>
          <h1 className="text-4xl font-bold text-white">{team.name}</h1>
          <p className="text-lg mt-2">{team.school}</p>
          <p className="text-sm text-muted-foreground">{team.address}</p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="bg-muted px-3 py-1 rounded-md">Div {team.div}</span>
            <span className="bg-muted px-3 py-1 rounded-md">Group {team.group}</span>
          </div>
        </div>
      </div>

      {/* Players */}
      <Card className="mb-12 border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Players</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.players.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="p-4 rounded-lg border bg-card shadow-sm"
            >
              <h3 className="text-lg font-semibold hover:underline">
                <Link href={`/player/${p.id}`}>
                  {p.name}
                </Link>
              </h3>
              {p.real_name && <p className="text-sm text-muted-foreground">{p.real_name}</p>}
              <p className="text-sm mt-1">Major: {p.major}</p>
              <p className="text-sm">Year: {p.year}</p>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Sub Players */}
      {team.sub_players.length > 0 && 
        <Card className="mb-12 border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Substitute Players</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.sub_players.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
                className="p-4 rounded-lg border bg-card shadow-sm"
              >
                <h3 className="text-lg font-semibold hover:underline">
                  <Link href={`/player/${p.id}`}>
                    {p.name}
                  </Link>
                </h3>
                {p.real_name && <p className="text-sm text-muted-foreground">{p.real_name}</p>}
                <p className="text-sm mt-1">Major: {p.major}</p>
                <p className="text-sm">Year: {p.year}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      }
      
      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <Card className="mb-12 border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMatches.map((m) => {
              const opponent = getOpponent(m);
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="p-4 rounded-md bg-card border flex flex-col md:flex-row items-center gap-4"
                >
                  <Image
                    src={`${process.env.API_ROOT}/photos/${opponent.logo}`}
                    alt={opponent.name}
                    width={60}
                    height={60}
                    className="rounded-lg object-contain"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(m.datetime).toLocaleString()}
                    </p>
                    <p>
                      Week {m.week ?? "-"} | Div {m.division ?? "-"}
                    </p>
                    <p>
                      vs{" "}
                      <Link
                        href={`/team/${opponent.id}`}
                        className="text-primary hover:underline font-bold hover:text-primary/80"
                      >
                        {opponent.name}
                      </Link>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Past Matches */}
      {pastMatches.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Past Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastMatches.map((m) => {
              const opponent = getOpponent(m);
              const ourScore = m.team1.id === team.id ? m.score1 : m.score2;
              const theirScore = m.team1.id === team.id ? m.score2 : m.score1;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="p-4 rounded-md bg-card border"
                >
                  <div className="flex justify-between items-center flex-wrap">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(m.datetime).toLocaleString()}
                      </p>
                      <p>
                        vs{" "}
                        <Link
                          href={`/team/${opponent.id}`}
                          className="text-primary hover:underline font-bold hover:text-primary/80"
                        >
                          {opponent.name}
                        </Link>{" "}
                        ({ourScore} - {theirScore})
                      </p>
                    </div>
                    <span
                      className={`font-semibold ${
                        isWin(m) ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {isWin(m) ? "Win" : "Loss"}
                    </span>
                  </div>

                  {/* Map Summary */}
                  {m.maps?.length > 0 && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      {m.maps.map((map) => (
                        <div
                          key={map.map_num}
                          className="border rounded-md px-2 py-1 flex justify-between"
                        >
                          <span>{map.map_name}</span>
                          <span>
                            {map.team1_score}-{map.team2_score}
                          </span>
                          <span
                            className={`font-semibold ${
                              isMapWin(map) ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {isMapWin(map) ? "Win" : "Loss"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
