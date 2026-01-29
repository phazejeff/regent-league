"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Medal, Search } from "lucide-react";
import Link from "next/link";

type Division = { id: number; name: string };
type Group = { id: number; division: string; name: string };
type Team = { id: number; name: string; div: string; group: string };

type PlayerStats = {
  id: number;
  name: string;
  team: string;
  K: number;
  D: number;
  A: number;
  ADR: number;
  HS: number;
  KPR: number;
  games: number;
};

export default function PlayerStatsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerStats[]>([]);

  const [selectedDiv, setSelectedDiv] = useState<string>("All");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [selectedTeam, setSelectedTeam] = useState<number | "All">("All");

  const [sortBy, setSortBy] = useState<keyof PlayerStats>("K");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [displayTotals, setDisplayTotals] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load divisions
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then(setDivisions);
  }, []);

  // Load groups when division changes
  useEffect(() => {
    if (!selectedDiv || selectedDiv === "All") {
      setGroups([]);
      return;
    }
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then(setGroups);
  }, [selectedDiv]);

  // Load teams
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/teams`)
      .then((res) => res.json())
      .then(setTeams);
  }, []);

  // Load players
  useEffect(() => {
    let url = `${process.env.API_ROOT}/playerstats`;
    const params = new URLSearchParams();
    if (selectedDiv !== "All") params.append("div", selectedDiv);
    if (selectedGroup !== "All") params.append("group", selectedGroup);
    if (selectedTeam !== "All") params.append("team_id", String(selectedTeam));
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then(setPlayers);
  }, [selectedDiv, selectedGroup, selectedTeam]);

  const handleSort = (column: keyof PlayerStats) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Compute sorted players first (based on sortBy, sortOrder, totals)
  const sortedPlayers = [...players].sort((a, b) => {
    let valueA: number | string = a[sortBy];
    let valueB: number | string = b[sortBy];

    if (!displayTotals && (sortBy === "K" || sortBy === "D" || sortBy === "A")) {
      valueA = a[sortBy] / a.games;
      valueB = b[sortBy] / b.games;
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    }

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0;
  });

  // Map each player ID to their leaderboard rank
  const playerRanks = sortedPlayers.reduce<Record<number, number>>((acc, p, idx) => {
    acc[p.id] = idx + 1; // 1-based rank
    return acc;
  }, {});

  // Then filter by search query
  const filteredPlayers = sortedPlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SortableHeader: React.FC<{ column: keyof PlayerStats; label: string }> = ({
    column,
    label,
  }) => (
    <th
      onClick={() => handleSort(column)}
      className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === column &&
          (sortOrder === "asc" ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          ))}
      </div>
    </th>
  );

  const getStatClass = (column: keyof PlayerStats, value: number) => {
    if (column === "ADR") {
      if (value >= 80) return "text-green-600 font-semibold";
      if (value < 60) return "text-red-500 font-semibold";
    }
    if (column === "HS") {
      if (value >= 50) return "text-green-600 font-semibold";
      if (value < 30) return "text-red-500 font-semibold";
    }
    if (column === "KPR") {
      if (value >= 1) return "text-green-600 font-semibold";
      if (value < 0.7) return "text-red-500 font-semibold";
    }
    if (column === "K") {
      if (!displayTotals) {
        if (value >= 22) return "text-green-600 font-semibold";
        if (value < 12) return "text-red-500 font-semibold";
      }
    }
    if (column === "D") {
      if (!displayTotals) {
        if (value <= 12) return "text-green-600 font-semibold";
        if (value > 20) return "text-red-500 font-semibold";
      }
    }
    return "";
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <select
              value={selectedDiv}
              onChange={(e) => {
                setSelectedDiv(e.target.value);
                setSelectedGroup("All");
                setSelectedTeam("All");
              }}
              className="border rounded p-2 bg-white dark:bg-gray-900"
            >
              <option value="All">All Divisions</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedTeam("All");
              }}
              className="border rounded p-2 bg-white dark:bg-gray-900"
              disabled={selectedDiv === "All"}
            >
              <option value="All">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTeam}
              onChange={(e) =>
                setSelectedTeam(
                  e.target.value === "All" ? "All" : Number(e.target.value)
                )
              }
              className="border rounded p-2 bg-white dark:bg-gray-900"
            >
              <option value="All">All Teams</option>
              {teams
                .filter(
                  (t) =>
                    (selectedDiv === "All" || t.div === selectedDiv) &&
                    (selectedGroup === "All" || t.group === selectedGroup)
                )
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>

            {/* Search Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 border rounded p-2 bg-white dark:bg-gray-900"
              />
            </div>

            {/* Toggle for totals */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={displayTotals}
                onChange={(e) => setDisplayTotals(e.target.checked)}
                className="form-checkbox"
              />
              Show Totals
            </label>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Player</th>
                  <th className="p-3 text-left">Team</th>
                  <SortableHeader
                    column="K"
                    label={displayTotals ? "Kills Total" : "Kills Per Map"}
                  />
                  <SortableHeader
                    column="D"
                    label={displayTotals ? "Deaths Total" : "Deaths Per Map"}
                  />
                  <SortableHeader
                    column="A"
                    label={displayTotals ? "Assists Total" : "Assists Per Map"}
                  />
                  <SortableHeader column="ADR" label="ADR" />
                  <SortableHeader column="HS" label="HS%" />
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="p-3">
                      {playerRanks[p.id] === 1 && <Medal className="text-yellow-500" />}
                      {playerRanks[p.id] === 2 && <Medal className="text-gray-400" />}
                      {playerRanks[p.id] === 3 && <Medal className="text-amber-700" />}
                      {playerRanks[p.id] > 3 && playerRanks[p.id]}
                    </td>
                    <td className="p-3">
                      <Link className="hover:underline" href={`/player/${p.id}`}>
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3">{p.team}</td>
                    <td
                      className={`p-3 ${getStatClass(
                        "K",
                        displayTotals ? p.K : p.K / p.games
                      )}`}
                    >
                      {(displayTotals ? p.K : p.K / p.games).toFixed(2)}
                    </td>
                    <td
                      className={`p-3 ${getStatClass(
                        "D",
                        displayTotals ? p.D : p.D / p.games
                      )}`}
                    >
                      {(displayTotals ? p.D : p.D / p.games).toFixed(2)}
                    </td>
                    <td
                      className={`p-3 ${getStatClass(
                        "A",
                        displayTotals ? p.A : p.A / p.games
                      )}`}
                    >
                      {(displayTotals ? p.A : p.A / p.games).toFixed(2)}
                    </td>
                    <td className={`p-3 ${getStatClass("ADR", p.ADR)}`}>
                      {p.ADR.toFixed(2)}
                    </td>
                    <td className={`p-3 ${getStatClass("HS", p.HS)}`}>
                      {p.HS ? p.HS.toFixed(2) : undefined}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
