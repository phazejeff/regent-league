"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type Division = { id: number; name: string };
type Group = { id: number; division: string; name: string };
type Team = { id: number; name: string; div: string; group: string };

type Standing = {
  team: Team;
  match_wins: number;
  match_losses: number;
  map_wins: number;
  map_losses: number;
  round_wins: number;
  round_losses: number;
};

export default function StandingsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);

  const [selectedDiv, setSelectedDiv] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then(setDivisions);
  }, []);

  useEffect(() => {
    if (!selectedDiv) return;
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then(setGroups);
  }, [selectedDiv]);

  useEffect(() => {
    if (!selectedDiv || !selectedGroup) return;
    fetch(`${process.env.API_ROOT}/standings?div=${selectedDiv}&group=${selectedGroup}`)
      .then((res) => res.json())
      .then(setStandings);
  }, [selectedDiv, selectedGroup]);

  return (
    <Card className="w-full max-w-5xl mx-auto mt-6 shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Standings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          {/* Division Selector */}
          <Select onValueChange={setSelectedDiv} value={selectedDiv}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((div) => (
                <SelectItem key={div.id} value={div.id.toString()}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Group Selector */}
          <Select onValueChange={setSelectedGroup} value={selectedGroup} disabled={!selectedDiv}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Standings Table */}
        {standings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Match W</TableHead>
                <TableHead>Match L</TableHead>
                <TableHead>Map W</TableHead>
                <TableHead>Map L</TableHead>
                <TableHead>Round W</TableHead>
                <TableHead>Round L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s) => (
                <TableRow key={s.team.id}>
                  <TableCell>{s.team.name}</TableCell>
                  <TableCell>{s.match_wins}</TableCell>
                  <TableCell>{s.match_losses}</TableCell>
                  <TableCell>{s.map_wins}</TableCell>
                  <TableCell>{s.map_losses}</TableCell>
                  <TableCell>{s.round_wins}</TableCell>
                  <TableCell>{s.round_losses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 text-center">Select division & group to see standings</p>
        )}
      </CardContent>
    </Card>
  );
}
