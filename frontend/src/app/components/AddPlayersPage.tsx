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
  name: string;
  real_name?: string;
  year: string;
  major: string;
  main: boolean;
  team_sub_id?: number | "";
  faceit_url: string;
  steam_id: string;
}

export default function AddPlayersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([{ name: "", real_name: "", year: "", major: "", main: true, team_sub_id: "", faceit_url: "", steam_id: "" }]);
  const [password, setPassword] = useState("");

  // Load teams
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/teams`)
      .then((res) => res.json())
      .then((data) => setTeams(data));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePlayerChange = (index: number, field: keyof Player, value: any) => {
    const newPlayers = [...players];
    if (field === "team_sub_id") {
      newPlayers[index][field] = value === "" ? "" : Number(value);
    } else if (field === "main") {
      newPlayers[index][field] = value;
      if (!value) newPlayers[index].team_sub_id = "";
    } else {
      newPlayers[index][field] = value;
    }
    setPlayers(newPlayers);
  };

  const addPlayerField = () =>
    setPlayers([...players, { name: "", real_name: "", year: "", major: "", main: true, team_sub_id: "", faceit_url: "", steam_id: "" }]);
  const removePlayerField = (index: number) =>
    setPlayers(players.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const playersData = players
      .filter((p) => p.name.trim() !== "")
      .map((p) => ({
        ...p,
        team_id: Number(selectedTeam),
      }));

    const response = await fetch(`${process.env.API_ROOT}/addplayers?password=${password}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playersData),
    });

    if (response.ok) {
      alert("Players added successfully!");
      setPlayers([{ name: "", real_name: "", year: "", major: "", main: true, team_sub_id: "", faceit_url: "", steam_id: "" }]);
      setPassword("");
      setSelectedTeam("");
    } else {
      alert("Failed to add players.");
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle>Add Players</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Team Selector */}
          <div>
            <Label htmlFor="team">Team</Label>
            <Select onValueChange={setSelectedTeam} value={selectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name} ({team.div} - {team.group})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player Inputs */}
          <div>
            <Label>Players</Label>
            {players.map((player, index) => (
              <div key={index} className="flex flex-col space-y-2 mt-2 border-b pb-2">
                <Input
                  value={player.name}
                  onChange={(e) => handlePlayerChange(index, "name", e.target.value)}
                  placeholder="Enter player name"
                  required
                />
                <Input
                  value={player.real_name}
                  onChange={(e) => handlePlayerChange(index, "real_name", e.target.value)}
                  placeholder="Enter real name"
                />
                <div className="flex space-x-2">
                  <Input
                    value={player.year}
                    onChange={(e) => handlePlayerChange(index, "year", e.target.value)}
                    placeholder="Year"
                    required
                  />
                  <Input
                    value={player.major}
                    onChange={(e) => handlePlayerChange(index, "major", e.target.value)}
                    placeholder="Major"
                    required
                  />
                </div>
                <Input
                  value={player.faceit_url}
                  onChange={(e) => handlePlayerChange(index, "faceit_url", e.target.value)}
                  placeholder="Faceit URL"
                />
                <Input
                  value={player.steam_id}
                  onChange={(e) => handlePlayerChange(index, "steam_id", e.target.value)}
                  placeholder="Steam64ID"
                />
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="checkbox"
                    checked={player.main}
                    onChange={(e) => handlePlayerChange(index, "main", e.target.checked)}
                  />
                  <Label>Main Player</Label>
                </div>

                {/* Sub Team Selector */}
                  <div>
                    <Label>Sub Team (optional)</Label>
                    <Select
                      onValueChange={(val) => handlePlayerChange(index, "team_sub_id", val)}
                      value={player.team_sub_id === "" ? "" : String(player.team_sub_id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name} ({team.div} - {team.group})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                {players.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePlayerField(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={addPlayerField}
            >
              + Add Player
            </Button>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full">
            Add Players
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
