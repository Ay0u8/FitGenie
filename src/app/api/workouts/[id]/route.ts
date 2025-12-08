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

  const cookieStore = new Map<string, { value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }>();

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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, attachCookies } = createSupabaseRouteClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Delete only if the workout belongs to the user
  const { error } = await supabase.from("workouts").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 });
  }

  return attachCookies(NextResponse.json({ success: true }));
}
