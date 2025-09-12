"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Division {
  name: string;
}

interface Group {
  division: string;
  name: string;
}

export default function DivsAndGroupsEditor() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [password, setPassword] = useState("");

  // Fetch divisions & groups
  useEffect(() => {
    const fetchData = async () => {
      fetch(`${process.env.API_ROOT}/divisions`)
        .then((res) => res.json())
        .then(setDivisions);
      fetch(`${process.env.API_ROOT}/groups`)
        .then((res) => res.json())
        .then(setGroups);
    };
    fetchData();
  }, []);

  // Update division name
  const handleDivisionChange = (index: number, value: string) => {
    const newDivs = [...divisions];
    newDivs[index].name = value;
    setDivisions(newDivs);
  };

  // Update group name
  const handleGroupChange = (index: number, value: string) => {
    const newGroups = [...groups];
    newGroups[index].name = value;
    setGroups(newGroups);
  };

  // Add division
  const addDivision = () => {
    setDivisions([...divisions, { name: "New Division" }]);
  };

  // Delete division (also deletes its groups)
  const deleteDivision = (name: string) => {
    setDivisions(divisions.filter((d) => d.name !== name));
    setGroups(groups.filter((g) => g.division !== name));
  };

  // Add group
  const addGroup = (division: string) => {
    setGroups([...groups, { division, name: "New Group" }]);
  };

  // Delete group
  const deleteGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  // Submit changes
  const handleSubmit = async () => {
    const resp = await fetch(`${process.env.API_ROOT}/setdivsandgroups?password=${password}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ divs: divisions, groups }),
    });
    if (resp.status == 401) {
        alert("Wrong password");
        return;
    } else if (resp.status != 201) {
        alert("Something wrong happened");
        return;
    }
    alert("Divisions and groups updated!");
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Edit Divisions & Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
        </div>

        {divisions.map((div, divIndex) => (
          <div key={divIndex} className="border rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={div.name}
                onChange={(e) => handleDivisionChange(divIndex, e.target.value)}
              />
              <Button
                variant="destructive"
                onClick={() => deleteDivision(div.name)}
              >
                Delete Division
              </Button>
            </div>

            <div className="pl-4 space-y-2">
              {groups
                .filter((g) => g.division === div.name)
                .map((group, groupIndex) => (
                  <div key={groupIndex} className="flex items-center gap-2">
                    <Input
                      value={group.name}
                      onChange={(e) =>
                        handleGroupChange(
                          groups.findIndex((g) => g === group),
                          e.target.value
                        )
                      }
                    />
                    <Button
                      variant="destructive"
                      onClick={() =>
                        deleteGroup(groups.findIndex((g) => g === group))
                      }
                    >
                      Delete Group
                    </Button>
                  </div>
                ))}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => addGroup(div.name)}
              >
                + Add Group
              </Button>
            </div>
          </div>
        ))}

        <Button onClick={addDivision} variant="secondary">
          + Add Division
        </Button>

        <Button onClick={handleSubmit} className="w-full mt-4">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
