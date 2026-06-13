import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

/**
 * POST /api/claims/[id]/payment
 * Called by Resolution Agent to record payment for approved claims.
 * Body: { claim_id, amount, policyholder, method }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { claim_id, amount, policyholder, method } = body;

    if (!claim_id || !amount) {
      return NextResponse.json({ error: "Missing claim_id or amount" }, { status: 400 });
    }

    // Record payment
    const { error } = await supabase.from("payments").insert({
      claim_id,
      amount,
      policyholder: policyholder || "Unknown",
      method: method || "wire_transfer",
      status: "processed",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update claim with settlement amount
    await supabase
      .from("claims")
      .update({ settlement_amount: amount })
      .eq("claim_id", claim_id);

    return NextResponse.json({ success: true, amount, method: method || "wire_transfer" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
