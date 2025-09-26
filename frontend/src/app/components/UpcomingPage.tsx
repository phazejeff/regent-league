"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

type Team = {
  name: string;
  div: string;
  group: string;
  logo: string;
  id: number;
};

type UpcomingMatch = {
  week: number;
  datetime: string;
  division: string;
  streams: Record<string, string>; // dictionary of name -> url
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
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-white">Upcoming Matches</h1>

      {matches.length > 0 ? (
        matches.map((match, idx) => (
          <Card key={idx} className="shadow-lg rounded-2xl border">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-lg">
                {/* Team names */}
                <span className="font-semibold flex items-center gap-2">
                  <Image
                    src={`${process.env.API_ROOT}/photos/${match.team1.logo}`}
                    alt={match.team1.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded"
                  />
                    {match.team1.name} vs {match.team2.name}
                  <Image
                    src={`${process.env.API_ROOT}/photos/${match.team2.logo}`}
                    alt={match.team2.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded"
                  />
                </span>

                {/* Match time */}
                <span className="text-sm text-gray-500 dark:text-gray-200">
                  {new Date(match.datetime).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Division / Week info */}
              <div className="mb-2 text-gray-600 text-sm dark:text-gray-300">
                Division:{" "}
                <span className="font-medium">{match.division}</span> | Week:{" "}
                <span className="font-medium">{match.week}</span>
              </div>

              {/* Streams */}
              {match.streams && Object.keys(match.streams).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Streams:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(match.streams).map(([name, url], i) => (
                      <li key={i}>
                        <Link
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-gray-500">
          No upcoming matches scheduled.
        </p>
      )}
    </div>
  );
}
