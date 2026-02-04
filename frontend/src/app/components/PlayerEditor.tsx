"use client";

import { useState, useEffect } from "react";

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
  logo: string;
}

interface Player {
  id: number;
  name: string;
  real_name: string;
  year: string;
  major: string;
  main: boolean;
  faceit_url: string;
  steam_id: string;
  hometown: string;
  former_player: boolean;
  team_id: number;
  team_sub_id?: number | string;
  team: Team;
}

export default function PlayerEditor() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [password, setPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | "all">("all");

  const filteredPlayers = players.filter((p) => {
    if (selectedTeam === "all") return true;
    if (selectedTeam === 0) return !p.team;
    return p.team?.id === selectedTeam;
  });

  // Fetch players and teams
  useEffect(() => {
    const fetchData = async () => {
      const [playersRes, teamsRes] = await Promise.all([
        fetch(`${process.env.API_ROOT}/players`),
        fetch(`${process.env.API_ROOT}/teams`),
      ]);
      setPlayers(await playersRes.json());
      setTeams(await teamsRes.json());
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editingPlayer) return;
    if (editingPlayer.team_sub_id == 0 || editingPlayer.team_sub_id == "") {
      editingPlayer.team_sub_id = undefined;
    }
    const response = await fetch(
      `${process.env.API_ROOT}/editplayer?password=${encodeURIComponent(
        password
      )}&player_id=${editingPlayer.id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlayer),
      }
    );
    if (response.status == 401) {
      alert("Wrong password");
      return;
    }

    if (response.status == 201) {
      alert("Player updated!");
      setEditingPlayer(null);
      setPassword(""); // Clear password after successful save
    }

    // refresh player list
    const res = await fetch(`${process.env.API_ROOT}/players`);
    setPlayers(await res.json());
  };

  const handleCancel = () => {
    setEditingPlayer(null);
    setPassword("");
  };

  // Handle player deletion
  const handleDelete = async () => {
    if (!playerToDelete) return;

    const response = await fetch(
      `${process.env.API_ROOT}/deleteplayer?player_id=${playerToDelete.id}&password=${encodeURIComponent(
        deletePassword
      )}`,
      {
        method: "DELETE",
      }
    );

    if (response.status === 401) {
      alert("Wrong password");
      return;
    }

    if (response.status === 200) {
      alert(`Deleted player: ${playerToDelete.name}`);
      setPlayerToDelete(null);
      setDeletePassword("");
      // refresh player list
      const res = await fetch(`${process.env.API_ROOT}/players`);
      setPlayers(await res.json());
    }
  };

  const handleDeleteCancel = () => {
    setPlayerToDelete(null);
    setDeletePassword("");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Player Management</h1>

        {/* Team Filter */}
        <div className="flex items-center gap-4">
          <label className="font-medium">Filter by team:</label>
          <select
            value={selectedTeam}
            onChange={(e) => {
              const value =
                e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
              setSelectedTeam(value);
            }}
            className="p-2 border rounded dark:text-white"
          >
            <option value="all">All Teams</option>
            <option value={0}>No Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.div}/{t.group})
              </option>
            ))}
          </select>
        </div>

        {/* Player List */}
        <div className="space-y-4">
          {filteredPlayers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {p.real_name ? p.real_name + " |" : ""} {p.year} | {p.major} | {p.team ? p.team.name : "No Team"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status: {p.former_player ? "Former Player" : p.main ? "Main Player" : "Substitute Player"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {p.faceit_url ? "✅ Faceit |" : "❌ Faceit |"} {p.steam_id ? "✅ Steam" : "❌ Steam"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPlayer({ ...p })}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                {/* Delete Button */}
                <button
                  onClick={() => setPlayerToDelete(p)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">Edit Player</h2>

            <div>
              <label className="block font-medium mb-1">Name</label>
              <input
                type="text"
                value={editingPlayer.name}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, name: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Real Name</label>
              <input
                type="text"
                value={editingPlayer.real_name}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    real_name: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Hometown</label>
              <input
                type="text"
                value={editingPlayer.hometown}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, hometown: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Faceit URL</label>
              <input
                type="text"
                value={editingPlayer.faceit_url}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, faceit_url: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Steam64 ID</label>
              <input
                type="text"
                value={editingPlayer.steam_id}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, steam_id: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Year</label>
              <input
                type="text"
                value={editingPlayer.year}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, year: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Major</label>
              <input
                type="text"
                value={editingPlayer.major}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, major: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Main Player?</label>
              <input
                type="checkbox"
                checked={editingPlayer.main}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    main: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span>{editingPlayer.main ? "Yes" : "No"}</span>
            </div>

            <div>
              <label className="block font-medium mb-1">Former Player?</label>
              <span className="text-sm text-gray-400">The main player box will be ignored if this is yes</span><br></br>
              <input
                type="checkbox"
                checked={editingPlayer.former_player}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    former_player: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span>{editingPlayer.former_player ? "Yes" : "No"}</span>
            </div>

            <div>
              <label className="block font-medium mb-1">Team</label>
              <select
                value={editingPlayer.team_id}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    team_id: parseInt(e.target.value, 10),
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value={0} className="dark:text-black">
                  No Team
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id} className="dark:text-black">
                    {t.name} ({t.div}/{t.group})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">2nd Team</label>
              <span className="text-sm text-gray-400">Will be classified as a sub for the 2nd team if applicable. This is typically used if a player from a Challengers team subs for their school's Elite team.</span><br></br>
              <span className="text-sm text-gray-400">If this player is only a sub for their main team and nothing more, leave this as "No Team" and uncheck the "Main" box above.</span>
              <select
                value={editingPlayer.team_sub_id}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    team_sub_id: parseInt(e.target.value, 10),
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value={0} className="dark:text-black">
                  No Team
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id} className="dark:text-black">
                    {t.name} ({t.div}/{t.group})
                  </option>
                ))}
              </select>
            </div>

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
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Delete Modal */}
      {playerToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">
              Delete {playerToDelete.name}?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This action cannot be undone.
            </p>

            <div>
              <label className="block font-medium mb-1">Admin Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to confirm deletion"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
