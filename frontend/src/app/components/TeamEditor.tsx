"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
  logo: string;
}

export default function TeamEditor() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [password, setPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      const response = await fetch(`${process.env.API_ROOT}/teams`);
      setTeams(await response.json());
    };
    fetchTeams();
  }, []);

  const handleSave = async () => {
    if (!editingTeam) return;
    setUploading(true);

    try {
      let logoFilename = editingTeam.logo;

      // If a new file is selected, upload it first
      if (newLogoFile) {
        const formData = new FormData();
        formData.append("file", newLogoFile);

        const uploadResponse = await fetch(`${process.env.API_ROOT}/upload?password=${encodeURIComponent(password)}`, {
          method: "POST",
          body: formData,
        });
        if (uploadResponse.status == 401) {
            alert("Wrong password");
            setUploading(false);
            return;
        }

        if (!uploadResponse.ok) {
          alert("Failed to upload image");
          setUploading(false);
          return;
        }

        logoFilename = await uploadResponse.json(); // API should return filename
      }

      // Then update the team with the uploaded filename
      const response = await fetch(
        `${process.env.API_ROOT}/editteam?password=${encodeURIComponent(
          password
        )}&team_id=${editingTeam.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingTeam.name,
            div: editingTeam.div,
            group: editingTeam.group,
            logo: logoFilename,
          }),
        }
      );

      if (response.status === 401) {
        alert("Wrong password");
      } else if (response.status === 201) {
        alert("Team updated!");
        setEditingTeam(null);
        setPassword("");
        setNewLogoFile(null);
      } else {
        alert(`Unexpected response: ${response.status}`);
      }

      // Refresh teams list
      const res = await fetch(`${process.env.API_ROOT}/teams`);
      setTeams(await res.json());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Error saving team");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setEditingTeam(null);
    setPassword("");
    setNewLogoFile(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Team Management</h1>

        {/* Team List */}
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                {team.logo && (
                  <Image
                    src={`${process.env.API_ROOT}/photos/${team.logo}`}
                    alt={`${team.name} logo`}
                    width={48}
                    height={48}
                    className="object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Division: {team.div} | Group: {team.group}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTeam({ ...team })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTeam && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold mb-2">Edit Team</h2>

            <div>
              <label className="block font-medium mb-1">Team Name</label>
              <input
                type="text"
                value={editingTeam.name}
                onChange={(e) =>
                  setEditingTeam({ ...editingTeam, name: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Division</label>
              <input
                type="text"
                value={editingTeam.div}
                onChange={(e) =>
                  setEditingTeam({ ...editingTeam, div: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Group</label>
              <input
                type="text"
                value={editingTeam.group}
                onChange={(e) =>
                  setEditingTeam({ ...editingTeam, group: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Logo</label>
              {editingTeam.logo && (
                <div className="mb-2">
                  <Image
                    src={`${process.env.API_ROOT}/photos/${editingTeam.logo}`}
                    alt="Current logo"
                    width={80}
                    height={80}
                    className="object-cover rounded border"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Current: {editingTeam.logo}
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewLogoFile(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block font-medium mb-1">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to save changes"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
