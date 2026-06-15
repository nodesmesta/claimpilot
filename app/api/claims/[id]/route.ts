import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/app/lib/supabase";

async function getUserFromRequest(req: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: room_id } = await params;

  try {
    // 1. Fetch claim details
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("*")
      .eq("user_id", user.id)
      .eq("room_id", room_id)
      .maybeSingle();

    if (claimError) throw claimError;
    if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

    // 2. Fetch associated payment (if exists)
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("claim_id", claim.claim_id)
      .maybeSingle();

    // 3. Fetch notifications (emails sent)
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("claim_id", claim.claim_id)
      .order("created_at", { ascending: false });

    // 4. Fetch associated asset details
    // Try to extract policy number from policy_type or find the policy number registered to the user
    // We can query assets where user_id = user.id and policyholder matches
    const { data: asset } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("policyholder", claim.policyholder)
      .maybeSingle();

    return NextResponse.json({
      data: {
        ...claim,
        payment: payment || null,
        notifications: notifications || [],
        asset: asset || null
      }
    });
  } catch (error: any) {
    console.error("Error fetching single claim:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
