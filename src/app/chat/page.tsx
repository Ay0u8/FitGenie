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
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Chat with FitGenie
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Ask free-form questions about training, warm-ups, exercise ideas
            and gym basics. Answers are for general information only and are
            not a substitute for medical advice.
          </p>
        </header>

        <Card className="flex min-h-[480px] flex-col bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs">
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
                        ? "bg-sky-500 text-slate-950"
                        : "bg-slate-800/80 text-slate-50"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-slate-800/80 px-3 py-2 text-xs text-slate-300">
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
                className="h-9 border-slate-700 bg-slate-900 text-xs"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-9 bg-sky-500 text-xs font-semibold text-slate-950 hover:bg-sky-400"
              >
                Send
              </Button>
            </form>

            {error && (
              <p className="text-[11px] text-red-400">{error}</p>
            )}

            <p className="mt-1 text-[10px] text-slate-400">
              FitGenie may make mistakes. This chat is for general fitness
              education only and is not medical advice.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
