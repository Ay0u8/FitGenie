import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/components/dashboard/copy-button";
import { supabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await supabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Saved workout plans
        </h1>
        <p className="text-sm text-muted-foreground">
          Plans saved from the FitGenie planner appear here. Click a plan to copy
          the markdown or revisit details.
        </p>
      </div>
      <div className="grid gap-4">
        {workouts && workouts.length > 0 ? (
          workouts.map((workout) => (
            <article
              key={workout.id}
              className="rounded-xl border border-border/70 bg-card/80 p-4 shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{workout.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(workout.created_at).toLocaleDateString()}
                  </p>
                </div>
                <CopyButton content={workout.plan_markdown} />
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-border/40 bg-card/70 p-4 text-sm">
                <div className="prose prose-sm prose-invert max-w-none [&_.list-disc]:pl-5 [&_.list-disc]:space-y-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {workout.plan_markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No plans saved yet. Generate a workout using the planner and click
            “Save to FitGenie”.
          </p>
        )}
      </div>
    </div>
  );
}
