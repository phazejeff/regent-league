"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Division = { id: number; name: string };
type Group = { id: number; division: string; name: string };
type Team = { id: number; name: string; div: string; group: string; logo: string };

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

  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then((json) => {
        setDivisions(json)
        setSelectedDiv(json[0].name)
      });
  }, []);

  useEffect(() => {
    if (!selectedDiv) return;
    setLoadingGroups(true);
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then((data) => {
        setGroups(data);
        setSelectedGroup(data[0].name)
        setLoadingGroups(false);
      });
  }, [selectedDiv]);

  useEffect(() => {
    if (!selectedDiv || !selectedGroup) return;
    setLoadingStandings(true);
    fetch(`${process.env.API_ROOT}/standings?div=${selectedDiv}&group=${selectedGroup}`)
      .then((res) => res.json())
      .then((data) => {
        setStandings(data);
        setLoadingStandings(false);
      });
  }, [selectedDiv, selectedGroup]);

  const getWinRate = (won: number, lost: number) => {
    const total = won + lost;
    if (total === 0) return "0%";
    return `${((won / total) * 100).toFixed(1)}%`;
  };

  const getDiff = (won: number, lost: number) => won - lost;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-6">
      {/* Header + Filters */}
      <Card className="shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-6">
            {/* Division Selector */}
            <Select onValueChange={setSelectedDiv} value={selectedDiv}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select Division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((div) => (
                  <SelectItem key={div.id} value={div.name}>
                    {div.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Group Selector */}
            <Select
              onValueChange={setSelectedGroup}
              value={selectedGroup}
              disabled={!selectedDiv || loadingGroups}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.name}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Standings List */}
      {loadingStandings ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : standings.length > 0 ? (
        <div className="space-y-4">
          {standings.map((s, index) => (
            <Card
              key={s.team.id}
              className="p-4 shadow-md hover:shadow-lg transition rounded-xl"
            >
              <div className="flex items-center gap-6">
                {/* Rank / Trophy */}
                <div className="flex-shrink-0 w-12 text-center">
                  {index === 0 && <Trophy className="text-yellow-500" size={32} />}
                  {index === 1 && <Trophy className="text-gray-400" size={32} />}
                  {index === 2 && <Trophy className="text-amber-700" size={32} />}
                  {index > 2 && (
                    <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Team Logo + Name */}
                <div className="flex flex-col items-center w-24">
                  <h3 className="text-lg font-semibold text-center">
                    <Link className="hover:underline" href={`/team/${s.team.id}`}>
                      {s.team.name}
                    </Link>
                  </h3>
                  <div className="w-20 h-20 relative mt-2">
                    <Image
                      src={`${process.env.API_ROOT}/photos/${s.team.logo}`}
                      alt={s.team.name}
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Team Stats */}
                <div className="flex-grow grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="font-medium">Matches</p>
                    <p>{s.match_wins}W - {s.match_losses}L</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {getWinRate(s.match_wins, s.match_losses)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Maps</p>
                    <p>{s.map_wins}W - {s.map_losses}L</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Diff: {getDiff(s.map_wins, s.map_losses)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Rounds</p>
                    <p>{s.round_wins}W - {s.round_losses}L</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Diff: {getDiff(s.round_wins, s.round_losses)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">
          Select a division and group to view standings.
        </p>
      )}
    </div>
  );
}
