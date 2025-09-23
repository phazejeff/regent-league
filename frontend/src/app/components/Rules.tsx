"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Division {
  id: number;
  name: string;
}

const rulesDocs: Record<string, { view: string; mobile: string }> = {
  Elites: {
    view: "https://docs.google.com/document/d/1AXnkKkmM_HJ6h7XAejdm-_Q3XjfPh8QdvcdclMwXrJo/view",
    mobile:
      "https://docs.google.com/document/d/1AXnkKkmM_HJ6h7XAejdm-_Q3XjfPh8QdvcdclMwXrJo/mobilebasic",
  },
  Challengers: {
    view: "https://docs.google.com/document/d/1XdG79c2RTE1YAkR1ku0PX-EtL5C9pdzfKoAoxXyxDQ0/view",
    mobile:
      "https://docs.google.com/document/d/1XdG79c2RTE1YAkR1ku0PX-EtL5C9pdzfKoAoxXyxDQ0/mobilebasic",
  },
};

export default function RulesPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivId, setSelectedDivId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Hardcode divisions
    const divs: Division[] = [
      { id: 1, name: "Elites" },
      { id: 2, name: "Challengers" },
    ];
    setDivisions(divs);
    setSelectedDivId(divs[0].id);
  }, []);

  const selectedDivision = divisions.find((d) => d.id === selectedDivId);

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

      {/* Iframe Embed with Fade Transition */}
      <AnimatePresence mode="wait">
        {selectedDivision && (
          <motion.div
            key={selectedDivision.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* "Open in New Tab" button */}
            <div className="mb-2 flex justify-end">
              <a
                href={rulesDocs[selectedDivision.name].view}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Open Doc in New Tab
              </a>
            </div>

            {/* Embedded doc */}
            <div className="p-2 border-8 border-black rounded-xl shadow-xl bg-black">
              <iframe
                src={
                  isMobile
                    ? rulesDocs[selectedDivision.name].mobile
                    : rulesDocs[selectedDivision.name].view
                }
                className="w-full h-[calc(100vh-180px)] rounded-lg shadow-md border"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
