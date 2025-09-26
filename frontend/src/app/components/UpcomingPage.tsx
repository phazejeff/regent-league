"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Team = {
  name: string;
  div: string;
  group: string;
  logo: string;
  id: number;
  mainColor?: string; // (optional — if you extract color)
};

type UpcomingMatch = {
  week: number;
  datetime: string;
  division: string;
  streams: Record<string, string>;
  team1: Team;
  team2: Team;
};

export default function UpcomingMatchesPage() {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);

  useEffect(() => {
    fetch(`${process.env.API_ROOT}/getupcoming`)
      .then((res) => res.json())
      .then(setMatches)
      .catch((err) => console.error("Failed to fetch upcoming matches:", err));
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-white">
        Upcoming Matches
      </h1>

      {matches.length > 0 ? (
        matches.map((match, idx) => {
          const team1Color = match.team1.mainColor || "#9b1c1c"; // fallback red
          const team2Color = match.team2.mainColor || "#065f46"; // fallback green

          return (
            <div
              key={idx}
              className="relative flex flex-col md:flex-row justify-between items-center text-white rounded-2xl shadow-2xl border-4 border-black overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${team1Color}, ${team2Color})`,
              }}
            >
              {/* Left Side */}
              <div className="flex flex-col items-center justify-center p-4 md:w-1/3 text-center space-y-3">
                <h2 className="text-xl font-semibold">{match.team1.name}</h2>
                <Image
                  src={`${process.env.API_ROOT}/photos/${match.team1.logo}`}
                  alt={match.team1.name}
                  width={150}
                  height={150}
                  className="rounded-full border-4 border-black bg-white p-2"
                />
              </div>

              {/* Center VS Section */}
              <div className="flex flex-col justify-center items-center text-center p-4 md:w-1/3 bg-black/40 backdrop-blur-sm rounded-2xl mx-2">
                <div className="text-lg font-semibold">
                  Group {match.team1.group}
                </div>
                <div className="text-sm mb-1">Week {match.week}</div>
                <div className="text-5xl font-extrabold my-2">VS</div>
                <div className="text-sm font-medium">
                  Time: {new Date(match.datetime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {match.streams && Object.keys(match.streams).length > 0 && (
                  <div className="mt-2 text-sm">
                    Twitch:{" "}
                    {Object.entries(match.streams).map(([name, url], i) => (
                      <Link
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-gray-300"
                      >
                        {name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side */}
              <div className="flex flex-col items-center justify-center p-4 md:w-1/3 text-center space-y-3">
                <h2 className="text-xl font-semibold">{match.team2.name}</h2>
                <Image
                  src={`${process.env.API_ROOT}/photos/${match.team2.logo}`}
                  alt={match.team2.name}
                  width={150}
                  height={150}
                  className="rounded-full border-4 border-black bg-white p-2"
                />
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-gray-400 text-lg">
          No upcoming matches scheduled.
        </p>
      )}
    </div>
  );
}
