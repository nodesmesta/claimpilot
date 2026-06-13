import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

const BAND_API_URL = process.env.BAND_API_URL || "https://app.band.ai";
const BAND_AGENT_API_KEY = process.env.BAND_AGENT_API_KEY!;
const CLAIM_REVIEWER_ID = process.env.CLAIM_REVIEWER_ID!;

async function bandFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BAND_API_URL}/api/v1/agent${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BAND_AGENT_API_KEY,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Band API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const claimData = await req.json();

    // 1. Create chat room on Band
    const roomRes = await bandFetch("/chats", {
      method: "POST",
      body: JSON.stringify({ chat: {} }),
    });
    const chatId = roomRes.data.id;

    // 2. Add Reviewer as participant
    await bandFetch(`/chats/${chatId}/participants`, {
      method: "POST",
      body: JSON.stringify({
        participant: { participant_id: CLAIM_REVIEWER_ID },
      }),
    });

    // 3. Send claim data mentioning Reviewer
    const content = `@nodesemesta/reviewer investigate: ${JSON.stringify(claimData)}`;
    await bandFetch(`/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        message: { content, mentions: [{ id: CLAIM_REVIEWER_ID }] },
      }),
    });

    // 4. Save to Supabase
    const claimId = claimData.claim_id || `CLM-${Date.now()}`;
    const { error: dbError } = await supabase.from("claims").insert({
      claim_id: claimId,
      room_id: chatId,
      policyholder: claimData.policyholder,
      policy_type: claimData.policy_type,
      incident_type: claimData.incident_type,
      description: claimData.description,
      claim_amount: claimData.claim_amount,
      location: claimData.location,
      incident_date: claimData.incident_date,
      filing_date: claimData.filing_date || new Date().toISOString().split("T")[0],
      witnesses: claimData.witnesses || 0,
      photos_submitted: claimData.photos_submitted || 0,
      prior_claims_12mo: claimData.prior_claims_12mo || 0,
      police_report: claimData.police_report || false,
      medical_claim: claimData.medical_claim || false,
      status: "investigating",
      risk_level: null,
    });

    if (dbError) console.error("Supabase insert error:", dbError);

    return NextResponse.json({
      room_id: chatId,
      claim_id: claimId,
      status: "submitted",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error submitting claim:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
