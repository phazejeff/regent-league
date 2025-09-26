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

export default function AddUpcomingMatch() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [divisionId, setDivisionId] = useState<string>("");

  const [week, setWeek] = useState<number>(0);
  const [datetime, setDatetime] = useState<string>("");

  const [streams, setStreams] = useState<Stream[]>([
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

  // Add new stream input
  const addStream = () => {
    setStreams([...streams, { name: "", url: "" }]);
  };

  // Handle stream changes
  const handleStreamChange = (
    index: number,
    field: keyof Stream,
    value: string
  ) => {
    const newStreams = [...streams];
    newStreams[index][field] = value;
    setStreams(newStreams);
  };

  // Remove stream
  const removeStream = (index: number) => {
    const newStreams = streams.filter((_, i) => i !== index);
    setStreams(newStreams);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert streams to object format
    const streamsObj: Record<string, string> = {};
    for (const s of streams) {
      if (s.name && s.url) {
        streamsObj[s.name] = s.url;
      }
    }

    const upcoming = {
      week,
      datetime,
      division: divisionId, // assuming backend expects division name or id
      streams: streamsObj,
      team1_id: Number(team1Id),
      team2_id: Number(team2Id),
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
      setStreams([{ name: "", url: "" }]);
      setPassword("");
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

          {/* Streams */}
          <div>
            <Label>Streams</Label>
            {streams.map((stream, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-2 mt-2 items-center"
              >
                <Input
                  placeholder="Stream Name"
                  value={stream.name}
                  onChange={(e) =>
                    handleStreamChange(index, "name", e.target.value)
                  }
                />
                <Input
                  placeholder="Stream URL"
                  value={stream.url}
                  onChange={(e) =>
                    handleStreamChange(index, "url", e.target.value)
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeStream(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              className="mt-3"
              size="sm"
              onClick={addStream}
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
