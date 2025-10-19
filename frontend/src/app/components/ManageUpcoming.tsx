'use client'
import React, { useEffect, useState } from "react";
import AddMatchPage from "./AddMatchPage";

type StreamMap = Record<string, string>;

interface Team {
  name: string;
  div: string;
  group: string;
  logo: string;
  id: number;
  mainColor: string;
}

interface Match {
  id: number;
  week: number;
  datetime: string;
  division: string;
  casted: boolean;
  team1_streams: StreamMap;
  team2_streams: StreamMap;
  team1: Team;
  team2: Team;
  main_stream_name: string;
  main_stream_url: string;
}

export default function ManageUpcoming() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [password, setPassword] = useState("");

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${process.env.API_ROOT}/getupcoming`);
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleEditSubmit = async () => {
    if (!editMatch) return;

    const payload = {
      id: editMatch.id,
      week: editMatch.week,
      datetime: editMatch.datetime,
      division: editMatch.division,
      casted: editMatch.casted,
      team1_id: editMatch.team1.id,
      team2_id: editMatch.team2.id,
      team1_streams: editMatch.team1_streams,
      team2_streams: editMatch.team2_streams,
      main_stream_name: editMatch.main_stream_name || "RegentXD",
      main_stream_url: editMatch.main_stream_url || "https://twitch.tv/regent_xd",
    };

    try {
      const res = await fetch(
        `${process.env.API_ROOT}/editupcoming?password=${encodeURIComponent(password)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      setEditMatch(null);
      fetchMatches();
    } catch (err) {
      console.error("Failed to edit match:", err);
      alert("Failed to edit match. Check console for details.");
    }
  };

  const handleDelete = async (match: Match) => {
    const confirmed = confirm(
      `Are you sure you want to delete the match:\n${match.team1.name} vs ${match.team2.name}?`
    );
    if (!confirmed) return;

    const pw = prompt("Enter admin password to confirm deletion:");
    if (!pw) return;

    try {
      const res = await fetch(
        `${process.env.API_ROOT}/deleteupcoming?password=${encodeURIComponent(
          pw
        )}&upcoming_id=${match.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error(await res.text());

      alert("Match deleted successfully.");
      fetchMatches();
    } catch (err) {
      console.error("Failed to delete match:", err);
      alert("Failed to delete match. Check console for details.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upcoming Matches</h1>

      {matches.length === 0 ? (
        <p className="text-gray-500">No upcoming matches.</p>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row justify-between items-center p-4 rounded-2xl shadow bg-white dark:bg-gray-950"
            >
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{match.team1.name}</span>
                </div>

                <span className="text-gray-400 font-medium">vs</span>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">{match.team2.name}</span>
                </div>
              </div>

              <div className="text-center md:text-center mt-2 md:mt-0">
                <p className="text-gray-600 dark:text-gray-300">
                  {new Date(match.datetime).toLocaleString()}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Week {match.week} · {match.division}
                </p>
                {match.casted && (
                  <p className="text-blue-500 font-medium">🎥 Casted</p>
                )}
              </div>

              <div className="flex gap-2 mt-3 md:mt-0">
                <button
                  onClick={() => setSelectedMatch(match)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  Finalize
                </button>
                <button
                  onClick={() => setEditMatch({ ...match })}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(match)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Finalize Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white dark:bg-gray-950 p-2 border-b rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Finalize: {selectedMatch.team1.name} vs {selectedMatch.team2.name}
              </h2>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-red-600 hover:text-red-800 text-3xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <AddMatchPage
                _team1Id={selectedMatch.team1.id.toString()}
                _team2Id={selectedMatch.team2.id.toString()}
                _datetime={selectedMatch.datetime}
                _upcomingId={selectedMatch.id}
                onSubmit={() => {
                  setSelectedMatch(null);
                  fetchMatches();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg max-w-lg w-full p-6 relative">
            <div className="sticky top-0 bg-white dark:bg-gray-950 p-2 border-b rounded-t-2xl flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Edit Match: {editMatch.team1.name} vs {editMatch.team2.name}
              </h2>
              <button
                onClick={() => setEditMatch(null)}
                className="text-red-600 hover:text-red-800 text-3xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Week */}
              <label className="block">
                <span className="text-gray-700 dark:text-gray-300">Week</span>
                <input
                  type="number"
                  value={editMatch.week}
                  onChange={(e) =>
                    setEditMatch({ ...editMatch, week: parseInt(e.target.value) })
                  }
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-900"
                />
              </label>

              {/* Division */}
              <label className="block">
                <span className="text-gray-700 dark:text-gray-300">Division</span>
                <input
                  type="text"
                  value={editMatch.division}
                  onChange={(e) =>
                    setEditMatch({ ...editMatch, division: e.target.value })
                  }
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-900"
                />
              </label>

              {/* Date/Time */}
              <label className="block">
                <span className="text-gray-700 dark:text-gray-300">Date & Time</span>
                <input
                  type="datetime-local"
                  value={
                    editMatch.datetime.length > 16
                      ? editMatch.datetime.slice(0, 16)
                      : editMatch.datetime
                  }
                  onChange={(e) =>
                    setEditMatch({
                      ...editMatch,
                      datetime: e.target.value,
                    })
                  }
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-900"
                />
              </label>

              {/* Casted Checkbox */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editMatch.casted}
                  onChange={(e) =>
                    setEditMatch({ ...editMatch, casted: e.target.checked })
                  }
                  className="w-5 h-5 accent-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Casted (Has Stream)
                </span>
              </label>

              {/* Main Stream Section */}
              <label className="block">
                <span className="text-gray-700 dark:text-gray-300">Main Stream Name</span>
                <input
                  type="text"
                  value={editMatch.main_stream_name || "RegentXD"}
                  onChange={(e) =>
                    setEditMatch({ ...editMatch, main_stream_name: e.target.value })
                  }
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-900"
                />
              </label>

              <label className="block">
                <span className="text-gray-700 dark:text-gray-300">Main Stream URL</span>
                <input
                  type="text"
                  value={editMatch.main_stream_url || "https://twitch.tv/regent_xd"}
                  onChange={(e) =>
                    setEditMatch({ ...editMatch, main_stream_url: e.target.value })
                  }
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-900"
                />
              </label>

              {/* Stream Editing Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  {editMatch.team1.name} Streams
                </h3>
                {Object.entries(editMatch.team1_streams || {}).map(
                  ([key, value], idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Stream Name"
                        value={key}
                        onChange={(e) => {
                          const newStreams = { ...editMatch.team1_streams };
                          const val = newStreams[key];
                          delete newStreams[key];
                          newStreams[e.target.value] = val;
                          setEditMatch({
                            ...editMatch,
                            team1_streams: newStreams,
                          });
                        }}
                        className="flex-1 p-2 border rounded-lg dark:bg-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Stream URL"
                        value={value}
                        onChange={(e) => {
                          setEditMatch({
                            ...editMatch,
                            team1_streams: {
                              ...editMatch.team1_streams,
                              [key]: e.target.value,
                            },
                          });
                        }}
                        className="flex-[2] p-2 border rounded-lg dark:bg-gray-900"
                      />
                      <button
                        onClick={() => {
                          const newStreams = { ...editMatch.team1_streams };
                          delete newStreams[key];
                          setEditMatch({
                            ...editMatch,
                            team1_streams: newStreams,
                          });
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  )
                )}
                <button
                  onClick={() => {
                    const newStreams = { ...editMatch.team1_streams };
                    newStreams[`NewStream${Object.keys(newStreams).length + 1}`] = "";
                    setEditMatch({
                      ...editMatch,
                      team1_streams: newStreams,
                    });
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  + Add Stream
                </button>
              </div>

              {/* Team 2 Streams */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  {editMatch.team2.name} Streams
                </h3>
                {Object.entries(editMatch.team2_streams || {}).map(
                  ([key, value], idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Stream Name"
                        value={key}
                        onChange={(e) => {
                          const newStreams = { ...editMatch.team2_streams };
                          const val = newStreams[key];
                          delete newStreams[key];
                          newStreams[e.target.value] = val;
                          setEditMatch({
                            ...editMatch,
                            team2_streams: newStreams,
                          });
                        }}
                        className="flex-1 p-2 border rounded-lg dark:bg-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="Stream URL"
                        value={value}
                        onChange={(e) => {
                          setEditMatch({
                            ...editMatch,
                            team2_streams: {
                              ...editMatch.team2_streams,
                              [key]: e.target.value,
                            },
                          });
                        }}
                        className="flex-[2] p-2 border rounded-lg dark:bg-gray-900"
                      />
                      <button
                        onClick={() => {
                          const newStreams = { ...editMatch.team2_streams };
                          delete newStreams[key];
                          setEditMatch({
                            ...editMatch,
                            team2_streams: newStreams,
                          });
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  )
                )}
                <button
                  onClick={() => {
                    const newStreams = { ...editMatch.team2_streams };
                    newStreams[`NewStream${Object.keys(newStreams).length + 1}`] = "";
                    setEditMatch({
                      ...editMatch,
                      team2_streams: newStreams,
                    });
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  + Add Stream
                </button>
              </div>

              {/* Password */}
              <label className="block mt-4">
                <span className="text-gray-700 dark:text-gray-300">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-900"
                />
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setEditMatch(null)}
                  className="px-4 py-2 rounded-xl bg-gray-400 hover:bg-gray-500 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
)}

    </div>
  );
}
