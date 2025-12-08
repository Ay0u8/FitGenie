"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content:
      "Hi, I'm FitGenie. Ask me anything about beginner-friendly workouts, warm-ups, form, or how to structure your training. Remember: I can't give medical advice.",
  }]);
  const quickPrompts = [
    "Critique my split",
    "Substitute for Bench Press",
    "5-minute warm-up",
    "Fix my squat form",
    "Beginner dumbbell-only plan",
  ];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newMessages, message: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Surface backend error details in the UI when possible
        throw new Error(
          (data && (data.details as string)) ||
            (data && (data.error as string)) ||
            "Failed to get reply"
        );
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
            Chat
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Chat with FitGenie
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask free-form questions about training, warm-ups, exercise ideas
            and gym basics. Answers are for general information only and are
            not a substitute for medical advice.
          </p>
          <div className="flex flex-wrap gap-2 pt-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-foreground transition hover:border-primary hover:text-primary"
              >
                {prompt}
              </button>
            ))}
          </div>
        </header>

        <Card className="flex min-h-[480px] flex-col rounded-xl border border-border/70 bg-card/80 shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border/40 bg-card/70 p-3 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 leading-relaxed shadow-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <form className="flex gap-2" onSubmit={handleSend}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. What's a good warm-up for leg day?"
                className="h-9 border-border bg-card text-xs"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-9 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Send
              </Button>
            </form>

            {error && (
              <p className="text-[11px] text-destructive">{error}</p>
            )}

            <p className="mt-1 text-[10px] text-muted-foreground">
              FitGenie may make mistakes. This chat is for general fitness
              education only and is not medical advice.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
