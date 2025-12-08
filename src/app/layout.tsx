import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="border-b border-border bg-background/80 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 text-sm">
              <Link href="/" className="font-semibold tracking-tight">
                FitGenie
              </Link>
              <div className="flex items-center gap-4 text-xs">
                <Link
                  href="/planner"
                  className="transition hover:text-primary"
                >
                  Planner
                </Link>
                <Link href="/chat" className="transition hover:text-primary">
                  Chat
                </Link>
                <ThemeToggle />
              </div>
            </nav>
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
