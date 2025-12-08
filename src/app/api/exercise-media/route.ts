import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getExerciseMediaByName } from "@/lib/wger";

function sanitizeDescription(html: string) {
  if (!html) return "";
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Missing exercise name" }, { status: 400 });
  }

  try {
    const media = await getExerciseMediaByName(name);
    if (!media) {
      return NextResponse.json({ exercise: null }, { status: 404 });
    }

    return NextResponse.json({
      exercise: {
        id: media.id,
        name: media.name,
        description: sanitizeDescription(media.description),
        media: media.media,
      },
    });
  } catch (error) {
    console.error("exercise-media", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise media" },
      { status: 500 }
    );
  }
}
