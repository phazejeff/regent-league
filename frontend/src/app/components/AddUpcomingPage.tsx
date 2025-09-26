"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
  logo: string;
}

export default function AddUpcomingMatch() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [team1, setTeam1] = useState<number | null>(null);
  const [team2, setTeam2] = useState<number | null>(null);
  const [week, setWeek] = useState<number>(0);
  const [datetime, setDatetime] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [streams, setStreams] = useState<Record<string, string>>({});
  const [password, setPassword] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    fetch("/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data));
  }, []);

  const handleStreamChange = (key: string, value: string) => {
    setStreams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setMessage(null);

    if (!team1 || !team2) {
      setMessage({ type: "error", text: "Please select both teams" });
      return;
    }
    if (!password) {
      setMessage({ type: "error", text: "Please enter the password" });
      return;
    }

    setLoading(true);

    const body = {
      week,
      datetime,
      division,
      streams,
      team1_id: team1,
      team2_id: team2,
    };

    try {
      const res = await fetch(`/addupcoming?password=${password}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        setMessage({ type: "success", text: "Match added successfully!" });
      } else if (res.status === 401) {
        setMessage({ type: "error", text: "Incorrect password." });
      } else {
        setMessage({ type: "error", text: `Failed to add match (status ${res.status}).` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error while submitting." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md p-4 border rounded-xl shadow">
      <h2 className="text-xl font-bold">Add Upcoming Match</h2>

      {/* Feedback message */}
      {message && (
        <div
          className={`p-2 rounded text-sm ${
            message.type === "error"
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Password */}
      <Input
        type="password"
        placeholder="Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Week */}
      <Input
        type="number"
        placeholder="Week"
        value={week}
        onChange={(e) => setWeek(Number(e.target.value))}
      />

      {/* Date & Time */}
      <Input
        type="datetime-local"
        value={datetime}
        onChange={(e) => setDatetime(e.target.value)}
      />

      {/* Division */}
      <Input
        type="text"
        placeholder="Division"
        value={division}
        onChange={(e) => setDivision(e.target.value)}
      />

      {/* Team 1 */}
      <Select onValueChange={(val) => setTeam1(Number(val))}>
        <SelectTrigger>
          <SelectValue placeholder="Select Team 1" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Team 2 */}
      <Select onValueChange={(val) => setTeam2(Number(val))}>
        <SelectTrigger>
          <SelectValue placeholder="Select Team 2" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Streams */}
      <div className="space-y-2">
        <p className="font-medium">Streams</p>
        {["stream1", "stream2", "stream3"].map((key) => (
          <Input
            key={key}
            type="text"
            placeholder={`${key} URL`}
            value={streams[key] || ""}
            onChange={(e) => handleStreamChange(key, e.target.value)}
          />
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Add Match"}
      </Button>
    </div>
  );
}
