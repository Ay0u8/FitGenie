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
      programLengthWeeks,
      equipment,
      injuries,
      preferences,
    } = body ?? {};

    const numericDays = Number(daysPerWeek);
    const numericTime = Number(timePerWorkoutMinutes);
    const numericWeeksRaw = Number(programLengthWeeks);
    const numericWeeks =
      Number.isFinite(numericWeeksRaw) && numericWeeksRaw > 0
        ? Math.min(numericWeeksRaw, 12)
        : 1;

    if (!goal || !experienceLevel || !numericDays || !numericTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userDescription = `User profile:
- Goal: ${goal}
- Experience level: ${experienceLevel}
- Days per week: ${numericDays}
- Time per workout (minutes): ${numericTime}
- Program length (weeks): ${numericWeeks}
- Available equipment: ${Array.isArray(equipment) && equipment.length > 0 ? equipment.join(", ") : "Not specified"}
- Injuries / limitations: ${injuries || "None mentioned"}
- Preferences: ${preferences || "None mentioned"}

Plan requirements:
- Build exactly ${numericDays} distinct training day${numericDays === 1 ? "" : "s"} each week and label them clearly.
- Keep each workout close to ${numericTime} minutes unless the user stated otherwise.
- Explain how to follow or progress the structure for ${numericWeeks} week${numericWeeks === 1 ? "" : "s"} (mention deload or repeat guidance if needed).

Please generate a short, structured weekly workout plan following the instructions.`;

    const content = await callGroqChat({
      systemPrompt: FITGENIE_SYSTEM_PROMPT_PLANNER,
      messages: [{ role: "user", content: userDescription }],
    });

    const safeContent = ensureSafetyReminder(content);

    return NextResponse.json({ plan: safeContent });
  } catch (error) {
    console.error("/api/generate-workout error", error);
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: "Failed to generate workout", details: message },
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
