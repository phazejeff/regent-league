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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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

type Player = { name: string; id: number; team_id: number };
type PlayerStats = {
  K: number;
  A: number;
  D: number;
  ADR: number;
  hs_percent: number;
  accuracy: number;
  player: Player;
};

type MapStats = {
  map_num: number;
  map_name: string;
  team1_score: number;
  team2_score: number;
  player_stats: PlayerStats[];
};

type Team = { name: string; div: string; group: string; id: number };

type Match = {
  score1: number;
  score2: number;
  datetime: string;
  team1: Team;
  team2: Team;
  maps: MapStats[];
};

export default function MatchesPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

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
      setGroups([]); // reset groups if All
      return;
    }
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then(setGroups);
  }, [selectedDiv]);

  // Load matches when div/group change
  useEffect(() => {
    let url = `${process.env.API_ROOT}/matches`;
    const params = new URLSearchParams();

    if (selectedDiv !== "All") params.append("div", selectedDiv);
    if (selectedGroup !== "All") params.append("group", selectedGroup);

    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then(setMatches);
  }, [selectedDiv, selectedGroup]);

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-6">
      {/* Filters */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Filter Matches</CardTitle>
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

      {/* Matches List */}
      {matches.length > 0 ? (
        matches.map((match, idx) => (
          <Card key={idx} className="shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-lg">
                <span>
                  {match.team1.name}{" "}
                  <span className="font-bold">{match.score1}</span> -{" "}
                  <span className="font-bold">{match.score2}</span>{" "}
                  {match.team2.name}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(match.datetime).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {match.maps.map((map) => (
                  <AccordionItem key={map.map_num} value={`map-${map.map_num}`}>
                    <AccordionTrigger>
                      Map {map.map_num + 1}: {map.map_name} (
                      {map.team1_score} - {map.team2_score})
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>K</TableHead>
                            <TableHead>A</TableHead>
                            <TableHead>D</TableHead>
                            <TableHead>ADR</TableHead>
                            <TableHead>HS%</TableHead>
                            <TableHead>Accuracy</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {map.player_stats.map((ps) => (
                            <TableRow key={ps.player.id}>
                              <TableCell>{ps.player.name}</TableCell>
                              <TableCell>{ps.K}</TableCell>
                              <TableCell>{ps.A}</TableCell>
                              <TableCell>{ps.D}</TableCell>
                              <TableCell>{ps.ADR}</TableCell>
                              <TableCell>{ps.hs_percent}%</TableCell>
                              <TableCell>{ps.accuracy}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-gray-500">
          No matches found for this selection.
        </p>
      )}
    </div>
  );
}
