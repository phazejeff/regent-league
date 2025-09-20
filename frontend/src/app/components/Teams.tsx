"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Division {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
  logo?: string;
}

interface Player {
  id: number;
  name: string;
  age: number;
  year: string;
  major: string;
  main: boolean;
  team_id: number;
  team_sub_id: number;
}

export default function TeamsByDivision() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedDivId, setSelectedDivId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [playersByTeam, setPlayersByTeam] = useState<Record<number, Player[]>>({});
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [divRes, teamRes] = await Promise.all([
          fetch(`${process.env.API_ROOT}/divisions`),
          fetch(`${process.env.API_ROOT}/teams`),
        ]);

        const divisionsData: Division[] = await divRes.json();
        const teamsData: Team[] = await teamRes.json();

        setDivisions(divisionsData);
        setTeams(teamsData);
        if (divisionsData.length > 0) setSelectedDivId(divisionsData[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchPlayers = async (teamId: number) => {
    if (playersByTeam[teamId]) return; // already cached

    try {
      const res = await fetch(
        `${process.env.API_ROOT}/players?team_id=${teamId}&main_only=true`
      );
      const data: Player[] = await res.json();
      setPlayersByTeam((prev) => ({ ...prev, [teamId]: data }));
    } catch (err) {
      console.error("Failed to fetch players", err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const selectedDivision = divisions.find((d) => d.id === selectedDivId);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Division Buttons */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {divisions.map((div) => (
          <button
            key={div.id}
            onClick={() => setSelectedDivId(div.id)}
            className={`px-6 py-3 rounded-lg text-lg font-semibold transition
              ${
                selectedDivId === div.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white"
              }`}
          >
            {div.name}
          </button>
        ))}
      </div>

      {/* Teams Grid */}
      <AnimatePresence mode="wait">
        {selectedDivision && (
          <motion.div
            key={selectedDivision.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {teams.filter((t) => t.div === selectedDivision.name).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No teams in this division.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {teams
                  .filter((team) => team.div === selectedDivision.name)
                  .map((team) => (
                    <div
                      key={team.id}
                      onMouseEnter={() => {
                        setHoveredTeam(team.id);
                        fetchPlayers(team.id);
                      }}
                      onMouseLeave={() => setHoveredTeam(null)}
                      className="relative"
                    >
                      <Card className="flex flex-col items-center justify-between p-4 h-64 relative overflow-hidden hover:shadow-lg transition">
                        {/* Team name */}
                        <h2 className="text-lg font-semibold text-center mb-2">
                          {team.name}
                        </h2>

                        {/* Logo */}
                        <div className="flex-1 flex items-center justify-center">
                          {team.logo ? (
                            <Image
                              src={`${process.env.API_ROOT}/photos/${team.logo}`}
                              alt={`${team.name} logo`}
                              width={96}
                              height={96}
                              className="object-contain max-h-24"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
                          )}
                        </div>

                        {/* Group */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Group: {team.group}
                        </p>

                        {/* Hover Overlay */}
                        {hoveredTeam === team.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4"
                          >
                            <h3 className="text-md font-semibold mb-2">
                              Players
                            </h3>
                            {playersByTeam[team.id] &&
                            playersByTeam[team.id].length > 0 ? (
                              <ul className="space-y-2 text-base sm:text-lg font-medium text-center">
                                {playersByTeam[team.id].map((p) => (
                                  <li key={p.id}><Link href={`/player/${p.id}`} className="hover:underline">{p.name}</Link></li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-300">
                                No players found
                              </p>
                            )}
                          </motion.div>
                        )}
                      </Card>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
