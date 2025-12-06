"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const goals = ["Build muscle", "Lose fat", "General fitness", "Strength", "Endurance"];
const levels = ["Beginner", "Intermediate", "Advanced"];

export default function PlannerPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setPlan(null);

    const payload = {
      goal: formData.get("goal"),
      experienceLevel: formData.get("experienceLevel"),
      daysPerWeek: Number(formData.get("daysPerWeek")),
      timePerWorkoutMinutes: Number(formData.get("timePerWorkoutMinutes")),
      equipment: String(formData.get("equipment"))
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      injuries: formData.get("injuries"),
      preferences: formData.get("preferences"),
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
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.1),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.12),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.08),transparent_28%)]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-300/80">Planner</p>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              FitGenie Workout Planner
            </h1>
            <p className="max-w-3xl text-sm text-slate-300">
              Tell FitGenie about your goals, schedule, equipment, and any injuries. We&apos;ll build a clear, bullet-point plan you can follow today.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card className="bg-slate-900/70 border-slate-800/80 shadow-xl shadow-sky-900/10">
            <CardHeader>
              <CardTitle className="text-lg font-medium tracking-tight text-slate-100">
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
                    <span className="text-xs font-medium text-slate-200">
                      Goal
                    </span>
                    <select
                      name="goal"
                      className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
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
                    <span className="text-xs font-medium text-slate-200">
                      Experience level
                    </span>
                    <select
                      name="experienceLevel"
                      className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
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
                    <span className="text-xs font-medium text-slate-200">
                      Days per week
                    </span>
                    <Input
                      name="daysPerWeek"
                      type="number"
                      min={1}
                      max={7}
                      defaultValue={3}
                      className="h-10 border-slate-700 bg-slate-900 text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-200">
                      Time per workout (minutes)
                    </span>
                    <Input
                      name="timePerWorkoutMinutes"
                      type="number"
                      min={20}
                      max={120}
                      defaultValue={45}
                      className="h-10 border-slate-700 bg-slate-900 text-xs"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-200">
                    Available equipment
                  </span>
                  <Input
                    name="equipment"
                    placeholder="e.g. dumbbells, barbell, resistance bands, machines, bodyweight only"
                    className="h-10 border-slate-700 bg-slate-900 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">
                    Separate items with commas.
                  </span>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-200">
                    Injuries / limitations
                  </span>
                  <Textarea
                    name="injuries"
                    placeholder="e.g. lower back pain, knee issues, shoulder discomfort when pressing"
                    className="min-h-[80px] border-slate-700 bg-slate-900 text-xs"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-200">
                    Preferences
                  </span>
                  <Textarea
                    name="preferences"
                    placeholder="e.g. prefer push/pull/legs, like machines more than free weights, want short workouts"
                    className="min-h-[80px] border-slate-700 bg-slate-900 text-xs"
                  />
                </label>

                <p className="mt-1 text-[10px] text-slate-400">
                  This is general fitness information, not medical advice. If
                  you have health conditions, talk to a doctor before starting
                  any program.
                </p>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-10 bg-sky-500 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-900/20 hover:bg-sky-400 disabled:cursor-not-allowed"
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

                {error && (
                  <p className="mt-2 text-xs text-red-400">{error}</p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800/80 shadow-xl shadow-sky-900/10">
            <CardHeader>
              <CardTitle className="text-lg font-medium tracking-tight text-slate-100">
                Your FitGenie plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              {!plan && !loading && (
                <p className="text-xs text-slate-400">
                  Submit your profile to see a structured weekly plan with
                  days, exercises, sets, reps, rest, and notes.
                </p>
              )}
              {loading && (
                <div className="flex flex-col gap-3 text-xs text-slate-300">
                  <div className="h-2 w-24 rounded bg-slate-700/70 animate-pulse" />
                  <LoadingPlanSkeleton />
                  <p className="text-[11px] text-slate-400">
                    Building a safe, structured plan for you...
                  </p>
                </div>
              )}
      {plan && !loading && (
        <article className="prose prose-invert max-w-none text-xs leading-relaxed">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: markdownToHtml(plan) }} />
        </article>
      )}
    </CardContent>
  </Card>
</div>
      </main>
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
