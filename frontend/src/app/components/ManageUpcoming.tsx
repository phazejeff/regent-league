'use client'
import React, { useEffect, useState } from "react";
import AddMatchPage from "./AddMatchPage";

type StreamMap = Record<string, string>;

interface Team {
  name: string;
  div: string;
  group: string;
  logo: string;
  id: number;
  mainColor: string;
}

interface Match {
  id: number;
  week: number;
  datetime: string;
  division: string;
  team1_streams: StreamMap;
  team2_streams: StreamMap;
  team1: Team;
  team2: Team;
}

export default function ManageUpcoming() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${process.env.API_ROOT}/getupcoming`);
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    }
  };
  
  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upcoming Matches</h1>

      {matches.length === 0 ? (
        <p className="text-gray-500">No upcoming matches.</p>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row justify-between items-center p-4 rounded-2xl shadow bg-white dark:bg-gray-950"
            >
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{match.team1.name}</span>
                </div>

                <span className="text-gray-400 font-medium">vs</span>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">{match.team2.name}</span>
                </div>
              </div>

              <div className="text-center md:text-center mt-2 md:mt-0">
                <p className="text-gray-600 dark:text-gray-300">
                  {new Date(match.datetime).toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Week {match.week} · {match.division}
                </p>
              </div>

              <button
                onClick={() => setSelectedMatch(match)}
                className="mt-3 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Finalize Results
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Floating Box Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          {/* Sticky header so close button always visible */}
          <div className="sticky top-0 bg-white dark:bg-gray-950 p-2 border-b rounded-t-2xl flex justify-between items-center">
            <h2 className="text-xl font-semibold">
            Finalize: {selectedMatch.team1.name} vs {selectedMatch.team2.name}
            </h2>
            <button
            onClick={() => setSelectedMatch(null)}
            className="text-red-600 hover:text-red-800 text-3xl"
            >
            ✕
            </button>
          </div>

          {/* Content area */}
          <div className="p-6">
            <AddMatchPage 
            _team1Id={selectedMatch.team1.id.toString()} 
            _team2Id={selectedMatch.team2.id.toString()}
            _datetime={selectedMatch.datetime}
            _upcomingId={selectedMatch.id}
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
};
