"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type Division = { id: number; name: string };
type Group = { id: number; division: string; name: string };

type Team = { name: string; div: string; group: string; id: number };

type PlayerStats = {
  id: number;
  name: string;
  team: Team;
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

  // Load divisions
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then(setDivisions);
  }, []);

  // Load groups for selected division
  useEffect(() => {
    if (!selectedDiv || selectedDiv === "All") {
      setGroups([]);
      return;
    }
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then(setGroups);
  }, [selectedDiv]);

  // Load player stats
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

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 space-y-6">
      {/* Filters */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Filter Player Stats</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select onValueChange={setSelectedDiv} value={selectedDiv}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Divisions</SelectItem>
              {divisions.map((div) => (
                <SelectItem key={div.id} value={div.id.toString()}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={setSelectedGroup}
            value={selectedGroup}
            disabled={!selectedDiv}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Player Stats Table */}
      {players.length > 0 ? (
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Player Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>K</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>A</TableHead>
                  <TableHead>ADR</TableHead>
                  <TableHead>HS%</TableHead>
                  <TableHead>Accuracy%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.team.name}</TableCell>
                    <TableCell>{p.K}</TableCell>
                    <TableCell>{p.D}</TableCell>
                    <TableCell>{p.A}</TableCell>
                    <TableCell>{p.ADR}</TableCell>
                    <TableCell>{p.HS}%</TableCell>
                    <TableCell>{p.accuracy}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-gray-500">
          No player stats found for this selection.
        </p>
      )}
    </div>
  );
}
