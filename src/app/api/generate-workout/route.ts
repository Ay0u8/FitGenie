import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { callGroqChat } from "@/lib/groq";
import { FITGENIE_SYSTEM_PROMPT_PLANNER } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      goal,
      experienceLevel,
      daysPerWeek,
      timePerWorkoutMinutes,
      equipment,
      injuries,
      preferences,
    } = body ?? {};

    if (!goal || !experienceLevel || !daysPerWeek || !timePerWorkoutMinutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userDescription = `User profile:
- Goal: ${goal}
- Experience level: ${experienceLevel}
- Days per week: ${daysPerWeek}
- Time per workout (minutes): ${timePerWorkoutMinutes}
- Available equipment: ${Array.isArray(equipment) && equipment.length > 0 ? equipment.join(", ") : "Not specified"}
- Injuries / limitations: ${injuries || "None mentioned"}
- Preferences: ${preferences || "None mentioned"}

Please generate a short, structured weekly workout plan following the instructions.`;

    const content = await callGroqChat({
      systemPrompt: FITGENIE_SYSTEM_PROMPT_PLANNER,
      messages: [{ role: "user", content: userDescription }],
    });

    const safeContent = ensureSafetyReminder(content);

    return NextResponse.json({ plan: safeContent });
  } catch (error) {
    console.error("/api/generate-workout error", error);
    return NextResponse.json(
      { error: "Failed to generate workout" },
      { status: 500 }
    );
  }
}

function ensureSafetyReminder(text: string): string {
  const reminder =
    "\n\n> Safety: This information is not medical advice. Talk to a doctor or qualified professional before starting a new exercise program, especially if you have injuries or health conditions.";

  if (text.toLowerCase().includes("this is not medical advice")) {
    return text;
  }

  return `${text.trim()}${reminder}`;
}
