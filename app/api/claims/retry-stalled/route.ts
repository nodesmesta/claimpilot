import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

/**
 * GET /api/claims/retry-stalled
 * 
 * Server-side cron that finds all "investigating" claims older than 60s
 * and triggers /resolve on each to handle retry logic.
 * 
 * Can be called by:
 * - Vercel Cron (vercel.json)
 * - External cron service
 * - Frontend setInterval as fallback
 */
export async function GET(req: NextRequest) {
  // Optional: protect with a secret for production cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all stalled claims: investigating, created > 60s ago
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: stalledClaims, error } = await supabase
    .from("claims")
    .select("room_id, retry_count, last_retry_at")
    .eq("status", "investigating")
    .lt("created_at", cutoff)
    .lt("retry_count", 5)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error || !stalledClaims?.length) {
    return NextResponse.json({ processed: 0, stalled: 0 });
  }

  // Trigger resolve on each — resolve handles retry internally
  const baseUrl = req.nextUrl.origin;
  const results: { room_id: string; result: string }[] = [];

  for (const claim of stalledClaims) {
    try {
      const res = await fetch(`${baseUrl}/api/claims/${claim.room_id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      results.push({ room_id: claim.room_id, result: data.resolved ? "resolved" : (data.reason || "pending") });
    } catch (err: any) {
      results.push({ room_id: claim.room_id, result: `error: ${err.message}` });
    }
  }

  return NextResponse.json({ processed: results.length, stalled: stalledClaims.length, results });
}
