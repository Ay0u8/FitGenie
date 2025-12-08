const BASE_URL = "https://wger.de/api/v2";
const USER_AGENT = "FitGenie Planner (fitgenie-web)";

type ExerciseInfo = {
  id: number;
  uuid: string;
  created: string;
  last_update: string;
  category: {
    id: number;
    name: string;
  };
  images: Array<{
    id: number;
    uuid: string;
    image: string;
    is_main: boolean;
    license: number;
    license_author: string;
  }>;
  videos: Array<{
    id: number;
    uuid: string;
    video: string;
    is_main: boolean;
    size: number;
    duration: string;
    width: number;
    height: number;
    codec: string;
    codec_long: string;
    license: number;
    license_author: string;
  }>;
  translations: Array<{
    id: number;
    uuid: string;
    name: string;
    description: string;
    language: number;
  }>;
};

async function fetchExerciseInfo(params: Record<string, string>) {
  const url = new URL(`${BASE_URL}/exerciseinfo/`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch exerciseinfo");
  }

  return (await res.json()) as { results: ExerciseInfo[] };
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(kettlebell|resistance band|cable|bodyweight|standing|seated|lying)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getExerciseMediaByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const results = await lookupExercise(trimmed);
  if (!results || results.length === 0) {
    return null;
  }

  const normalizedTarget = normalizeName(trimmed);

  // Find best match by scoring
  const scored = results.map(exercise => {
    // Get English translation
    const englishTrans = exercise.translations.find(t => t.language === 2);
    if (!englishTrans) return { exercise, score: 0 };

    const exerciseName = normalizeName(englishTrans.name);
    let score = 0;

    // Exact match
    if (exerciseName === normalizedTarget) {
      score += 1000;
    }

    // Partial match - count matching words
    const targetWords = normalizedTarget.split(/\s+/);
    const nameWords = exerciseName.split(/\s+/);
    const matchingWords = targetWords.filter(word => nameWords.includes(word));
    score += matchingWords.length * 10;

    // Bonus for having media
    if (exercise.videos.length > 0) score += 50;
    if (exercise.images.length > 0) score += 20;

    return { exercise, score };
  });

  const bestMatch = scored.sort((a, b) => b.score - a.score)[0];
  if (bestMatch.score === 0) return null;

  const exercise = bestMatch.exercise;
  const englishTrans = exercise.translations.find(t => t.language === 2) || exercise.translations[0];

  if (!englishTrans) return null;

  const media =
    exercise.videos?.length > 0
      ? {
          type: "video" as const,
          assets: exercise.videos.map((video) => ({
            id: video.id,
            url: video.video,
            isMain: video.is_main,
          })),
        }
      : exercise.images?.length > 0
        ? {
            type: "image" as const,
            assets: exercise.images.map((image) => ({
              id: image.id,
              url: image.image,
              isMain: image.is_main,
            })),
          }
        : null;

  return {
    id: exercise.id,
    name: englishTrans.name,
    description: englishTrans.description,
    media,
  };
}

// Cache for exercises to avoid repeated API calls
let exerciseCache: ExerciseInfo[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getAllExercises(): Promise<ExerciseInfo[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (exerciseCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return exerciseCache;
  }

  // Fetch exercises in batches
  const allExercises: ExerciseInfo[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore && offset < 500) { // Limit to 500 total to avoid infinite loop
    const data = await fetchExerciseInfo({
      limit: String(limit),
      offset: String(offset),
    });

    allExercises.push(...data.results);

    if (data.results.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  exerciseCache = allExercises;
  cacheTimestamp = now;
  return allExercises;
}

async function lookupExercise(name: string) {
  const normalizedSearch = normalizeName(name);
  const searchWords = normalizedSearch.split(/\s+/).filter(Boolean);

  // Get all exercises
  const allExercises = await getAllExercises();

  // Filter to only exercises with media (videos or images)
  const exercisesWithMedia = allExercises.filter(
    (ex) => ex.videos.length > 0 || ex.images.length > 0
  );

  // If we have exercises with media, prefer those
  const searchPool =
    exercisesWithMedia.length > 0 ? exercisesWithMedia : allExercises;

  if (searchWords.length === 0) {
    return searchPool;
  }

  const filtered = searchPool.filter((exercise) => {
    const englishTrans =
      exercise.translations.find((t) => t.language === 2) ||
      exercise.translations[0];
    if (!englishTrans) return false;
    const exerciseName = normalizeName(englishTrans.name);
    return searchWords.every((word) => exerciseName.includes(word));
  });

  return filtered.length > 0 ? filtered : searchPool;
}
