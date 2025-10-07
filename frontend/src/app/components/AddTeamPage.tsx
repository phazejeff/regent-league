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

interface Division {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  division: string;
}

export default function AddTeamPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedDiv, setSelectedDiv] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [teamName, setTeamName] = useState("");
  const [address, setAddress] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load divisions
  useEffect(() => {
    fetch(`${process.env.API_ROOT}/divisions`)
      .then((res) => res.json())
      .then((data) => setDivisions(data));
  }, []);

  // Load groups when division changes
  useEffect(() => {
    if (!selectedDiv) return;
    fetch(`${process.env.API_ROOT}/groups?div=${selectedDiv}`)
      .then((res) => res.json())
      .then((data) => setGroups(data));
  }, [selectedDiv]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let logoFilename = "";

    // Step 1: upload logo if file chosen
    if (logoFile) {
      const formData = new FormData();
      formData.append("file", logoFile);

      const uploadRes = await fetch(
        `${process.env.API_ROOT}/upload?password=${password}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        alert("Failed to upload logo.");
        return;
      }

      const fileName = await uploadRes.json();
      logoFilename = fileName;
    }

    // Step 2: submit team info
    const team = {
      name: teamName,
      div: selectedDiv,
      group: selectedGroup,
      logo: logoFilename,
      address,
      school,
    };

    const response = await fetch(
      `${process.env.API_ROOT}/addteam?password=${password}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      }
    );

    if (response.ok) {
      alert("Team added successfully!");
      setTeamName("");
      setSelectedDiv("");
      setSelectedGroup("");
      setAddress("");
      setSchool("");
      setPassword("");
      setLogoFile(null);
    } else {
      alert("Failed to add team.");
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle>Add New Team</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter team address"
              required
            />
          </div>

          {/* School */}
          <div>
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Enter school name"
              required
            />
          </div>

          {/* Division Selector */}
          <div>
            <Label htmlFor="division">Division</Label>
            <Select onValueChange={setSelectedDiv} value={selectedDiv}>
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

          {/* Group Selector */}
          <div>
            <Label htmlFor="group">Group</Label>
            <Select
              onValueChange={setSelectedGroup}
              value={selectedGroup}
              disabled={!selectedDiv}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
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

          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setLogoFile(e.target.files ? e.target.files[0] : null)
              }
              required
            />
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
            Add Team
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
