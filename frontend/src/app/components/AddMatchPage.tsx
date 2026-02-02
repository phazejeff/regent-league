"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
}

interface Player {
  id: number;
  name: string;
  team_id: number;
}

interface PlayerStat {
  K: number;
  A: number;
  D: number;
  ADR: number;
  hs_percent: number;
  KPR: number;
  player_id: number;
}

interface MapData {
  map_num: number;
  map_name: string;
  team1_score: number;
  team2_score: number;
  winner_id: number | null;
  map_picker_name: string;
  player_stats: PlayerStat[];
}

type AddMatchPageProps = {
  _team1Id?: string;
  _team2Id?: string;
  _datetime?: string;
  _upcomingId?: number;
  match_id?: number;
  onSubmit?: () => void;
};

export default function AddMatchPage({
  _team1Id,
  _team2Id,
  _datetime,
  _upcomingId,
  match_id,
  onSubmit,
}: AddMatchPageProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [team1Id, setTeam1Id] = useState<string>(_team1Id || "");
  const [team2Id, setTeam2Id] = useState<string>(_team2Id || "");
  const [winnerId, setWinnerId] = useState<string>("");

  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [datetime, setDatetime] = useState<string>(_datetime || "");

  const [maps, setMaps] = useState<MapData[]>([
    {
      map_num: 1,
      map_name: "",
      team1_score: 0,
      team2_score: 0,
      winner_id: null,
      map_picker_name: "",
      player_stats: [],
    },
  ]);

  const [password, setPassword] = useState("");

  // Load all teams
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/teams`)
      .then((res) => res.json())
      .then((data) => setTeams(data));
  }, []);

  // Load players when team1 or team2 changes
  useEffect(() => {
    if (!team1Id && !team2Id) return;
    Promise.all([
      team1Id ? fetch(`${process.env.API_ROOT}/players?team_id=${team1Id}`).then((r) => r.json()) : [],
      team2Id ? fetch(`${process.env.API_ROOT}/players?team_id=${team2Id}`).then((r) => r.json()) : [],
    ]).then(([p1, p2]) => setPlayers([...p1, ...p2]));
  }, [team1Id, team2Id]);

  useEffect(() => {
    if (!match_id || teams.length === 2) return;

    fetch(`${process.env.API_ROOT}/match/${match_id}`)
      .then((res) => res.json())
      .then((data) => {
        setScore1(data.score1);
        setScore2(data.score2);
        setDatetime(data.datetime.slice(0, 16));
        setTeam1Id(data.team1.id.toString());
        setTeam2Id(data.team2.id.toString());
        setWinnerId(data.winner_id.toString());

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedMaps: MapData[] = data.maps.map((m: any) => ({
          map_num: m.map_num,
          map_name: m.map_name,
          team1_score: m.team1_score,
          team2_score: m.team2_score,
          winner_id: m.winner_id,
          map_picker_name: m.map_picker_name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          player_stats: m.player_stats.map((ps: any) => ({
            K: ps.K,
            A: ps.A,
            D: ps.D,
            ADR: ps.ADR,
            hs_percent: ps.hs_percent,
            KPR: ps.KPR,
            player_id: ps.player.id,
          })),
        }));

        setMaps(formattedMaps);
      });
  }, [match_id, teams]);

  const addMap = () => {
    setMaps([
      ...maps,
      {
        map_num: maps.length + 1,
        map_name: "",
        team1_score: 0,
        team2_score: 0,
        winner_id: null,
        map_picker_name: "",
        player_stats: [],
      },
    ]);
  };

  const handleMapChange = <K extends keyof MapData>(
    index: number,
    field: K,
    value: MapData[K]
  ) => {
    const newMaps = [...maps];
    newMaps[index][field] = value;
    setMaps(newMaps);
  };

  const addPlayerStat = (mapIndex: number) => {
    const newMaps = [...maps];
    newMaps[mapIndex].player_stats.push({
      K: 0,
      A: 0,
      D: 0,
      ADR: 0,
      hs_percent: 0,
      KPR: 0,
      player_id: 0,
    });
    setMaps(newMaps);
  };

  const handlePlayerStatChange = <K extends keyof PlayerStat>(
    mapIndex: number,
    playerIndex: number,
    field: K,
    value: PlayerStat[K]
  ) => {
    const newMaps = [...maps];
    newMaps[mapIndex].player_stats[playerIndex][field] = value;
    setMaps(newMaps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const match = {
      score1,
      score2,
      datetime,
      team1_id: Number(team1Id),
      team2_id: Number(team2Id),
      winner_id: winnerId ? Number(winnerId) : null,
      maps: maps.map((m, idx) => ({
        ...m,
        map_num: idx + 1,
        winner_id: m.winner_id ? Number(m.winner_id) : null,
      })),
    };

    const endpoint = match_id
      ? `${process.env.API_ROOT}/editmatch/${match_id}?password=${password}`
      : `${process.env.API_ROOT}/addmatch?password=${password}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(match),
    });

    if (response.ok) {
      if (!match_id && _upcomingId !== undefined)
        await fetch(`${process.env.API_ROOT}/deleteupcoming?upcoming_id=${_upcomingId}&password=${password}`, { method: "DELETE" });
      alert(match_id ? "Match updated successfully!" : "Match added successfully!");

      if (!match_id) {
        setScore1(0);
        setScore2(0);
        setDatetime("");
        setTeam1Id("");
        setTeam2Id("");
        setWinnerId("");
        setMaps([
          {
            map_num: 1,
            map_name: "",
            team1_score: 0,
            team2_score: 0,
            winner_id: null,
            map_picker_name: "",
            player_stats: [],
          },
        ]);
        setPassword("");
      }

      if (onSubmit) onSubmit();
    } else {
      alert("Failed to save match.");
    }
  };

  return (
    <Card className="max-w-6xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>{match_id ? "Edit Match" : "Add Match"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Team 1</Label>
              <Select onValueChange={setTeam1Id} value={team1Id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select team 1" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="mt-2 block">Score 1</Label>
              <Input type="number" value={score1} onChange={(e) => setScore1(Number(e.target.value))} required />
            </div>

            <div>
              <Label>Team 2</Label>
              <Select onValueChange={setTeam2Id} value={team2Id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select team 2" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="mt-2 block">Score 2</Label>
              <Input type="number" value={score2} onChange={(e) => setScore2(Number(e.target.value))} required />
            </div>
          </div>

          <div>
            <Label>Date/Time</Label>
            <Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
          </div>

          <div>
            <Label>Winner</Label>
            <Select onValueChange={setWinnerId} value={winnerId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select winner" />
              </SelectTrigger>
              <SelectContent>
                {[team1Id, team2Id]
                  .filter(Boolean)
                  .map((id) => {
                    const t = teams.find((t) => t.id.toString() === id);
                    return (
                      <SelectItem key={id} value={id}>
                        {t?.name}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Maps */}
          <div>
            <Label>Maps</Label>
            {maps.map((map, mapIndex) => (
              <div
                key={mapIndex}
                className="border p-3 rounded-lg mt-3 space-y-3"
              >
                <p className="font-semibold">Map {mapIndex + 1}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Map Name</Label>
                    <Input
                      value={map.map_name}
                      onChange={(e) =>
                        handleMapChange(mapIndex, "map_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Map Picker</Label>
                    <Select
                      onValueChange={(v) =>
                        handleMapChange(mapIndex, "map_picker_name", v)
                      }
                      value={map.map_picker_name || ""}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select picker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team1">Team 1</SelectItem>
                        <SelectItem value="team2">Team 2</SelectItem>
                        <SelectItem value="decider">Decider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Team 1 Score</Label>
                    <Input
                      type="number"
                      value={map.team1_score}
                      onChange={(e) =>
                        handleMapChange(mapIndex, "team1_score", Number(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Team 2 Score</Label>
                    <Input
                      type="number"
                      value={map.team2_score}
                      onChange={(e) =>
                        handleMapChange(mapIndex, "team2_score", Number(e.target.value))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Map Winner</Label>
                  <Select
                    onValueChange={(v) =>
                      handleMapChange(mapIndex, "winner_id", Number(v))
                    }
                    value={map.winner_id ? map.winner_id.toString() : ""}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select winner" />
                    </SelectTrigger>
                    <SelectContent>
                      {[team1Id, team2Id]
                        .filter(Boolean)
                        .map((id) => {
                          const t = teams.find((t) => t.id.toString() === id);
                          return (
                            <SelectItem key={id} value={id!}>
                              {t?.name}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Player Stats */}
                <div>
                  <Label>Player Stats</Label>

                  {/* Header Row */}
                  <div className="grid grid-cols-8 gap-2 mt-2 font-semibold text-sm text-gray-700">
                    <div className="col-span-2">Player</div>
                    <div className="text-center">K</div>
                    <div className="text-center">A</div>
                    <div className="text-center">D</div>
                    <div className="text-center">ADR</div>
                    <div className="text-center">HS%</div>
                    <div className="text-center">KPR</div>
                  </div>

                  {map.player_stats.map((ps, psIndex) => (
                    <div
                      key={psIndex}
                      className="grid grid-cols-8 gap-2 mt-2 items-center"
                    >
                      {/* Player Select */}
                      <div className="col-span-2">
                        <Select
                          onValueChange={(v) =>
                            handlePlayerStatChange(
                              mapIndex,
                              psIndex,
                              "player_id",
                              Number(v)
                            )
                          }
                          value={ps.player_id ? ps.player_id.toString() : ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Input
                        type="number"
                        value={ps.K}
                        onChange={(e) =>
                          handlePlayerStatChange(mapIndex, psIndex, "K", Number(e.target.value))
                        }
                      />
                      <Input
                        type="number"
                        value={ps.A}
                        onChange={(e) =>
                          handlePlayerStatChange(mapIndex, psIndex, "A", Number(e.target.value))
                        }
                      />
                      <Input
                        type="number"
                        value={ps.D}
                        onChange={(e) =>
                          handlePlayerStatChange(mapIndex, psIndex, "D", Number(e.target.value))
                        }
                      />
                      <Input
                        type="number"
                        value={ps.ADR}
                        onChange={(e) =>
                          handlePlayerStatChange(mapIndex, psIndex, "ADR", Number(e.target.value))
                        }
                      />
                      <Input
                        type="number"
                        value={ps.hs_percent}
                        onChange={(e) =>
                          handlePlayerStatChange(mapIndex, psIndex, "hs_percent", Number(e.target.value))
                        }
                      />
                      <Input
                        type="number"
                        value={ps.KPR}
                        onChange={(e) =>
                          handlePlayerStatChange(mapIndex, psIndex, "KPR", Number(e.target.value))
                        }
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    onClick={() => addPlayerStat(mapIndex)}
                  >
                    + Add Player Stat
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" className="mt-3" onClick={addMap}>
              + Add Map
            </Button>
          </div>

          {/* Password */}
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full">
            {match_id ? "Save Changes" : "Add Match"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
