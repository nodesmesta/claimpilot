import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/app/lib/supabase";

export async function POST(req: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Clear all user data
  const tables = ["claims", "assets", "messages"] as const;
  const results: Record<string, string> = {};

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    results[table] = error ? `error: ${error.message}` : "cleared";
  }

  return NextResponse.json({ success: true, results });
}
