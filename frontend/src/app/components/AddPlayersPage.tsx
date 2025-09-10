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

export default function AddPlayersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [players, setPlayers] = useState<string[]>([""]);
  const [password, setPassword] = useState("");

  // Load teams
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/teams`)
      .then((res) => res.json())
      .then((data) => setTeams(data));
  }, []);

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const addPlayerField = () => setPlayers([...players, ""]);
  const removePlayerField = (index: number) =>
    setPlayers(players.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const playersData = players
      .filter((p) => p.trim() !== "")
      .map((p) => ({
        name: p,
        team_id: Number(selectedTeam),
      }));

    const response = await fetch(`${process.env.API_ROOT}/addplayers?password=${password}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playersData),
    });

    if (response.ok) {
      alert("Players added successfully!");
      setPlayers([""]);
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
          {/* Team Selector */}
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
              <div key={index} className="flex items-center space-x-2 mt-2">
                <Input
                  value={player}
                  onChange={(e) => handlePlayerChange(index, e.target.value)}
                  placeholder="Enter player name"
                  required
                />
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
