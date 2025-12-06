import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitGenie – AI Workout Planner",
  description:
    "FitGenie helps gym beginners and regulars plan safe, simple workouts with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-50 antialiased`}
      >
        <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 text-sm">
            <Link href="/" className="font-semibold tracking-tight">
              FitGenie
            </Link>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <Link
                href="/planner"
                className="transition hover:text-sky-400"
              >
                Planner
              </Link>
              <Link href="/chat" className="transition hover:text-sky-400">
                Chat
              </Link>
            </div>
          </nav>
        </div>
        {children}
      </body>
    </html>
  );
}
