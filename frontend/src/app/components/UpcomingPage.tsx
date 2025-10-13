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
  mainColor?: string;
  secondColor?: string;
};

type UpcomingMatch = {
  week: number;
  datetime: string;
  division: string;
  casted: boolean;
  team1: Team;
  team2: Team;
  team1_streams?: Record<string, string>;
  team2_streams?: Record<string, string>;
};

type Division = {
  id: number;
  name: string;
};

export default function UpcomingMatchesPage() {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivId, setSelectedDivId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async (divName?: string) => {
    try {
      const url = divName
        ? `${process.env.API_ROOT}/getupcoming?div=${encodeURIComponent(divName)}`
        : `${process.env.API_ROOT}/getupcoming`;
      const res = await fetch(url);
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      console.error("Failed to fetch upcoming matches:", err);
    }
  };

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const res = await fetch(`${process.env.API_ROOT}/divisions`);
        const data: Division[] = await res.json();
        setDivisions(data);
        if (data.length > 0) {
          setSelectedDivId(data[0].id);
          fetchMatches(data[0].name);
        } else {
          fetchMatches();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDivisions();
  }, []);

  const selectedDivision = divisions.find((d) => d.id === selectedDivId);

  const handleDivisionClick = (div: Division) => {
    setSelectedDivId(div.id);
    fetchMatches(div.name);
  };

  if (loading) return <div className="p-4 text-center text-white">Loading...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-white">
        Upcoming Matches
      </h1>

      {/* Division Buttons */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {divisions.map((div) => (
          <button
            key={div.id}
            onClick={() => handleDivisionClick(div)}
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

      {/* Matches List */}
      {matches.length > 0 ? (
        matches.map((match, idx) => {
          const team1Color = match.team1.mainColor || "#9b1c1c";
          const team2Color = match.team2.mainColor || "#065f46";
          const team1Secondary = match.team1.secondColor || "#000000";
          const team2Secondary = match.team2.secondColor || "#000000";
          const isLive = new Date() >= new Date(match.datetime);

          return (
            <div
              key={idx}
              className={`relative flex flex-col md:flex-row justify-between items-center text-white rounded-2xl shadow-2xl overflow-hidden border-4 ${
                isLive ? "border-red-600 animate-pulse" : "border-black"
              }`}
              style={{
                background: `linear-gradient(90deg, ${team1Color}, ${team2Color})`,
              }}
            >
              {/* LIVE Badge */}
              {isLive && (
                <div className="absolute top-2 right-2 bg-red-600 text-white font-bold px-3 py-1 rounded-full shadow-md text-sm">
                  LIVE
                </div>
              )}

              {/* Left Side */}
              <div className="flex flex-col items-center justify-center p-4 md:w-1/3 text-center space-y-3">
                <h2 className="text-xl font-semibold">
                  <Link className="hover:underline" href={`/team/${match.team1.id}`}>
                    {match.team1.name}
                  </Link>
                </h2>

                {/* Circular logo container */}
                <div
                  className="w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: team1Secondary,
                    borderColor: "black",
                  }}
                >
                  <Image
                    src={`${process.env.API_ROOT}/photos/${match.team1.logo}`}
                    alt={match.team1.name}
                    width={130}
                    height={130}
                    className="object-contain"
                  />
                </div>

                {match.team1_streams && Object.keys(match.team1_streams).length > 0 && (
                  <div className="mt-2 text-sm">
                    Streams: <br />
                    {Object.entries(match.team1_streams).map(([name, url], i) => (
                      <span key={i}>
                        <Link
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-gray-300"
                        >
                          {name}
                        </Link>
                        {i < Object.keys(match.team1_streams!).length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Center VS Section */}
              <div className="flex flex-col justify-center items-center text-center p-4 md:w-1/3 bg-black/40 backdrop-blur-sm rounded-2xl mx-2">
                <div className="text-lg font-semibold">
                  Group {match.team1.group}
                </div>
                <div className="text-sm mb-1">Week {match.week}</div>
                <div className="text-5xl font-extrabold my-2">VS</div>
                <div className="text-sm font-medium">
                  Time:{" "}
                  {new Date(match.datetime).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div> PST
                <div className="mt-2 text-sm">
                  {match.casted && (
                    <>
                      🎥 Main Stream:{" "}
                      <Link
                        href="https://twitch.tv/Regent_XD"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-gray-300"
                      >
                        RegentXD
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex flex-col items-center justify-center p-4 md:w-1/3 text-center space-y-3">
                <h2 className="text-xl font-semibold">
                  <Link className="hover:underline" href={`/team/${match.team2.id}`}>
                    {match.team2.name}
                  </Link>
                </h2>

                {/* Circular logo container */}
                <div
                  className="w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: team2Secondary,
                    borderColor: "black",
                  }}
                >
                  <Image
                    src={`${process.env.API_ROOT}/photos/${match.team2.logo}`}
                    alt={match.team2.name}
                    width={130}
                    height={130}
                    className="object-contain"
                  />
                </div>

                {match.team2_streams && Object.keys(match.team2_streams).length > 0 && (
                  <div className="mt-2 text-sm">
                    Streams: <br />
                    {Object.entries(match.team2_streams).map(([name, url], i) => (
                      <span key={i}>
                        <Link
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-gray-300"
                        >
                          {name}
                        </Link>
                        {i < Object.keys(match.team2_streams!).length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-gray-400 text-lg">
          No upcoming matches scheduled{selectedDivision ? ` for ${selectedDivision.name}` : ""}.
        </p>
      )}
    </div>
  );
}
