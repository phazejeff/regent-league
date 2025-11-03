'use client';

import React, { useEffect, useState } from "react";
import AddMatchPage from "./AddMatchPage";

interface Player {
  id: number;
  name: string;
  real_name: string;
  year: string;
  major: string;
  main: boolean;
  team_id: number;
  team_sub_id: number;
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
  player_stats: PlayerStat[];
  winner_id: number;
}

interface Team {
  name: string;
  div: string;
  group: string;
  logo: string;
  address: string;
  school: string;
  mainColor: string;
  secondColor: string;
  id: number;
}

interface Match {
  id: number;
  score1: number;
  score2: number;
  datetime: string;
  team1: Team;
  team2: Team;
  winner_id: number;
  maps: MapData[];
}

export default function ManageMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${process.env.API_ROOT}/matches`);
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    }
  };

  const deleteMatch = async (matchId: number) => {
    const password = prompt("Enter password to delete this match:");
    if (!password) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.API_ROOT}/deletematch/${matchId}?password=${password}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errMsg = await res.text();
        alert(`Failed to delete match: ${errMsg}`);
        return;
      }

      alert("Match deleted successfully.");
      await fetchMatches();
    } catch (err) {
      console.error("Error deleting match:", err);
      alert("Failed to delete match due to a network error.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Matches</h1>

      {matches.length === 0 ? (
        <p className="text-gray-500">No matches found.</p>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex flex-col md:flex-row justify-between items-center p-4 rounded-2xl shadow bg-white dark:bg-gray-950"
            >
              {/* Teams */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{match.team1.name}</span>
                </div>

                <span className="text-gray-400 font-medium">vs</span>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">{match.team2.name}</span>
                </div>
              </div>

              {/* Match Info */}
              <div className="text-center md:text-center mt-2 md:mt-0">
                <p className="text-gray-600 dark:text-gray-300">
                  {new Date(match.datetime).toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  {match.score1} - {match.score2}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 md:mt-0">
                <button
                  onClick={() => setSelectedMatch(match)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
                >
                  Edit
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => deleteMatch(match.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white dark:bg-gray-950 p-2 border-b rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Edit Match: {selectedMatch.team1.name} vs {selectedMatch.team2.name}
              </h2>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-red-600 hover:text-red-800 text-3xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <AddMatchPage
                match_id={selectedMatch.id}
                onSubmit={() => {
                  setSelectedMatch(null);
                  fetchMatches();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
