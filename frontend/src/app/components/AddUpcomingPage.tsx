"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
}

interface Division {
  id: number;
  name: string;
}

interface Stream {
  name: string;
  url: string;
}

type AddUpcomingMatchProps = {
  onSubmit?: () => void;
};

export default function AddUpcomingMatch({ onSubmit }: AddUpcomingMatchProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [divisionId, setDivisionId] = useState<string>("");

  const [week, setWeek] = useState<number>(0);
  const [datetime, setDatetime] = useState<string>("");

  const [casted, setCasted] = useState<boolean>(false);

  // Separate streams per team
  const [team1Streams, setTeam1Streams] = useState<Stream[]>([
    { name: "", url: "" },
  ]);
  const [team2Streams, setTeam2Streams] = useState<Stream[]>([
    { name: "", url: "" },
  ]);

  const [password, setPassword] = useState("");

  // Load all teams
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/teams`)
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("Failed to load teams:", err));
  }, []);

  // Load all divisions
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then((data) => setDivisions(data))
      .catch((err) => console.error("Failed to load divisions:", err));
  }, []);

  // Generic helper functions for managing streams
  const addStream = (team: "team1" | "team2") => {
    if (team === "team1")
      setTeam1Streams([...team1Streams, { name: "", url: "" }]);
    else setTeam2Streams([...team2Streams, { name: "", url: "" }]);
  };

  const handleStreamChange = (
    team: "team1" | "team2",
    index: number,
    field: keyof Stream,
    value: string
  ) => {
    const targetStreams = team === "team1" ? [...team1Streams] : [...team2Streams];
    targetStreams[index][field] = value;
    team === "team1"
      ? setTeam1Streams(targetStreams)
      : setTeam2Streams(targetStreams);
  };

  const removeStream = (team: "team1" | "team2", index: number) => {
    const updated =
      team === "team1"
        ? team1Streams.filter((_, i) => i !== index)
        : team2Streams.filter((_, i) => i !== index);
    team === "team1" ? setTeam1Streams(updated) : setTeam2Streams(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const team1StreamsObj: Record<string, string> = {};
    for (const s of team1Streams) {
      if (s.name && s.url) team1StreamsObj[s.name] = s.url;
    }

    const team2StreamsObj: Record<string, string> = {};
    for (const s of team2Streams) {
      if (s.name && s.url) team2StreamsObj[s.name] = s.url;
    }

    const upcoming = {
      week,
      datetime,
      division: divisionId,
      team1_id: Number(team1Id),
      team2_id: Number(team2Id),
      team1_streams: team1StreamsObj,
      team2_streams: team2StreamsObj,
      casted,
    };

    const response = await fetch(
      `${process.env.API_ROOT}/addupcoming?password=${password}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upcoming),
      }
    );

    if (response.ok) {
      alert("Upcoming match added successfully!");
      setTeam1Id("");
      setTeam2Id("");
      setDivisionId("");
      setWeek(0);
      setDatetime("");
      setTeam1Streams([{ name: "", url: "" }]);
      setTeam2Streams([{ name: "", url: "" }]);
      setCasted(false);
      setPassword("");
      if (onSubmit) onSubmit();
      window.location.reload();
    } else {
      alert("Failed to add upcoming match.");
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Add Upcoming Match</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Week */}
          <div>
            <Label>Week</Label>
            <Input
              type="number"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
            />
          </div>

          {/* Date/Time */}
          <div>
            <Label>Date/Time</Label>
            <Input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </div>

          {/* Division */}
          <div>
            <Label>Division</Label>
            <Select onValueChange={setDivisionId} value={divisionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((div) => (
                  <SelectItem key={div.id} value={div.name}>
                    {div.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Team 1</Label>
              <Select onValueChange={setTeam1Id} value={team1Id}>
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
            </div>

            <div>
              <Label>Team 2</Label>
              <Select onValueChange={setTeam2Id} value={team2Id}>
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
            </div>
          </div>

          {/* Casted checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="casted"
              checked={casted}
              onChange={(e) => setCasted(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="casted">Casted</Label>
          </div>

          {/* Team 1 Streams */}
          <div>
            <Label>Team 1 Streams</Label>
            {team1Streams.map((stream, index) => (
              <div
                key={`t1-${index}`}
                className="grid grid-cols-3 gap-2 mt-2 items-center"
              >
                <Input
                  placeholder="Stream Name"
                  value={stream.name}
                  onChange={(e) =>
                    handleStreamChange("team1", index, "name", e.target.value)
                  }
                />
                <Input
                  placeholder="Stream URL"
                  value={stream.url}
                  onChange={(e) =>
                    handleStreamChange("team1", index, "url", e.target.value)
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeStream("team1", index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              className="mt-3"
              size="sm"
              onClick={() => addStream("team1")}
            >
              + Add Stream
            </Button>
          </div>

          {/* Team 2 Streams */}
          <div>
            <Label>Team 2 Streams</Label>
            {team2Streams.map((stream, index) => (
              <div
                key={`t2-${index}`}
                className="grid grid-cols-3 gap-2 mt-2 items-center"
              >
                <Input
                  placeholder="Stream Name"
                  value={stream.name}
                  onChange={(e) =>
                    handleStreamChange("team2", index, "name", e.target.value)
                  }
                />
                <Input
                  placeholder="Stream URL"
                  value={stream.url}
                  onChange={(e) =>
                    handleStreamChange("team2", index, "url", e.target.value)
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeStream("team2", index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              className="mt-3"
              size="sm"
              onClick={() => addStream("team2")}
            >
              + Add Stream
            </Button>
          </div>

          {/* Password */}
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Add Upcoming Match
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
