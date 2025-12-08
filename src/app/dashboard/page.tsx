import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/components/dashboard/copy-button";
import { DeleteButton } from "@/components/dashboard/delete-button";
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
                <div className="flex items-center gap-2">
                  <CopyButton content={workout.plan_markdown} />
                  <DeleteButton workoutId={workout.id} />
                </div>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-border/40 bg-card/70 p-4 text-sm">
                <div className="markdown-content space-y-4 text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_li]:text-foreground [&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:border-border [&_hr]:my-4">
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
