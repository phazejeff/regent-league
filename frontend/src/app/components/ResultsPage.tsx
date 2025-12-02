"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import Image from "next/image";
import { ArrowUp, ArrowDown } from "lucide-react";

type Division = { id: number; name: string };
type Group = { id: number; division: string; name: string };
type Player = { name: string; id: number; team_id: number; team_sub_id: number };
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
type Team = { name: string; div: string; group: string; id: number; logo: string };
type Match = {
  score1: number;
  score2: number;
  datetime: string;
  team1: Team;
  team2: Team;
  maps: MapStats[];
};

export default function ResultsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [selectedDiv, setSelectedDiv] = useState<string>("All");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  // Track sort state per map
  const [sortConfig, setSortConfig] = useState<
    Record<string, { key: keyof PlayerStats; direction: "asc" | "desc" }>
  >({});

  // Fetch divisions/groups/matches
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then(setDivisions);
  }, []);

  useEffect(() => {
    if (!selectedDiv || selectedDiv === "All") {
      setGroups([]);
      return;
    }
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then(setGroups);
  }, [selectedDiv]);

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

  // Sorting logic
  const handleSort = (mapKey: string, key: keyof PlayerStats) => {
    setSortConfig((prev) => {
      const current = prev[mapKey];
      let direction: "asc" | "desc" = "desc";
      if (current && current.key === key && current.direction === "desc") direction = "asc";
      return { ...prev, [mapKey]: { key, direction } };
    });
  };

  const sortPlayers = (players: PlayerStats[], mapKey: string): PlayerStats[] => {
    const config = sortConfig[mapKey] || { key: "K", direction: "desc" };
    return [...players].sort((a, b) => {
      const valA = a[config.key];
      const valB = b[config.key];
      if (valA < valB) return config.direction === "asc" ? -1 : 1;
      if (valA > valB) return config.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Renders sortable header
  const renderHeader = (
    label: string,
    field: keyof PlayerStats | "Player",
    mapKey: string
  ) => {
    const config = sortConfig[mapKey] || { key: "K", direction: "desc" };
    const isActive = config.key === field;
    const direction = config.direction;

    if (field === "Player")
      return <TableHead key={field}>{label}</TableHead>;

    return (
      <TableHead
        key={field}
        onClick={() => handleSort(mapKey, field as keyof PlayerStats)}
        className={`cursor-pointer select-none transition-colors ${
          isActive ? "text-blue-600 font-semibold" : "hover:text-gray-700"
        }`}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive &&
            (direction === "asc" ? (
              <ArrowUp size={14} />
            ) : (
              <ArrowDown size={14} />
          ))}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-6">
      {/* Filters */}
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filter Matches</CardTitle>
          <CardDescription>Regular Season Results</CardDescription>
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

      {/* Matches */}
      {matches.length > 0 ? (
        matches.map((match, idx) => (
          <Card key={idx} className="shadow-lg rounded-2xl border">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-lg">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/team/${match.team1.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Image
                      src={`${process.env.API_ROOT}/photos/${match.team1.logo}`}
                      alt={match.team1.name}
                      width={28}
                      height={28}
                      className="rounded-full border"
                    />
                    <span className="font-semibold">{match.team1.name}</span>
                  </Link>

                  <span className="mx-2 font-bold">
                    <span className="text-blue-600">{match.score1}</span> -{" "}
                    <span className="text-red-600">{match.score2}</span>
                  </span>

                  <Link
                    href={`/team/${match.team2.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <span className="font-semibold">{match.team2.name}</span>
                    <Image
                      src={`${process.env.API_ROOT}/photos/${match.team2.logo}`}
                      alt={match.team2.name}
                      width={28}
                      height={28}
                      className="rounded-full border"
                    />
                  </Link>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(match.datetime).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {match.maps.map((map) => {
                  const mapKey = `${idx}-${map.map_num}`;
                  const team1Players = sortPlayers(
                    map.player_stats.filter(
                      (ps) =>
                        ps.player.team_id === match.team1.id ||
                        ps.player.team_sub_id === match.team1.id
                    ),
                    mapKey
                  );
                  const team2Players = sortPlayers(
                    map.player_stats.filter(
                      (ps) =>
                        ps.player.team_id === match.team2.id ||
                        ps.player.team_sub_id === match.team2.id
                    ),
                    mapKey
                  );

                  return (
                    <AccordionItem key={map.map_num} value={`map-${map.map_num}`}>
                      <AccordionTrigger>
                        <div className="flex justify-between w-full items-center">
                          <span>
                            Map {map.map_num}: {map.map_name}{" "}
                            <span className="ml-2 text-sm text-gray-500">
                              (Picked by{" "}
                              {map.map_picker_name === "team1"
                                ? match.team1.name
                                : map.map_picker_name === "team2"
                                ? match.team2.name
                                : "decider"}
                              )
                            </span>
                          </span>
                          <span className="font-semibold">
                            <span className="text-blue-600">{map.team1_score}</span>-
                            <span className="text-red-600">{map.team2_score}</span>
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        {/* Team 1 */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-blue-600 mb-2">
                            {match.team1.name}
                          </h3>
                          <Table className="w-full table-fixed">
                            <colgroup>
                              <col className="w-2/6" /> {/* Player */}
                              <col className="w-1/12" /> {/* K */}
                              <col className="w-1/12" /> {/* A */}
                              <col className="w-1/12" /> {/* D */}
                              <col className="w-1/12" /> {/* ADR */}
                              <col className="w-1/12" /> {/* HS% */}
                              <col className="w-1/12" /> {/* Accuracy */}
                            </colgroup>

                            <TableHeader>
                              <TableRow>
                                {renderHeader("Player", "Player", mapKey)}
                                {renderHeader("K", "K", mapKey)}
                                {renderHeader("A", "A", mapKey)}
                                {renderHeader("D", "D", mapKey)}
                                {renderHeader("ADR", "ADR", mapKey)}
                                {renderHeader("HS%", "hs_percent", mapKey)}
                                {renderHeader("Accuracy", "accuracy", mapKey)}
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {team1Players.map((ps) => (
                                <TableRow key={ps.player.id}>
                                  <TableCell className="truncate">
                                    <Link href={`/player/${ps.player.id}`} className="hover:underline">
                                      {ps.player.name}
                                    </Link>
                                  </TableCell>
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

                        {/* Team 2 */}
                        <div>
                          <h3 className="font-semibold text-red-600 mb-2">
                            {match.team2.name}
                          </h3>
                          <Table className="w-full table-fixed">
                            <colgroup>
                              <col className="w-2/6" /> {/* Player */}
                              <col className="w-1/12" /> {/* K */}
                              <col className="w-1/12" /> {/* A */}
                              <col className="w-1/12" /> {/* D */}
                              <col className="w-1/12" /> {/* ADR */}
                              <col className="w-1/12" /> {/* HS% */}
                              <col className="w-1/12" /> {/* Accuracy */}
                            </colgroup>
                            <TableHeader>
                              <TableRow>
                                {renderHeader("Player", "Player", mapKey)}
                                {renderHeader("K", "K", mapKey)}
                                {renderHeader("A", "A", mapKey)}
                                {renderHeader("D", "D", mapKey)}
                                {renderHeader("ADR", "ADR", mapKey)}
                                {renderHeader("HS%", "hs_percent", mapKey)}
                                {renderHeader("Accuracy", "accuracy", mapKey)}
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {team2Players.map((ps) => (
                                <TableRow key={ps.player.id}>
                                  <TableCell className="truncate">
                                    <Link href={`/player/${ps.player.id}`} className="hover:underline">
                                      {ps.player.name}
                                    </Link>
                                  </TableCell>
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
