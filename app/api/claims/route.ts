import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/app/lib/supabase";

const BAND_API_URL = process.env.BAND_API_URL || "https://app.band.ai";
const BAND_AGENT_API_KEY = process.env.BAND_AGENT_API_KEY!;
const CLAIM_REVIEWER_ID = process.env.CLAIM_REVIEWER_ID!;

const FREE_PLAN_LIMIT = 10;

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

async function getUserFromRequest(req: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("claims")
      .select("*")
      .eq("user_id", user.id)
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
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const plan = profile?.subscription_status || "free";

    if (plan === "free") {
      const { count } = await supabase
        .from("claims")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count || 0) >= FREE_PLAN_LIMIT) {
        return NextResponse.json(
          { error: `Free plan limited to ${FREE_PLAN_LIMIT} claims. Upgrade to continue.` },
          { status: 403 }
        );
      }
    }

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

    // 4. Save to Supabase with user_id
    const claimId = claimData.claim_id || `CLM-${Date.now()}`;
    const { error: dbError } = await supabase.from("claims").insert({
      user_id: user.id,
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
