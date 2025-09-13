"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default function NavigationBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/standings", label: "Standings" },
    { href: "/matches", label: "Matches" },
    { href: "/playerstats", label: "Player Stats" },
  ];

  const renderLink = (href: string, label: string) => {
    const isActive = pathname === href;
    const base =
      "relative inline-block text-lg font-semibold px-3 py-2 transition-transform duration-200 ease-out transform active:scale-95";
    const activeStyles =
      "scale-105 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-md shadow-sm";
    const inactiveStyles =
      "text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:scale-105";

    return (
      <Link
        key={href}
        href={href}
        onClick={() => setIsOpen(false)}
        className={`${base} ${isActive ? activeStyles : inactiveStyles}`}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="w-full bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between h-16">
        {/* Left logo (desktop only) */}
        <div className="hidden md:flex flex-1 items-center ml-50">
          <div className="text-xl font-bold dark:text-white">
            RegentXD&apos;s Collegiate CS2 League
          </div>
        </div>

        {/* Centered nav */}
        <div className="hidden md:flex flex-1 justify-center space-x-8">
          {links.map((l) => renderLink(l.href, l.label))}
        </div>

        {/* Right side: Dark mode toggle (desktop) */}
        <div className="flex-1 hidden md:flex justify-end items-center mr-50">
          <DarkModeToggle />
        </div>

        {/* Mobile button */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((s) => !s)}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <DarkModeToggle />
        </div>
      </div>


      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col px-4 py-3 space-y-2">
            {links.map((l) => (
              <div key={l.href} className="w-full">
                <Link
                  href={l.href}
                  onClick={() => setIsOpen(false)}
                  className={`block w-full text-left text-base font-medium px-3 py-2 transition-transform duration-150 transform active:scale-95 ${
                    pathname === l.href
                      ? "scale-105 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-md shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:scale-105"
                  }`}
                >
                  {l.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}