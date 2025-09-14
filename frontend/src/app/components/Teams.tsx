"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface Division {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  div: string;
  group: string;
  logo?: string;
}

export default function TeamsByDivision() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedDivId, setSelectedDivId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [divRes, teamRes] = await Promise.all([
          fetch(`${process.env.API_ROOT}/divisions`),
          fetch(`${process.env.API_ROOT}/teams`),
        ]);

        const divisionsData: Division[] = await divRes.json();
        const teamsData: Team[] = await teamRes.json();

        setDivisions(divisionsData);
        setTeams(teamsData);
        if (divisionsData.length > 0) setSelectedDivId(divisionsData[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  const selectedDivision = divisions.find(d => d.id === selectedDivId);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Division Buttons */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {divisions.map((div) => (
          <button
            key={div.id}
            onClick={() => setSelectedDivId(div.id)}
            className={`px-6 py-3 rounded-lg text-lg font-semibold transition
              ${
                selectedDivId === div.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white"
              }`}
          >
            {div.name}
          </button>
        ))}
      </div>

      {/* Teams Grid with Fade Transition */}
      <AnimatePresence mode="wait">
        {selectedDivision && (
          <motion.div
            key={selectedDivision.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {teams.filter(t => t.div === selectedDivision.name).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No teams in this division.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {teams
                  .filter((team) => team.div === selectedDivision.name)
                  .map((team) => (
                    <Card
                      key={team.id}
                      className="hover:shadow-md transition flex flex-col items-center p-4"
                    >
                      {/* Logo */}
                      <div className="w-full flex justify-center mb-2">
                        {team.logo ? (
                          <Image
                            src={`${process.env.API_ROOT}/photos/${team.logo}`}
                            alt={`${team.name} logo`}
                            width={96}
                            height={96}
                            className="object-contain rounded-md"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
                        )}
                      </div>

                      {/* Team Name */}
                      <CardHeader className="w-full flex justify-center">
                        <div className="text-center w-full">
                          <CardTitle>{team.name}</CardTitle>
                        </div>
                      </CardHeader>

                      {/* Group */}
                      <CardContent>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Group: {team.group}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
