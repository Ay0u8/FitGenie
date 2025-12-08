"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Clipboard, X, Dumbbell, Check, Maximize2, Download, Printer,   FileSpreadsheet,
} from "lucide-react";
import { exportWorkoutToExcel, parseStructuredData, type DayData, type ExerciseData } from "@/lib/excelExport";

const goals = ["Build muscle", "Lose fat", "General fitness", "Strength", "Endurance"];
const levels = ["Beginner", "Intermediate", "Advanced"];

type ParsedExercise = {
  name: string;
  sets?: number;
  reps?: string;
  load?: string;
  rpe?: string;
  rest?: string;
  description?: string;
  // Keep details for backward compatibility with markdown parsing
  details?: string;
};

type ParsedDay = {
  title: string;
  exercises: ParsedExercise[];
};

type ExerciseMedia = {
  id: number;
  name: string;
  description: string;
  media: {
    type: "video" | "image";
    assets: { id: number; url: string; isMain: boolean }[];
  } | null;
};

export default function PlannerPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [injuriesText, setInjuriesText] = useState("");
  const [copied, setCopied] = useState(false);
  const [parsedDays, setParsedDays] = useState<ParsedDay[]>([]);
  const [planMeta, setPlanMeta] = useState<{
    goal: string;
    daysPerWeek: number;
    programLengthWeeks: number;
  } | null>(null);
  const [activeExercise, setActiveExercise] = useState<ParsedExercise | null>(null);
  const [exerciseMedia, setExerciseMedia] = useState<ExerciseMedia | null>(null);
  const [exerciseModalError, setExerciseModalError] = useState<string | null>(null);
  const [exerciseModalLoading, setExerciseModalLoading] = useState(false);
  const exerciseMediaCache = useRef<Record<string, ExerciseMedia | null>>({});

  const combinedInjuries = useMemo(() => {
    if (!selectedAreas.length) return injuriesText;
    if (!injuriesText) return selectedAreas.join(", ");
    return `${selectedAreas.join(", ")}, ${injuriesText}`;
  }, [selectedAreas, injuriesText]);

  const planTitle = useMemo(() => {
    if (!planMeta) {
      return "Your Workout Plan";
    }
    const daysLabel = planMeta.daysPerWeek === 1 ? "1-Day" : `${planMeta.daysPerWeek}-Day`;
    const durationLabel = planMeta.programLengthWeeks > 1 ? `${planMeta.programLengthWeeks}-Week ` : "";
    const goalLabel = planMeta.goal || "Training";
    return `${durationLabel}${daysLabel} ${goalLabel} Plan`.replace(/\s+/g, " ").trim();
  }, [planMeta]);

  const handleExerciseDemo = async (exercise: ParsedExercise) => {
    setActiveExercise(exercise);
    setExerciseModalError(null);
    setExerciseMedia(null);
     setExerciseModalLoading(false);

    const key = exercise.name.toLowerCase();
    if (exerciseMediaCache.current[key] !== undefined) {
      setExerciseMedia(exerciseMediaCache.current[key]);
      return;
    }

    setExerciseModalLoading(true);
    try {
      const res = await fetch(`/api/exercise-media?name=${encodeURIComponent(exercise.name)}`);
      if (res.status === 404) {
        exerciseMediaCache.current[key] = null;
        setExerciseMedia(null);
        setExerciseModalLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error("No demo found for this exercise");
      }
      const data = await res.json();
      exerciseMediaCache.current[key] = data.exercise ?? null;
      setExerciseMedia(data.exercise ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load exercise demo";
      setExerciseModalError(message);
      exerciseMediaCache.current[key] = null;
    } finally {
      setExerciseModalLoading(false);
    }
  };

  const closeExerciseModal = () => {
    setActiveExercise(null);
    setExerciseMedia(null);
    setExerciseModalError(null);
    setExerciseModalLoading(false);
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setPlan(null);
    setParsedDays([]);
    setPlanMeta(null);
    setActiveExercise(null);
    setExerciseMedia(null);
    setExerciseModalError(null);
    setExerciseModalLoading(false);

    const goalValue = formData.get("goal");
    const experienceValue = formData.get("experienceLevel");
    const goal =
      typeof goalValue === "string" && goalValue.trim().length > 0 ? goalValue : goals[0];
    const experienceLevel =
      typeof experienceValue === "string" && experienceValue.trim().length > 0
        ? experienceValue
        : levels[0];
    const daysPerWeek = Number(formData.get("daysPerWeek")) || 1;
    const timePerWorkoutMinutes = Number(formData.get("timePerWorkoutMinutes")) || 45;
    const rawProgramLength = Number(formData.get("programLengthWeeks"));
    const programLengthWeeks =
      Number.isFinite(rawProgramLength) && rawProgramLength > 0
        ? Math.min(rawProgramLength, 12)
        : 1;
    const equipmentInput = formData.get("equipment");
    const equipment =
      typeof equipmentInput === "string"
        ? equipmentInput
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [];
    const preferencesValue = formData.get("preferences");
    const preferences = typeof preferencesValue === "string" ? preferencesValue : "";

    const payload = {
      goal,
      experienceLevel,
      daysPerWeek,
      timePerWorkoutMinutes,
      programLengthWeeks,
      equipment,
      injuries: combinedInjuries,
      preferences,
    };

    try {
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate plan");
      }

      const data = await res.json();
      setPlan(data.plan);
      setPlanMeta({ goal, daysPerWeek, programLengthWeeks });

      // Try to parse JSON data first, fallback to markdown parsing
      const jsonDays = parseJsonToParsedDays(data.plan);
      if (jsonDays.length > 0) {
        setParsedDays(jsonDays);
      } else {
        // Fallback to markdown parsing if JSON not available
        setParsedDays(parsePlanByDay(data.plan));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Strip the STRUCTURED_DATA JSON section from the plan
   * Returns only the markdown content
   */
  const stripStructuredData = (planText: string): string => {
    // Find and remove everything from ## STRUCTURED_DATA onwards
    const match = planText.match(/([\s\S]*?)(?:\n\s*##\s*STRUCTURED_DATA[\s\S]*)?$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return planText;
  };

  const handleCopy = () => {
    if (!plan) return;
    const markdownOnly = stripStructuredData(plan);
    navigator.clipboard.writeText(markdownOnly).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!plan) return;
    const markdownOnly = stripStructuredData(plan);
    const fileName =
      planTitle.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() ||
      "fitgenie-plan";
    const blob = new Blob([markdownOnly], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPlan = () => {
    if (!plan) return;
    const markdownOnly = stripStructuredData(plan);
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const htmlContent = markdownToHtml(markdownOnly);
    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${planTitle}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #0f172a; }
      h1 { margin-bottom: 12px; }
      h2, h3 { margin-top: 24px; margin-bottom: 8px; }
      ul { margin-left: 18px; }
      blockquote { border-left: 3px solid #94a3b8; padding-left: 12px; color: #475569; }
    </style>
  </head>
  <body>
    <h1>${planTitle}</h1>
    <div>${htmlContent}</div>
    <script>
      window.onload = function() {
        window.focus();
        window.print();
      };
    </script>
  </body>
</html>`);
    printWindow.document.close();
  };

  const handleDownloadExcel = () => {
    if (!plan || !planMeta) return;

    const success = exportWorkoutToExcel(plan, planTitle, planMeta.programLengthWeeks);

    if (!success) {
      setError("Could not generate Excel file. The workout plan may not contain structured data.");
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 dark:opacity-100 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.1),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.12),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.08),transparent_28%)]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Planner</p>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              FitGenie Workout Planner
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Tell FitGenie about your goals, schedule, equipment, and any injuries. We&apos;ll build a clear, bullet-point plan you can follow today.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card className="bg-card border-border shadow-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                Your training profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSubmit(formData);
                }}
                className="flex flex-col gap-4 text-sm"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-foreground">Goal</span>
                    <select
                      name="goal"
                      className="h-10 rounded-md border border-input bg-card px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      defaultValue={goals[0]}
                    >
                      {goals.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-foreground">Experience level</span>
                    <select
                      name="experienceLevel"
                      className="h-10 rounded-md border border-input bg-card px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      defaultValue={levels[0]}
                    >
                      {levels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-foreground">Days per week</span>
                    <Input
                      name="daysPerWeek"
                      type="number"
                      min={1}
                      max={7}
                      defaultValue={3}
                      className="h-10 border-input bg-card text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-foreground">Time per workout (minutes)</span>
                    <Input
                      name="timePerWorkoutMinutes"
                      type="number"
                      min={20}
                      max={120}
                      defaultValue={45}
                      className="h-10 border-input bg-card text-xs"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-foreground">Program length (weeks)</span>
                  <Input
                    name="programLengthWeeks"
                    type="number"
                    min={1}
                    max={12}
                    defaultValue={4}
                    className="h-10 border-input bg-card text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    FitGenie will explain how to run this plan for the number of weeks you enter.
                  </span>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-foreground">Available equipment</span>
                  <Input
                    name="equipment"
                    placeholder="e.g. dumbbells, barbell, resistance bands, machines, bodyweight only"
                    className="h-10 border-input bg-card text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Separate items with commas.</span>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-foreground">Injuries / limitations</span>
                  <Textarea
                    name="injuries"
                    placeholder="e.g. lower back pain, knee issues, shoulder discomfort when pressing"
                    value={injuriesText}
                    onChange={(e) => setInjuriesText(e.target.value)}
                    className="min-h-[80px] border-input bg-card text-xs"
                  />
                </label>

                <div className="mt-2">
                  <BodyMap
                    selected={selectedAreas}
                    onToggle={(area) =>
                      setSelectedAreas((prev) =>
                        prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
                      )
                    }
                    onClearAll={() => setSelectedAreas([])}
                    onSelectAll={(areas) => setSelectedAreas(areas)}
                  />
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-foreground">Preferences</span>
                  <Textarea
                    name="preferences"
                    placeholder="e.g. prefer push/pull/legs, like machines more than free weights, want short workouts"
                    className="min-h-[80px] border-input bg-card text-xs"
                  />
                </label>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  This is general fitness information, not medical advice. If you have health conditions,
                  talk to a doctor before starting any program.
                </p>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-10 bg-primary text-xs font-semibold text-primary-foreground shadow-lg shadow-md hover:bg-primary/90 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-900" />
                      Generating plan...
                    </span>
                  ) : (
                    "Generate workout plan"
                  )}
                </Button>

                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                Your FitGenie plan
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Submit your profile to see a structured weekly plan with days, exercises, sets, reps, rest, and notes.
              </p>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              {!plan && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Dumbbell className="h-8 w-8 text-foreground0" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Fill out your training profile and generate a personalized workout plan
                  </p>
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Generating your plan...</p>
                  </div>
                  <LoadingPlanSkeleton />
                </div>
              )}

              {plan && !loading && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Generated Plan Card
                    </p>
                    <h3 className="text-xl font-bold text-foreground mb-4">{planTitle}</h3>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Weekly breakdown</p>
                      {parsedDays.length > 0 ? (
                        <div className="max-h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                          {parsedDays.map((day, index) => (
                            <DaySection key={`${day.title}-${index}`} day={day} onViewExercise={handleExerciseDemo} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground py-2 max-h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto custom-scrollbar">
                          <div
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(plan) }}
                            className="prose dark:prose-invert prose-xs max-w-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex-1 min-w-[140px] h-9 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                      ) : (
                        <Clipboard className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {copied ? "Copied!" : "Copy Plan"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadMarkdown}
                      className="flex-1 min-w-[140px] h-9 border-input text-foreground hover:bg-accent hover:text-foreground text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download .md
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintPlan}
                      className="flex-1 min-w-[140px] h-9 border-input text-foreground hover:bg-accent hover:text-foreground text-xs"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Print / PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadExcel}
                      className="flex-1 min-w-[140px] h-9 bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 text-xs"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                      Download Excel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      {activeExercise && (
        <ExerciseModal
          exercise={activeExercise}
          media={exerciseMedia}
          loading={exerciseModalLoading}
          error={exerciseModalError}
          onClose={closeExerciseModal}
        />
      )}
    </div>
  );
}

function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/^-\s+(.*$)/gim, "<li>$1</li>")
    .replace(/^\*\s+(.*$)/gim, "<li>$1</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .trim();

  if (html.includes("<li>")) {
    html = html.replace(/(?:\s*<li>[\s\S]*?<\/li>)+/g, (match) => {
      return `<ul class="list-disc pl-4 space-y-1">${match}</ul>`;
    });
  }

  return html;
}

/**
 * Convert JSON structured data to ParsedDay format for frontend display
 * Only displays the first week since all weeks are the same
 */
function parseJsonToParsedDays(planText: string): ParsedDay[] {
  try {
    const jsonData = parseStructuredData(planText);
    if (!jsonData || jsonData.length === 0) {
      return [];
    }

    const parsedDays: ParsedDay[] = [];

    // Only process days from week 1 to avoid duplicates
    const firstWeekDays = jsonData.filter((dayData: DayData) => dayData.week === 1);

    firstWeekDays.forEach((dayData: DayData) => {
      const dayTitle = `Day ${dayData.day}`;

      const exercises: ParsedExercise[] = dayData.exercises.map((ex: ExerciseData) => {
        return {
          name: ex.exercise,
          sets: ex.sets,
          reps: ex.reps,
          load: ex.load,
          rpe: ex.rpe,
          rest: ex.rest,
          description: ex.description,
        };
      });

      parsedDays.push({
        title: dayTitle,
        exercises,
      });
    });

    return parsedDays;
  } catch (error) {
    console.error("Failed to parse JSON structured data:", error);
    return [];
  }
}

function parsePlanByDay(plan: string): ParsedDay[] {
  const lines = plan.split("\n");
  const days: ParsedDay[] = [];
  let current: ParsedDay | null = null;

  const commitDay = () => {
    if (current && current.exercises.length > 0) {
      days.push(current);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^(?:#+\s*)?(Day\s*\d+[^\r\n]*)$/i);
    if (headingMatch) {
      commitDay();
      const headingText = headingMatch[1].trim().replace(/\s+/g, " ");
      current = {
        title: headingText.replace(/\s*[:\-–]\s*$/, ""),
        exercises: [],
      };
      continue;
    }

    if (!current) continue;

    const exercise = parseExerciseLine(line);
    if (exercise) {
      current.exercises.push(exercise);
    }
  }

  commitDay();

  return days;
}

function parseExerciseLine(line: string): ParsedExercise | null {
  const bulletMatch = line.match(/^[-*]\s*(.+)$/);
  if (!bulletMatch) {
    return null;
  }

  const content = bulletMatch[1].trim();
  if (!content) {
    return null;
  }

  const [namePart, ...rest] = content.split(":");
  const name = namePart.trim();
  const details = rest.join(":").trim();

  return {
    name,
    details: details || undefined,
  };
}

function DaySection({
  day,
  onViewExercise,
}: {
  day: ParsedDay;
  onViewExercise: (exercise: ParsedExercise) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card/80 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{day.title}</p>
        <span className="text-[11px] text-foreground0">{day.exercises.length} exercise(s)</span>
      </div>
      {day.exercises.length > 0 ? (
        <div className="space-y-2">
          {day.exercises.map((exercise, index) => (
            <ExerciseCard
              key={`${day.title}-${index}`}
              exercise={exercise}
              onViewExercise={onViewExercise}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No exercise details provided for this day.</p>
      )}
    </section>
  );
}

function ExerciseCard({
  exercise,
  onViewExercise,
}: {
  exercise: ParsedExercise;
  onViewExercise: (exercise: ParsedExercise) => void;
}) {
  // Check if we have structured data or just details string
  const hasStructuredData = exercise.sets || exercise.reps || exercise.load || exercise.rpe || exercise.rest;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-sky-500/50 transition-all group">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center border border-border">
        <Dumbbell className="h-4 w-4 text-sky-500 dark:text-sky-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground mb-1.5">{exercise.name}</p>

        {hasStructuredData ? (
          <div className="space-y-1">
            {/* Primary workout metrics */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {exercise.sets && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-sky-600 dark:text-sky-400">{exercise.sets}</span> sets
                </span>
              )}
              {exercise.reps && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{exercise.reps}</span> reps
                </span>
              )}
              {exercise.load && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{exercise.load}</span>
                </span>
              )}
            </div>

            {/* Secondary metrics */}
            {(exercise.rpe || exercise.rest) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {exercise.rpe && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    <span className="text-[10px] font-medium">RPE</span>
                    <span className="font-semibold">{exercise.rpe}</span>
                  </span>
                )}
                {exercise.rest && (
                  <span className="text-muted-foreground">
                    Rest: <span className="text-foreground/80">{exercise.rest}</span>
                  </span>
                )}
              </div>
            )}

            {/* Description/notes */}
            {exercise.description && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                {exercise.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {exercise.details || "Open demo to see sets, reps, and cues"}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onViewExercise(exercise)}
        className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-[11px] text-foreground hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        View demo
      </button>
    </div>
  );
}


function BodyMap({
  selected,
  onToggle,
  onClearAll,
  onSelectAll,
}: {
  selected: string[];
  onToggle: (area: string) => void;
  onClearAll: () => void;
  onSelectAll: (areas: string[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Front body hotspots - aligned to body silhouette (viewBox 0 0 206.326 206.326)
  // Body center x=103, torso ends ~y=118, legs split below that
  const frontHotspots = [
    { key: "Head", cx: 103, cy: 8, r: 4 },
    { key: "Neck", cx: 103, cy: 25, r: 3 },
    { key: "Left shoulder", cx: 83, cy: 37, r: 3.5 },
    { key: "Right shoulder", cx: 123, cy: 37, r: 3.5 },
    { key: "Chest", cx: 103, cy: 48, r: 5 },
    { key: "Left bicep", cx: 82, cy: 55, r: 3 },
    { key: "Right bicep", cx: 124, cy: 55, r: 3 },
    { key: "Abs", cx: 103, cy: 75, r: 4.5 },
    { key: "Left forearm", cx: 75, cy: 80, r: 3 },
    { key: "Right forearm", cx: 131, cy: 80, r: 3 },
    { key: "Left wrist", cx: 72, cy: 95, r: 2.5 },
    { key: "Right wrist", cx: 133.5, cy: 95, r: 2.5 },
    { key: "Left hand", cx: 69, cy: 105, r: 3 },
    { key: "Right hand", cx:137, cy: 105, r: 3 },
    { key: "Left hip", cx: 95, cy: 95, r: 3 },
    { key: "Right hip", cx: 111, cy: 95, r: 3 },
    { key: "Left quad", cx: 92, cy: 130, r: 4 },
    { key: "Right quad", cx: 114, cy: 130, r: 4 },
    { key: "Left knee", cx: 93, cy: 152, r: 3 },
    { key: "Right knee", cx: 113, cy: 152, r: 3 },
    { key: "Left shin", cx: 92, cy: 172, r: 3 },
    { key: "Right shin", cx: 114, cy: 172, r: 3 },
    { key: "Left ankle", cx: 94, cy: 190, r: 2.5 },
    { key: "Right ankle", cx: 112, cy: 190, r: 2.5 },
    { key: "Left foot", cx: 95, cy: 200, r: 3 },
    { key: "Right foot", cx: 111, cy: 200, r: 3 },
  ];

  // Back body hotspots - aligned to body silhouette (viewBox 0 0 206.326 206.326)
  const backHotspots = [
    { key: "Head (back)", cx: 103, cy: 8, r: 4 },
    { key: "Neck (back)", cx: 103, cy: 25, r: 3 },
    { key: "Left trap", cx: 93, cy: 32, r: 3 },
    { key: "Right trap", cx: 113, cy: 32, r: 3 },
    { key: "Upper back", cx: 103, cy: 45, r: 5 },
    { key: "Left rear delt", cx: 83, cy: 40, r: 3 },
    { key: "Right rear delt", cx: 123, cy: 40, r: 3 },
    { key: "Left tricep", cx: 82, cy: 55, r: 3 },
    { key: "Right tricep", cx: 124, cy: 55, r: 3 },
    { key: "Mid back", cx: 103, cy: 60, r: 4 },
    { key: "Lower back", cx: 103, cy: 82, r: 4.5 },
    { key: "Left wrist (back)", cx: 72, cy: 95, r: 2.5 },
    { key: "Right wrist (back)", cx: 133.5, cy: 95, r: 2.5 },
    { key: "Left hand (back)", cx: 69, cy: 105, r: 3 },
    { key: "Right hand (back)", cx: 137, cy: 105, r: 3 },
    { key: "Glutes", cx: 103, cy: 105, r: 5 },
    { key: "Left hamstring", cx: 92, cy: 130, r: 4 },
    { key: "Right hamstring", cx: 114, cy: 130, r: 4 },
    { key: "Left calf", cx: 92, cy: 172, r: 3.5 },
    { key: "Right calf", cx: 114, cy: 172, r: 3.5 },
    { key: "Left Achilles", cx: 94, cy: 190, r: 2.5 },
    { key: "Right Achilles", cx: 112, cy: 190, r: 2.5 },
    { key: "Left heel", cx: 95, cy: 200, r: 3 },
    { key: "Right heel", cx: 111, cy: 200, r: 3 },
  ];

  // Get all muscle keys for select all
  const allMuscleKeys = [...frontHotspots, ...backHotspots].map(h => h.key);

  const isSelected = (key: string) => selected.includes(key);

  // The human body silhouette path
  const bodyPath = "M104.265,117.959c-0.304,3.58,2.126,22.529,3.38,29.959c0.597,3.52,2.234,9.255,1.645,12.3c-0.841,4.244-1.084,9.736-0.621,12.934c0.292,1.942,1.211,10.899-0.104,14.175c-0.688,1.718-1.949,10.522-1.949,10.522c-3.285,8.294-1.431,7.886-1.431,7.886c1.017,1.248,2.759,0.098,2.759,0.098c1.327,0.846,2.246-0.201,2.246-0.201c1.139,0.943,2.467-0.116,2.467-0.116c1.431,0.743,2.758-0.627,2.758-0.627c0.822,0.414,1.023-0.109,1.023-0.109c2.466-0.158-1.376-8.05-1.376-8.05c-0.92-7.088,0.913-11.033,0.913-11.033c6.004-17.805,6.309-22.53,3.909-29.24c-0.676-1.937-0.847-2.704-0.536-3.545c0.719-1.941,0.195-9.748,1.072-12.848c1.692-5.979,3.361-21.142,4.231-28.217c1.169-9.53-4.141-22.308-4.141-22.308c-1.163-5.2,0.542-23.727,0.542-23.727c2.381,3.705,2.29,10.245,2.29,10.245c-0.378,6.859,5.541,17.342,5.541,17.342c2.844,4.332,3.921,8.442,3.921,8.747c0,1.248-0.273,4.269-0.273,4.269l0.109,2.631c0.049,0.67,0.426,2.977,0.365,4.092c-0.444,6.862,0.646,5.571,0.646,5.571c0.92,0,1.931-5.522,1.931-5.522c0,1.424-0.348,5.687,0.42,7.295c0.919,1.918,1.595-0.329,1.607-0.78c0.243-8.737,0.768-6.448,0.768-6.448c0.511,7.088,1.139,8.689,2.265,8.135c0.853-0.407,0.073-8.506,0.073-8.506c1.461,4.811,2.569,5.577,2.569,5.577c2.411,1.693,0.92-2.983,0.585-3.909c-1.784-4.92-1.839-6.625-1.839-6.625c2.229,4.421,3.909,4.257,3.909,4.257c2.174-0.694-1.9-6.954-4.287-9.953c-1.218-1.528-2.789-3.574-3.245-4.789c-0.743-2.058-1.304-8.674-1.304-8.674c-0.225-7.807-2.155-11.198-2.155-11.198c-3.3-5.282-3.921-15.135-3.921-15.135l-0.146-16.635c-1.157-11.347-9.518-11.429-9.518-11.429c-8.451-1.258-9.627-3.988-9.627-3.988c-1.79-2.576-0.767-7.514-0.767-7.514c1.485-1.208,2.058-4.415,2.058-4.415c2.466-1.891,2.345-4.658,1.206-4.628c-0.914,0.024-0.707-0.733-0.707-0.733C115.068,0.636,104.01,0,104.01,0h-1.688c0,0-11.063,0.636-9.523,13.089c0,0,0.207,0.758-0.715,0.733c-1.136-0.03-1.242,2.737,1.215,4.628c0,0,0.572,3.206,2.058,4.415c0,0,1.023,4.938-0.767,7.514c0,0-1.172,2.73-9.627,3.988c0,0-8.375,0.082-9.514,11.429l-0.158,16.635c0,0-0.609,9.853-3.922,15.135c0,0-1.921,3.392-2.143,11.198c0,0-0.563,6.616-1.303,8.674c-0.451,1.209-2.021,3.255-3.249,4.789c-2.408,2.993-6.455,9.24-4.29,9.953c0,0,1.689,0.164,3.909-4.257c0,0-0.046,1.693-1.827,6.625c-0.35,0.914-1.839,5.59,0.573,3.909c0,0,1.117-0.767,2.569-5.577c0,0-0.779,8.099,0.088,8.506c1.133,0.555,1.751-1.047,2.262-8.135c0,0,0.524-2.289,0.767,6.448c0.012,0.451,0.673,2.698,1.596,0.78c0.779-1.608,0.429-5.864,0.429-7.295c0,0,0.999,5.522,1.933,5.522c0,0,1.099,1.291,0.648-5.571c-0.073-1.121,0.32-3.422,0.369-4.092l0.106-2.631c0,0-0.274-3.014-0.274-4.269c0-0.311,1.078-4.415,3.921-8.747c0,0,5.913-10.488,5.532-17.342c0,0-0.082-6.54,2.299-10.245c0,0,1.69,18.526,0.545,23.727c0,0-5.319,12.778-4.146,22.308c0.864,7.094,2.53,22.237,4.226,28.217c0.886,3.094,0.362,10.899,1.072,12.848c0.32,0.847,0.152,1.627-0.536,3.545c-2.387,6.71-2.083,11.436,3.921,29.24c0,0,1.848,3.945,0.914,11.033c0,0-3.836,7.892-1.379,8.05c0,0,0.192,0.523,1.023,0.109c0,0,1.327,1.37,2.761,0.627c0,0,1.328,1.06,2.463,0.116c0,0,0.91,1.047,2.237,0.201c0,0,1.742,1.175,2.777-0.098c0,0,1.839,0.408-1.435-7.886c0,0-1.254-8.793-1.945-10.522c-1.318-3.275-0.387-12.251-0.106-14.175c0.453-3.216,0.21-8.695-0.618-12.934c-0.606-3.038,1.035-8.774,1.641-12.3c1.245-7.423,3.685-26.373,3.38-29.959l1.008,0.354C103.809,118.312,104.265,117.959,104.265,117.959z";

  const renderHotspot = (spot: { key: string; cx: number; cy: number; r: number }) => {
    const active = isSelected(spot.key);
    return (
      <g key={spot.key} className="cursor-pointer" onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(spot.key);
      }}>
        {/* Static halo ring when selected (no animation) */}
        {active && (
          <circle
            cx={spot.cx}
            cy={spot.cy}
            r={spot.r + 3.5}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.2"
            opacity="0.45"
          />
        )}
        {/* Main dot */}
        <circle
          cx={spot.cx}
          cy={spot.cy}
          r={spot.r}
          fill={active ? "#22d3ee" : "transparent"}
          stroke={active ? "#22d3ee" : "rgba(148, 163, 184, 0.5)"}
          strokeWidth={active ? 2 : 1.5}
          className="transition-all duration-200 hover:stroke-cyan-400 hover:fill-cyan-400/30"
        />
        {/* Inner dot */}
        <circle
          cx={spot.cx}
          cy={spot.cy}
          r={spot.r * 0.4}
          fill={active ? "#fff" : "rgba(148, 163, 184, 0.6)"}
          className="transition-all duration-200"
        />
        <title>{spot.key}</title>
      </g>
    );
  };

  const renderBodyView = (hotspots: typeof frontHotspots, label: string, gradientId: string, size: "small" | "large") => {
    const svgSize = size === "large" ? { width: 280, maxHeight: 480 } : { width: 120, maxHeight: 200 };
    return (
      <div className="flex flex-col items-center">
        <span className={`text-muted-foreground mb-2 uppercase tracking-wider ${size === "large" ? "text-sm" : "text-[10px]"}`}>{label}</span>
        <svg
          viewBox="0 0 206.326 206.326"
          style={{ width: `${svgSize.width}px`, height: 'auto', maxHeight: `${svgSize.maxHeight}px` }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <path d={bodyPath} fill={`url(#${gradientId})`} opacity="0.8" />
          {hotspots.map(renderHotspot)}
        </svg>
      </div>
    );
  };

  return (
    <>
      {/* Expanded Modal View */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm transition-all duration-300 ease-out ${
          isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(false);
        }}
      >
        <div
          className={`relative w-full max-w-4xl mx-4 p-8 rounded-2xl border border-input bg-card/95 shadow-2xl transition-all duration-300 ease-out ${
            isExpanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-slate-700 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-1">Body Map</h3>
              <p className="text-sm text-primary">Click on body areas to tag discomfort or injuries</p>
              {/* Select All / Clear All buttons */}
              <div className="flex justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectAll(allMuscleKeys);
                  }}
                  className="px-4 py-1.5 text-xs rounded-lg border border-slate-600 bg-muted hover:bg-slate-700 text-muted-foreground hover:text-white transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClearAll();
                  }}
                  disabled={selected.length === 0}
                  className="px-4 py-1.5 text-xs rounded-lg border border-slate-600 bg-muted hover:bg-slate-700 text-muted-foreground hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Large Body Views */}
            <div className="flex justify-center gap-16">
              {renderBodyView(frontHotspots, "Front", "bodyGradFrontLarge", "large")}
              {renderBodyView(backHotspots, "Back", "bodyGradBackLarge", "large")}
            </div>

            {/* Selected areas in modal */}
            {selected.length > 0 && (
              <div className="mt-8 pt-6 border-t border-input">
                <p className="text-xs text-muted-foreground mb-3 text-center">Selected areas ({selected.length})</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {selected.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggle(area);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300 hover:bg-cyan-500/20 transition-colors group"
                    >
                      {area}
                      <X className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Done button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="px-6 py-2 rounded-lg bg-sky-600 hover:bg-primary text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Compact View */}
      <div
        className="mt-3 rounded-xl border border-border bg-background/70 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-foreground">Body Map</p>
          <div className="flex items-center gap-3">
            {/* Expand button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 hover:bg-slate-700 text-muted-foreground hover:text-white transition-all duration-200 hover:scale-110"
              title="Expand body map"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-primary">Click areas to tag discomfort</span>
          </div>
        </div>

        <div className="flex justify-center gap-6">
          {renderBodyView(frontHotspots, "Front", "bodyGradFront", "small")}
          {renderBodyView(backHotspots, "Back", "bodyGradBack", "small")}
        </div>

        {/* Selected areas tags */}
        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            {selected.map((area) => (
              <button
                key={area}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(area);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300 hover:bg-cyan-500/20 transition-colors group"
              >
                {area}
                <X className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function LoadingPlanSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-700/60" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-700/60" />
        <div className="h-3 w-[92%] rounded bg-slate-700/60" />
        <div className="h-3 w-[88%] rounded bg-slate-700/60" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-700/60" />
        <div className="h-3 w-[94%] rounded bg-slate-700/60" />
        <div className="h-3 w-[90%] rounded bg-slate-700/60" />
      </div>
    </div>
  );
}
function ExerciseModal({
  exercise,
  media,
  loading,
  error,
  onClose,
}: {
  exercise: ParsedExercise;
  media: ExerciseMedia | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const renderMedia = () => {
    if (!media?.media) {
      return (
        <p className="text-xs text-muted-foreground">
          Wger did not return demo media for this exercise. Step-by-step cues are shown above.
        </p>
      );
    }

    if (media.media.type === "video") {
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Video demos</p>
          <div className="grid gap-3 md:grid-cols-2">
            {media.media.assets.map((asset) => (
              <div
                key={asset.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <video
                  controls
                  loop
                  className="w-full rounded-lg"
                  style={{ maxHeight: "320px" }}
                  preload="metadata"
                >
                  <source src={asset.url} type="video/mp4" />
                  Your browser does not support embedded videos.
                </video>
                {asset.isMain && (
                  <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Primary demo
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Image references</p>
        <div className="grid gap-3 md:grid-cols-2">
          {media.media.assets.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <Image
                src={asset.url}
                alt={media.name}
                width={640}
                height={320}
                className="h-52 w-full object-cover"
                loading="lazy"
              />
              {asset.isMain && (
                <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Primary angle
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 py-6">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-6">
        <button
          type="button"
          className="absolute right-5 top-5 rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground hover:border-sky-500/50 transition-colors"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-5 pr-8">
          {/* Header */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Exercise Details</p>
            <h2 className="text-2xl font-semibold text-foreground mb-3">{exercise.name}</h2>

            {/* Workout Parameters - Show if structured data exists */}
            {(exercise.sets || exercise.reps || exercise.load || exercise.rpe || exercise.rest) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                {exercise.sets && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sets</p>
                    <p className="text-xl font-bold text-sky-600 dark:text-sky-400">{exercise.sets}</p>
                  </div>
                )}
                {exercise.reps && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reps</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{exercise.reps}</p>
                  </div>
                )}
                {exercise.load && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Load</p>
                    <p className="text-base font-semibold text-foreground">{exercise.load}</p>
                  </div>
                )}
                {exercise.rpe && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">RPE</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/15 border border-orange-500/30">
                      <span className="text-base font-bold text-orange-600 dark:text-orange-400">{exercise.rpe}</span>
                      <span className="text-[10px] text-orange-500/70">/10</span>
                    </div>
                  </div>
                )}
                {exercise.rest && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rest</p>
                    <p className="text-sm font-medium text-foreground">{exercise.rest}</p>
                  </div>
                )}
              </div>
            )}

            {/* Exercise Description/Notes */}
            {exercise.description && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Form Cues & Notes</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{exercise.description}</p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              Fetching demo from Wger...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                {error} <span className="text-muted-foreground">(try searching manually in your app)</span>
              </p>
            </div>
          )}

          {/* Media Content */}
          {!loading && !error && media && (
            <div className="space-y-4">
              {media.description && (
                <div className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/20">
                  <p className="text-[10px] uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1.5">Exercise Description</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{media.description}</p>
                </div>
              )}
              {renderMedia()}
            </div>
          )}

          {/* No Media State */}
          {!loading && !error && !media && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No Wger entry was found for this exercise. The workout parameters and form cues are shown above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
