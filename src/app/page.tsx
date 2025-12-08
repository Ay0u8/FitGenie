import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted to-background text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16">
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Plan smarter workouts with FitGenie.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              FitGenie helps gym beginners and regular lifters design safe,
              simple workout routines and get clear answers to common training
              questions — powered by fast Groq models and careful safety
              rules.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/planner"
                className="inline-flex h-9 items-center rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Open workout planner
              </Link>
              <Link
                href="/chat"
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-foreground transition hover:border-primary hover:text-primary"
              >
                Chat with FitGenie
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground">
              FitGenie does not provide medical advice. Always talk to a doctor
              or qualified professional before starting a new exercise program.
            </p>
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 text-xs shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Example plan snippet
            </p>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Day 1 – Full body</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Goblet squat – 3 sets of 8–12 reps, 90s rest</li>
                <li>Dumbbell bench press – 3 sets of 8–12 reps, 90s rest</li>
                <li>Lat pulldown or assisted pull-up – 3 sets of 8–10 reps</li>
                <li>Plank – 3 sets of 20–30s hold</li>
              </ul>
            </div>
          <div className="space-y-1 rounded-md bg-background/70 p-3">
            <p className="text-[11px] font-semibold text-foreground">
              Safety first
            </p>
            <p className="text-[11px] text-muted-foreground">
                Begin with 5–10 minutes of light cardio and easy mobility. Stop
                any exercise that causes sharp pain, and ask a professional if
                you&apos;re unsure what&apos;s safe for you.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Daily Motivation
            </h2>
            <p className="text-sm text-muted-foreground">
              Stay inspired on your fitness journey with these powerful reminders.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              { quote: "The only bad workout is the one that didn't happen.", icon: "💪" },
              { quote: "Your body can stand almost anything. It's your mind you have to convince.", icon: "🧠" },
              { quote: "Discipline is choosing between what you want now and what you want most.", icon: "🎯" },
              { quote: "Small progress is still progress. Keep showing up.", icon: "📈" },
              { quote: "The pain you feel today will be the strength you feel tomorrow.", icon: "🔥" },
              { quote: "Fitness is not about being better than someone else. It's about being better than you used to be.", icon: "⭐" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-xs text-muted-foreground italic leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-transparent to-primary/10 p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              🏋️ Remember: Every rep counts. Every step matters. Start where you are.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            How it works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Profile", text: "Share your goal, experience, schedule, equipment, and injuries." },
              { title: "AI Magic", text: "Groq-powered FitGenie builds a safe, structured plan with clear bullets." },
              { title: "Get Plan", text: "Download, copy, or save your plan. Use it at the gym immediately." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-2">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
