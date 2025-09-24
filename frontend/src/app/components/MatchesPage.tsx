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
import Link from "next/link";

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
  map_picker_name: string;
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
      setGroups([]);
      return;
    }
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then(setGroups);
  }, [selectedDiv]);

  // Load matches
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
          <CardTitle className="text-lg font-semibold">Filter Matches</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Select onValueChange={setSelectedDiv} value={selectedDiv}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Divisions</SelectItem>
              {divisions.map((div) => (
                <SelectItem key={div.id} value={div.name}>
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
                <SelectItem key={group.id} value={group.name}>
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
          <Card key={idx} className="shadow-lg rounded-2xl border">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-lg">
                <span className="font-semibold">
                  {match.team1.name}{" "}
                  <span className="font-bold text-blue-600">{match.score1}</span>{" "}
                  -{" "}
                  <span className="font-bold text-red-600">{match.score2}</span>{" "}
                  {match.team2.name}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(match.datetime).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {match.maps.map((map) => {
                  const team1Players = map.player_stats.filter(
                    (ps) => ps.player.team_id === match.team1.id
                  );
                  const team2Players = map.player_stats.filter(
                    (ps) => ps.player.team_id === match.team2.id
                  );

                  return (
                    <AccordionItem key={map.map_num} value={`map-${map.map_num}`}>
                      <AccordionTrigger>
                        <div className="flex justify-between w-full items-center">
                          {/* Map name + picker */}
                          <span>
                            Map {map.map_num}: {map.map_name}
                            <span className="ml-2 text-sm text-gray-500">
                              (Picked by {map.map_picker_name})
                            </span>
                          </span>

                          {/* Score block */}
                          <span className="font-semibold">
                            <span className="text-blue-600">{map.team1_score}</span>
                            <span className="mx-1">-</span>
                            <span className="text-red-600">{map.team2_score}</span>
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* Team 1 Players */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-blue-600 mb-2">
                            {match.team1.name}
                          </h3>
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
                              {team1Players.map((ps) => (
                                <TableRow key={ps.player.id}>
                                  <TableCell><Link href={`/player/${ps.player.id}`} className="hover:underline">{ps.player.name}</Link></TableCell>
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
                        </div>

                        {/* Team 2 Players */}
                        <div>
                          <h3 className="font-semibold text-red-600 mb-2">
                            {match.team2.name}
                          </h3>
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
                              {team2Players.map((ps) => (
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
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
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
