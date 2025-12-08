import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseRouteClient(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = new Map<
    string,
    { value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }
  >();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        cookieStore.set(name, { value, options });
      },
      remove(name: string, options) {
        cookieStore.set(name, { value: "", options });
      },
    },
  });

  const attachCookies = (response: NextResponse) => {
    cookieStore.forEach(({ value, options }, name) => {
      response.cookies.set({ name, value, ...options });
    });
    return response;
  };

  return { supabase, attachCookies };
}

export async function GET(request: NextRequest) {
  const { supabase, attachCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load workouts" },
      { status: 500 }
    );
  }

  return attachCookies(NextResponse.json({ workouts: data }));
}

export async function POST(request: NextRequest) {
  const { supabase, attachCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, planMarkdown, planMeta } = body ?? {};

  if (!title || !planMarkdown) {
    return NextResponse.json(
      { error: "Missing plan data" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    title,
    plan_markdown: planMarkdown,
    plan_meta: planMeta ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to save workout" },
      { status: 500 }
    );
  }

  return attachCookies(NextResponse.json({ success: true }));
}
