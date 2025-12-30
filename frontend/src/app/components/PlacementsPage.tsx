"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Team = {
  id: number;
  name: string;
  logo: string;
  school: string;
  mainColor?: string;
  secondColor?: string;
};

type Placement = {
  placement: number;
  division: string;
  semester: string;
  year: number;
  split: boolean;
  team: Team;
};

type Division = "Elites" | "Challengers";

const API_ROOT = process.env.API_ROOT;

/* Placeholder assets */
const MEDAL_GOLD = "/Fall 2025 Trophy.png";
const MEDAL_SILVER = "/Silver XD Medal.png";
const MEDAL_BRONZE = "/Bronze XD Medal.png";

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<Division>("Elites");
  const [loading, setLoading] = useState(true);

  const fetchPlacements = async (div: Division) => {
    try {
      const res = await fetch(
        `${API_ROOT}/placements?div=${encodeURIComponent(div)}`
      );
      const data: Placement[] = await res.json();
      setPlacements(data);
    } catch (err) {
      console.error("Failed to fetch placements:", err);
    } finally {
      setLoading(false);
    }
  };

  function PodiumColumn({
    teams,
    height,
    medal,
    label,
    isWinner = false,
  }: {
    teams: Placement[];
    height: string;
    medal: string;
    label: string;
    isWinner?: boolean;
  }) {
    return (
      <div className="flex flex-col items-center">
        {/* Teams */}
        <div className="flex gap-6 mb-2">
          {teams.map((p, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {/* Team Name */}
              <div className="text-center font-bold mb-1">
                <Link href={`/team/${p.team.id}`} className="hover:underline">{p.team.name}</Link>
              </div>

              {/* Logo */}
              <div className="relative w-24 h-24 mb-2">
                <Image
                  src={`${API_ROOT}/photos/${p.team.logo}`}
                  alt={p.team.name}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Medal / Trophy */}
              <div className="relative w-24 h-24">
                <Image
                  src={medal}
                  alt={isWinner ? "Trophy" : "Medal"}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Podium Base */}
        <div
          className={`w-36 ${height} rounded-t-lg flex items-center justify-center font-bold text-xl`}
          style={{
            background: teams[0].team.mainColor || "#444",
            color: teams[0].team.secondColor || "#fff",
          }}
        >
          {label}
        </div>
      </div>
    );
  }

  function placementImage(placement: number) {
    if (placement === 1) return MEDAL_GOLD;
    if (placement === 2) return MEDAL_SILVER;
    if (placement === 3) return MEDAL_BRONZE;
    return null;
  }

  useEffect(() => {
    fetchPlacements(selectedDivision);
  }, [selectedDivision]);

  if (loading) {
    return <div className="text-center text-white p-6">Loading...</div>;
  }

  // Only care about podium placements
  const podiumPlacements = {
    first: placements.filter((p) => p.placement === 1),
    second: placements.filter((p) => p.placement === 2),
    third: placements.filter((p) => p.placement === 3),
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">
        {selectedDivision} Placements
      </h1>

      {/* Division Buttons */}
      <div className="flex justify-center gap-4 mb-20">
        {(["Elites", "Challengers"] as Division[]).map((div) => (
          <button
            key={div}
            onClick={() => setSelectedDivision(div)}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              selectedDivision === div
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-300 hover:bg-blue-500"
            }`}
          >
            {div}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 items-end justify-items-center h-[420px] max-w-4xl mx-auto">
          {/* 3rd Place (LEFT) */}
          <div className="w-full flex justify-center">
            {podiumPlacements.third.length > 0 && (
              <PodiumColumn
                height="h-40"
                teams={podiumPlacements.third}
                medal={MEDAL_BRONZE}
                label="3rd"
              />
            )}
          </div>

          {/* 1st Place (CENTER — ALWAYS) */}
          <div className="w-full flex justify-center">
            {podiumPlacements.first.length > 0 && (
              <PodiumColumn
                height="h-56"
                teams={podiumPlacements.first}
                medal={MEDAL_GOLD}
                label="1st"
                isWinner
              />
            )}
          </div>

          {/* 2nd Place (RIGHT) */}
          <div className="w-full flex justify-center">
            {podiumPlacements.second.length > 0 && (
              <PodiumColumn
                height="h-48"
                teams={podiumPlacements.second}
                medal={MEDAL_SILVER}
                label="2nd"
              />
            )}
          </div>

        </div>
      </div>

      {/* Mobile Grid Placements */}
      <div className="md:hidden mt-10">
        <div className="grid grid-cols-1 gap-4">
          {placements
            .slice()
            .sort((a, b) => a.placement - b.placement)
            .map((p, idx) => {
              const medal = placementImage(p.placement);

              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-900 border border-gray-700"
                >
                  {/* Medal / Trophy */}
                  <div className="relative w-12 h-12 shrink-0">
                    {medal ? (
                      <Image
                        src={medal}
                        alt="Placement"
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-lg font-bold w-20 text-center">
                        {p.placement === 5 && "5–8"}
                        {p.placement === 9 && "8+"}
                        {![1, 2, 3, 5, 9].includes(p.placement) &&
                          `${p.placement}th`}
                      </span>
                    )}
                  </div>

                  {/* Team Logo */}
                  <div className="relative w-12 h-12">
                    <Image
                      src={`${API_ROOT}/photos/${p.team.logo}`}
                      alt={p.team.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Team Info */}
                  <div className="flex flex-col">
                    <Link
                      href={`/team/${p.team.id}`}
                      className="font-semibold hover:underline"
                    >
                      {p.team.name}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {p.team.school}
                    </span>
                  </div>

                  {/* Tie Indicator */}
                  {p.split && (
                    <span className="ml-auto text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                      TIED
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Remaining Placements */}
      <div className="hidden md:block">
        <div className="mt-16">
          <div className="grid md:grid-cols-2 gap-4">
            {placements
              .filter((p) => p.placement > 3)
              .map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-900 border border-gray-700"
                >
                  {/* Placement Label */}
                  <div className="text-lg font-bold w-20 text-center">
                    {p.placement === 5 && "5–8th"}
                    {p.placement === 9 && "8th+"}
                    {![5, 9].includes(p.placement) && `${p.placement}th`}
                  </div>

                  {/* Logo */}
                  <div className="relative w-14 h-14">
                    <Image
                      src={`${API_ROOT}/photos/${p.team.logo}`}
                      alt={p.team.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Team Name */}
                  <div className="flex flex-col">
                    <span className="font-semibold">{p.team.name}</span>
                    <span className="text-sm text-gray-400">
                      {p.team.school}
                    </span>
                  </div>

                  {/* Tie Indicator */}
                  {p.split && (
                    <span className="ml-auto text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                      TIED
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
