import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16">
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Plan smarter workouts with FitGenie.
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              FitGenie helps gym beginners and regular lifters design safe,
              simple workout routines and get clear answers to common training
              questions — powered by fast Groq models and careful safety
              rules.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/planner"
                className="inline-flex h-9 items-center rounded-full bg-sky-500 px-4 font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400"
              >
                Open workout planner
              </Link>
              <Link
                href="/chat"
                className="inline-flex h-9 items-center rounded-full border border-slate-700 px-4 text-slate-200 transition hover:border-sky-500 hover:text-sky-300"
              >
                Chat with FitGenie
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              FitGenie does not provide medical advice. Always talk to a doctor
              or qualified professional before starting a new exercise program.
            </p>
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Example plan snippet
            </p>
            <div className="space-y-2">
              <p className="font-medium text-slate-100">Day 1 – Full body</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-300">
                <li>Goblet squat – 3 sets of 8–12 reps, 90s rest</li>
                <li>Dumbbell bench press – 3 sets of 8–12 reps, 90s rest</li>
                <li>Lat pulldown or assisted pull-up – 3 sets of 8–10 reps</li>
                <li>Plank – 3 sets of 20–30s hold</li>
              </ul>
            </div>
            <div className="space-y-1 rounded-md bg-slate-950/70 p-3">
              <p className="text-[11px] font-semibold text-slate-200">
                Safety first
              </p>
              <p className="text-[11px] text-slate-400">
                Begin with 5–10 minutes of light cardio and easy mobility. Stop
                any exercise that causes sharp pain, and ask a professional if
                you&apos;re unsure what&apos;s safe for you.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
