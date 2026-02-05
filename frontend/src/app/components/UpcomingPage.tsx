"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DateTime } from "luxon";

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
  main_stream_name: string;
  main_stream_url: string;
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
  const [liveStreams, setLiveStreams] = useState<Record<string, boolean>>({});
  const [standings, setStandings] = useState<
    Record<number, { rank: number; matchRecord: string }>
  >({});
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  const fetchMatches = async (divName?: string, group?: string) => {
    try {
      const url = divName
        ? `${process.env.API_ROOT}/getupcoming?div=${encodeURIComponent(divName)}`
        : `${process.env.API_ROOT}/getupcoming`;

      const res = await fetch(url);
      const data: UpcomingMatch[] = await res.json();
      setMatches(data);

      const groups = Array.from(
        new Set(
          data
            .map((m) => m.team1.group)
            .filter(Boolean)
        )
      ).sort();

      setAvailableGroups(groups);

      const activeGroup = group ?? groups[0] ?? null;
      setSelectedGroup(activeGroup);

      if (divName && activeGroup) {
        const standingsUrl = `${process.env.API_ROOT}/standings?div=${encodeURIComponent(
          divName
        )}&group=${encodeURIComponent(activeGroup)}`;

        const standingsRes = await fetch(standingsUrl);
        const standingsData = await standingsRes.json();

        const standingsMap: Record<number, { rank: number; matchRecord: string }> =
          {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        standingsData.forEach((entry: any, index: number) => {
          standingsMap[entry.team.id] = {
            rank: index + 1,
            matchRecord: `${entry.match_wins}-${entry.match_losses}`,
          };
        });

        setStandings(standingsMap);
      } else {
        setStandings({});
      }
    } catch (err) {
      console.error("Failed to fetch upcoming matches or standings:", err);
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

    const checkIsStreamOn = async () => {
      try {
        const res = await fetch(`${process.env.API_ROOT}/getupcoming`);
        const upcomingMatches: UpcomingMatch[] = await res.json();

        const usernames = upcomingMatches
          .filter((m) => m.casted && m.main_stream_url)
          .map((m) =>
            m.main_stream_url
              ?.replace("https://www.twitch.tv/", "")
              ?.replace("https://twitch.tv/", "")
              ?.split("/")[0]
          )
          .filter(Boolean);

        const statusMap: Record<string, boolean> = {};

        for (const username of usernames) {
          const response = await fetch(
            `${process.env.API_ROOT}/islive?username=${encodeURIComponent(username!)}`
          );
          const isLive = await response.json();
          statusMap[username!] = !!isLive;
        }

        setLiveStreams(statusMap);
      } catch (err) {
        console.error("Error fetching live statuses:", err);
      }
    };


    checkIsStreamOn();
  }, []);


  const selectedDivision = divisions.find((d) => d.id === selectedDivId);
  const filteredMatches = selectedGroup
  ? matches.filter((m) => m.team1.group === selectedGroup)
  : matches;

  const handleDivisionClick = (div: Division) => {
    setSelectedDivId(div.id);
    setSelectedGroup(null);
    fetchMatches(div.name);
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) return <div className="p-4 text-center text-white">Loading...</div>;

  function TwitchChatEmbed({ streamUrl }: { streamUrl: string }) {
    const twitchUsername = streamUrl.replace("www.", "").replace("https://twitch.tv/", "").replace("/", "");
    return (
      <div className="w-full h-[500px] mt-4 mb-4 mr-4 rounded-2xl overflow-hidden border border-gray-700">
        <iframe
          src={`https://www.twitch.tv/embed/${twitchUsername}/chat?parent=localhost&parent=regent-league.vercel.app&parent=regentsleague.poopdealer.lol`}
          height="100%"
          width="100%"
          allowFullScreen
        ></iframe>
      </div>
    );
  }


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
      
      {/* Group Filter */}
      {availableGroups.length > 1 && (
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {availableGroups.map((group) => (
            <button
              key={group}
              onClick={() => {
                setSelectedGroup(group);
                fetchMatches(selectedDivision?.name, group);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition
                ${
                  selectedGroup === group
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-purple-500 hover:text-white"
                }`}
            >
              Group {group}
            </button>
          ))}
        </div>
      )}

      {/* Matches List */}
      {filteredMatches.length > 0 ? (
        filteredMatches.map((match, idx) => {
          const team1Color = match.team1.mainColor || "#9b1c1c";
          const team2Color = match.team2.mainColor || "#065f46";
          const team1Secondary = match.team1.secondColor || "#000000";
          const team2Secondary = match.team2.secondColor || "#000000";
          const matchtime = DateTime.fromISO(match.datetime, { zone: "utc" });
          const now = DateTime.now();
          const hoursSinceMatch = now.diff(matchtime, "hours").hours;

          const isLive = hoursSinceMatch >= 0 && hoursSinceMatch < 5;
          const isFinishedAwaitingResults = hoursSinceMatch >= 5;


          return (
            <div
              key={idx}
              className={`relative flex flex-col md:flex-row justify-between md:items-start items-center text-white rounded-2xl shadow-2xl overflow-hidden border-4 ${
                isLive
                  ? "border-red-600 animate-pulse"
                  : match.casted
                  ? "border-purple-600"
                  : "border-black"
              }`}
              style={{
                background: `linear-gradient(${isMobile ? "180deg" : "90deg"}, ${team1Color}, ${team2Color})`,
              }}
            >
              {/* LIVE Badge */}
              {isLive && (
                <div className="absolute top-2 right-2 bg-red-600 text-white font-bold px-3 py-1 rounded-full shadow-md text-sm">
                  LIVE
                </div>
              )}

              {isFinishedAwaitingResults && (
                <div className="absolute top-2 right-2 bg-gray-300 text-black font-bold px-3 py-1 rounded-full shadow-md text-sm whitespace-nowrap">
                  Finished
                </div>
              )}

              {/* Left Side */}
              <div className="flex flex-col items-center justify-center p-4 md:w-1/3 text-center space-y-3">
                <div className="flex flex-col items-center gap-1">
                  {/* Container for rank + team name */}
                  <div className="relative flex items-center justify-center">
                    <Link
                      className="text-xl font-semibold hover:underline text-white text-center"
                      href={`/team/${match.team1.id}`}
                    >
                    {/* {standings[match.team1.id]?.rank && `(#${standings[match.team1.id].rank})`} {match.team1.name} */}
                    {match.team1.name}
                    </Link>
                  </div>

                  {standings[match.team1.id] && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-sm text-gray-200 bg-black/40 px-2 py-[2px] rounded">
                      ({standings[match.team1.id].matchRecord})
                    </p>
                  </div>
                )}
                </div>

                {/* Add space before logo */}
                <div
                  className="relative w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center overflow-hidden mt-3"
                  style={{
                    backgroundColor: team1Secondary,
                    borderColor: "black",
                  }}
                >
                  <Link href={`/team/${match.team1.id}`}>
                    <Image
                      src={`${process.env.API_ROOT}/photos/${match.team1.logo}`}
                      alt={match.team1.name}
                      fill
                      className="object-contain p-4"
                      sizes="150px"
                      priority
                    />
                  </Link>
                </div>

                {/* Streams */}
                {match.team1_streams && Object.keys(match.team1_streams).length > 0 && (
                  <div className="mt-2 text-sm bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
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
              <div className="flex flex-col justify-center self-center items-center text-center p-4 md:w-1/3 bg-black/40 backdrop-blur-sm rounded-2xl mx-2">
                <div className="text-lg font-semibold">
                  Group {match.team1.group}
                </div>
                <div className="text-sm mb-1">Week {match.week}</div>
                <div className="text-5xl font-extrabold my-2">VS</div>
                <div className="text-sm font-medium">
                  {DateTime.fromISO(match.datetime, { zone: "utc" }).toLocal().toLocaleString(DateTime.DATETIME_HUGE)}
                </div>
                <div className="mt-2 text-sm">
                  {match.casted && (
                    <>
                      🎥 Main Stream:{" "}
                      <Link
                        href={match.main_stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-gray-300"
                      >
                        {match.main_stream_name}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex flex-col items-center justify-center p-4 md:w-1/3 text-center space-y-3">
                <div className="flex flex-col items-center gap-1">
                  {/* Container for rank + team name */}
                  <div className="relative flex items-center justify-center">
                    <Link
                      className="text-xl font-semibold hover:underline text-white text-center"
                      href={`/team/${match.team2.id}`}
                    >
                      {/* {standings[match.team2.id]?.rank && `(#${standings[match.team2.id].rank})`} {match.team2.name} */}
                      {match.team2.name}
                    </Link>
                  </div>

                  {standings[match.team2.id] && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {/* Record box */}
                    <p className="text-sm text-gray-200 bg-black/40 px-2 py-[2px] rounded">
                      ({standings[match.team2.id].matchRecord})
                    </p>
                  </div>
                )}
                </div>

                <div
                  className="relative w-[150px] h-[150px] rounded-full border-4 flex items-center justify-center overflow-hidden mt-3"
                  style={{
                    backgroundColor: team2Secondary,
                    borderColor: "black",
                  }}
                >
                  <Link href={`/team/${match.team2.id}`}>
                    <Image
                      src={`${process.env.API_ROOT}/photos/${match.team2.logo}`}
                      alt={match.team2.name}
                      fill
                      className="object-contain p-4"
                      sizes="150px"
                      priority
                    />
                  </Link>
                </div>

                {/* Streams */}
                {match.team2_streams && Object.keys(match.team2_streams).length > 0 && (
                  <div className="mt-2 text-sm bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
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
              {isLive &&
                match.casted &&
                !isMobile &&
                (() => {
                  const username = match.main_stream_url
                    ?.replace("https://www.twitch.tv/", "")
                    ?.replace("https://twitch.tv/", "")
                    ?.split("/")[0];
                  return username && liveStreams[username];
                })() && <TwitchChatEmbed streamUrl={match.main_stream_url} />}
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
