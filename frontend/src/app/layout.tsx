import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import TwitchFloating from "./components/FloatingTwitchButton";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RegentXD's Collegiate CS2 League",
  description: "Official Standings for RegentXD's Collegiate CS2 League",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gradient-to-tr from-[#0d1b2a] via-[#1b263b] to-[#9e2a2b]`}
      >
        <Script
          src="https://embed.twitch.tv/embed/v1.js"
          strategy="afterInteractive"
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="flex-grow">{children}</main>
          <TwitchFloating />
        </ThemeProvider>
        <footer className="w-full py-4 text-center text-sm backdrop-blur-md text-white sm:text-lg">
          Made by <Link href="https://github.com/phazejeff" target="_blank" rel="noopener noreferrer"><u>poop dealer</u></Link>
        </footer>
      </body>
    </html>
  );
}
