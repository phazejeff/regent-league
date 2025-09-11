"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Medal } from "lucide-react";

type Division = { id: number; name: string };
type Group = { id: number; division: string; name: string };

type PlayerStats = {
  id: number;
  name: string;
  team: string;
  K: number;
  D: number;
  A: number;
  ADR: number;
  HS: number;
  accuracy: number;
};

export default function PlayerStatsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [players, setPlayers] = useState<PlayerStats[]>([]);

  const [selectedDiv, setSelectedDiv] = useState<string>("All");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  const [sortBy, setSortBy] = useState<keyof PlayerStats>("K");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load divisions
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then(setDivisions);
  }, []);

  // Load groups
  useEffect(() => {
    if (!selectedDiv || selectedDiv === "All") {
      setGroups([]);
      return;
    }
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then(setGroups);
  }, [selectedDiv]);

  // Load players
  useEffect(() => {
    let url = `${process.env.API_ROOT}/playerstats`;
    const params = new URLSearchParams();
    if (selectedDiv !== "All") params.append("div", selectedDiv);
    if (selectedGroup !== "All") params.append("group", selectedGroup);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then(setPlayers);
  }, [selectedDiv, selectedGroup]);

  const handleSort = (column: keyof PlayerStats) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const valueA = a[sortBy];
    const valueB = b[sortBy];

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
      if (value >= 90) return "text-green-600 font-semibold";
      if (value <= 50) return "text-red-500 font-semibold";
    }
    if (column === "HS") {
      if (value >= 70) return "text-green-600 font-semibold";
      if (value <= 20) return "text-red-500 font-semibold";
    }
    if (column === "accuracy") {
      if (value >= 60) return "text-green-600 font-semibold";
      if (value <= 15) return "text-red-500 font-semibold";
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Player</th>
                  <th className="p-3 text-left">Team</th>
                  <SortableHeader column="K" label="Kills" />
                  <SortableHeader column="D" label="Deaths" />
                  <SortableHeader column="A" label="Assists" />
                  <SortableHeader column="ADR" label="ADR" />
                  <SortableHeader column="HS" label="HS%" />
                  <SortableHeader column="accuracy" label="Accuracy%" />
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((p, index) => (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="p-3">
                      {index === 0 && <Medal className="text-yellow-500" />}
                      {index === 1 && <Medal className="text-gray-400" />}
                      {index === 2 && <Medal className="text-amber-700" />}
                      {index > 2 && index + 1}
                    </td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.team}</td>
                    <td className="p-3">{p.K}</td>
                    <td className="p-3">{p.D}</td>
                    <td className="p-3">{p.A}</td>
                    <td className={`p-3 ${getStatClass("ADR", p.ADR)}`}>
                      {p.ADR}
                    </td>
                    <td className={`p-3 ${getStatClass("HS", p.HS)}`}>
                      {p.HS}%
                    </td>
                    <td className={`p-3 ${getStatClass("accuracy", p.accuracy)}`}>
                      {p.accuracy}%
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
