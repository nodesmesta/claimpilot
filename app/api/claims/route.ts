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
    headers: { "Content-Type": "application/json", "X-API-Key": BAND_AGENT_API_KEY, ...options.headers },
  });
  if (!res.ok) throw new Error(`Band API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getUserFromRequest(req: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check plan limit
  const { data: profile } = await supabase.from("profiles").select("subscription_status").eq("id", user.id).single();
  if ((profile?.subscription_status || "free") === "free") {
    const { count } = await supabase.from("claims").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count || 0) >= FREE_PLAN_LIMIT) {
      return NextResponse.json({ error: `Free plan limited to ${FREE_PLAN_LIMIT} claims. Upgrade to continue.` }, { status: 403 });
    }
  }

  try {
    // Determine content type — PDF or JSON
    const contentType = req.headers.get("content-type") || "";
    let claimData: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      // PDF upload
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file || file.type !== "application/pdf") {
        return NextResponse.json({ error: "PDF file required" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const { extractTextFromPDF } = await import("@/app/lib/pdf");
      const text = await extractTextFromPDF(buffer);
      claimData = parseClaimPDF(text);
    } else {
      // JSON body (backward-compatible)
      claimData = await req.json();
    }

    // Create Band room and submit
    const roomRes = await bandFetch("/chats", { method: "POST", body: JSON.stringify({ chat: {} }) });
    const chatId = roomRes.data.id;

    await bandFetch(`/chats/${chatId}/participants`, {
      method: "POST",
      body: JSON.stringify({ participant: { participant_id: CLAIM_REVIEWER_ID } }),
    });

    const content = `@nodesemesta/reviewer investigate: ${JSON.stringify(claimData)}`;
    await bandFetch(`/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message: { content, mentions: [{ id: CLAIM_REVIEWER_ID }] } }),
    });

    // Save to Supabase
    const claimId = (claimData.claim_id as string) || `CLM-${Date.now()}`;
    const { error: dbError } = await supabase.from("claims").insert({
      user_id: user.id,
      claim_id: claimId,
      room_id: chatId,
      policyholder: claimData.policyholder || "Unknown",
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

    return NextResponse.json({ room_id: chatId, claim_id: claimId, status: "submitted", parsed: claimData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseClaimPDF(text: string): Record<string, unknown> {
  const get = (pattern: RegExp): string | null => {
    const m = text.match(pattern);
    return m ? m[1].trim() : null;
  };
  const getNum = (pattern: RegExp): number | null => {
    const v = get(pattern);
    if (!v) return null;
    const n = parseFloat(v.replace(/[,$]/g, ""));
    return isNaN(n) ? null : n;
  };

  return {
    claim_id: get(/Claim ID:\s+(CLM-[\w-]+)/i) || `CLM-${Date.now()}`,
    policyholder: get(/Policyholder:\s+([A-Z][a-z]+ [A-Z][a-z]+)/i) || get(/Name:\s+([A-Z][a-z]+ [A-Z][a-z]+)/i) || "Unknown",
    policy_type: get(/Policy:\s+(.+?)(?:\s+Incident)/i) || get(/Policy Type:\s+(.+?)(?:\s+Effective)/i),
    incident_type: get(/Incident Type:\s+(.+?)(?:\s+Incident Date|\s+Claim)/i),
    description: extractDescription(text),
    claim_amount: getNum(/Claim Amount:\s+\$?([\d,]+)/i) || getNum(/Amount:\s+\$?([\d,]+)/i),
    location: get(/Location:\s+(.+?)(?:\s+Incident|\s+Filing)/i),
    incident_date: get(/Incident Date:\s+(\d{4}-\d{2}-\d{2})/i),
    filing_date: get(/Filing Date:\s+(\d{4}-\d{2}-\d{2})/i),
    witnesses: parseInt(get(/Witnesses:\s+(\d+)/i) || "0"),
    photos_submitted: parseInt(get(/Photos Submitted:\s*(\d+)/i) || "0"),
    prior_claims_12mo: parseInt(get(/Prior Claims \(12mo\):\s*(\d+)/i) || get(/Claims \(last 12 months\):\s*(\d+)/i) || "0"),
    police_report: /Police Report:\s*Yes/i.test(text),
    medical_claim: /Medical Claim:\s*Yes/i.test(text) || /Medical/i.test(get(/medical/i) || ""),
  };
}

function extractDescription(text: string): string {
  // Look for "Incident Description" section
  const m = text.match(/Incident Description\s*\n([\s\S]*?)(?:\n[A-Z]|\n\s*\n[A-Z])/i);
  if (m) return m[1].trim().slice(0, 500);
  // Fallback: look for multiline text after "Description:"
  const m2 = text.match(/Description[:\s]*\n?([\s\S]{20,300})/i);
  if (m2) return m2[1].trim();
  return "";
}
