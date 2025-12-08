import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/", request.url));
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

  await supabase.auth.exchangeCodeForSession(code);

  const response = NextResponse.redirect(new URL("/", request.url));
  cookieStore.forEach(({ value, options }, name) => {
    response.cookies.set({ name, value, ...options });
  });

  return response;
}
