"use client";

import { useEffect, useState } from "react";

export default function TwitchFloating() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // treat <=768px as mobile
    };
    const checkIsLive = async () => {
      const response = await fetch(`${process.env.API_ROOT}/islive`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      setIsLive(await response.json())
    }

    checkMobile();
    checkIsLive();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isMobile || !isLive ? (
        <a
          href="https://twitch.tv/regent_xd"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition"
        >
          Watch on Twitch
        </a>
      ) : (
        <iframe
          src="https://player.twitch.tv/?channel=stewie2k&parent=localhost&parent=regent-league.vercel.app"
          height="250"
          width="400"
          allowFullScreen
          className="rounded-xl shadow-lg"
        ></iframe>
      )}
    </div>
  );
}
