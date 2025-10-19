"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SiTwitch } from "react-icons/si";

export default function TwitchFloating() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [streamUsername, setStreamUsername] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);

    const fetchCurrentlyCasted = async () => {
      try {
        const response = await fetch(`${process.env.API_ROOT}/getcurrentlycasted`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const matches = await response.json();

        if (Array.isArray(matches) && matches.length > 0) {
          const match = matches[0];
          if (match.main_stream_url) {
            const username = match.main_stream_url
              .replace("https://www.twitch.tv/", "")
              .replace("https://twitch.tv/", "")
              .split("/")[0];
            setStreamUsername(username);
            setIsLive(true);
          }
        } else {
          setIsLive(false);
        }
      } catch (err) {
        console.error("Error fetching current casted matches:", err);
      }
    };

    checkMobile();
    fetchCurrentlyCasted();
    window.addEventListener("resize", checkMobile);

    const interval = setInterval(fetchCurrentlyCasted, 60000); // refresh every 60s
    return () => {
      window.removeEventListener("resize", checkMobile);
      clearInterval(interval);
    };
  }, []);

  // Show compact Twitch button if no live match or on mobile
  if (isMobile || !isLive || !streamUsername) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="https://twitch.tv/regent_xd"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition"
        >
          <SiTwitch size={18} />
          Watch on Twitch
        </a>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isClosed ? (
        <button
          onClick={() => setIsClosed(false)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition hover:cursor-pointer"
        >
          <SiTwitch size={18} />
          Open Stream
        </button>
      ) : (
        <div className="relative inline-block">
          {/* Close button */}
          <button
            onClick={() => setIsClosed(true)}
            className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 hover:bg-red-600 transition shadow-md hover:cursor-pointer"
            aria-label="Close stream"
          >
            <X size={16} />
          </button>

          {/* Twitch Embed */}
          <iframe
            src={`https://player.twitch.tv/?channel=${streamUsername}&parent=localhost&parent=regent-league.vercel.app&parent=regentsleague.poopdealer.lol&allowfullscreen=true&muted=true`}
            height="300"
            width="480"
            allowFullScreen
            className="rounded-xl shadow-lg"
          ></iframe>
        </div>
      )}
    </div>
  );
}
