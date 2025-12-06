import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { callGroqChat } from "@/lib/groq";
import { FITGENIE_SYSTEM_PROMPT_CHAT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, message } = body ?? {};

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item && item.role && item.content) {
          const role = item.role === "assistant" ? "assistant" : "user";
          messages.push({ role, content: String(item.content) });
        }
      }
    }

    messages.push({ role: "user", content: message });

    const content = await callGroqChat({
      systemPrompt: FITGENIE_SYSTEM_PROMPT_CHAT,
      messages,
    });

    const safeContent = ensureSafetyReminder(content);

    return NextResponse.json({ reply: safeContent });
  } catch (error) {
    console.error("/api/chat error", error);
    return NextResponse.json(
      { error: "Failed to get chat reply" },
      { status: 500 }
    );
  }
}

function ensureSafetyReminder(text: string): string {
  const key = "this is not medical advice";
  if (text.toLowerCase().includes(key)) {
    return text;
  }

  const reminder =
    "\n\n> Safety: This information is not medical advice. Talk to a doctor or qualified professional before starting a new exercise program, especially if you have injuries or health conditions.";

  return `${text.trim()}${reminder}`;
}
