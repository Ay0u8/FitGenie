"use client";

import { useState } from "react";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export function AuthButtons() {
  const { session, supabase, loading } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Enter your email");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
      return;
    }

    setStatus("sent");
  };

  if (loading) {
    return <span className="text-[11px] text-muted-foreground">Loading...</span>;
  }

  if (session?.user) {
    const emailAddress = session.user.email ?? "Account";
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="truncate max-w-[140px] text-muted-foreground">
          {emailAddress}
        </span>
        <button
          type="button"
          className="rounded-full border border-border px-3 py-1 transition hover:border-primary hover:text-primary"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-full border border-border px-3 py-1 text-xs transition hover:border-primary hover:text-primary"
        onClick={() => setOpen((prev) => !prev)}
      >
        Sign in
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-background/95 p-3 shadow-xl">
          <p className="text-[11px] text-muted-foreground mb-2">
            Enter your email to get a magic sign-in link.
          </p>
          <form className="space-y-2" onSubmit={handleMagicLink}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send magic link"}
            </button>
          </form>
          {status === "sent" && (
            <p className="mt-2 text-[11px] text-emerald-400">
              Check your inbox for the link.
            </p>
          )}
          {errorMessage && (
            <p className="mt-2 text-[11px] text-red-400">{errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
