import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/app/lib/supabase";
import { 
  bandFetch, 
  createBandRoom, 
  addParticipantToRoom, 
  sendMessageToRoom,
  validateBandEnvironment 
} from "@/app/lib/band";

const CLAIM_REVIEWER_ID = process.env.CLAIM_REVIEWER_ID!;
const INVESTIGATOR_ID = process.env.INVESTIGATOR_ID!;
const ADJUSTER_ID = process.env.ADJUSTER_ID!;
const FREE_PLAN_LIMIT = 10;

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
    // Validate Band environment before proceeding
    const isBandReady = await validateBandEnvironment();
    if (!isBandReady) {
      return NextResponse.json({ 
        error: "Band agent configuration incomplete. Please check environment variables." 
      }, { status: 500 });
    }

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

    // Validate: claim must be for user's own registered asset
    const policyNumber = (claimData.policy_type as string)?.match(/POL-[\w-]+/)?.[0]
      || (claimData.policy_number as string);
    if (!policyNumber) {
      return NextResponse.json({ 
        error: "No policy number found in claim. Ensure your claim PDF contains a valid policy reference." 
      }, { status: 400 });
    }
    const { data: asset } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("policy_number", policyNumber)
      .single();
    if (!asset) {
      return NextResponse.json({ 
        error: `Policy ${policyNumber} is not registered in your assets. Please register your asset first.` 
      }, { status: 403 });
    }

    // Create Band room and submit
    const chatId = await createBandRoom();

    // Pre-triage: determine risk level from claim data
    const riskLevel = triageClaim(claimData);

    // Add participants based on risk level
    try {
      await addParticipantToRoom(chatId, CLAIM_REVIEWER_ID);

      if (riskLevel !== "LOW") {
        await addParticipantToRoom(chatId, INVESTIGATOR_ID);
      }

      if (riskLevel === "HIGH") {
        await addParticipantToRoom(chatId, ADJUSTER_ID);
      }
    } catch (error) {
      console.error("Error adding participants:", error);
      return NextResponse.json({ 
        error: "Failed to setup agent participants. Please try again." 
      }, { status: 500 });
    }

    // Send claim with clear instructions to all participants
    const claimJson = JSON.stringify(claimData);
    const assetContext = `\n\nRegistered Asset:\n- Policy: ${asset.policy_number} (${asset.policy_type})\n- Policyholder: ${asset.policyholder}\n- Vehicle: ${asset.vehicle_description || "N/A"}\n- Estimated Value: $${(asset.estimated_value || 0).toLocaleString()}\n- Deductible: $${(asset.deductible || 0).toLocaleString()}\n- Payment Method: ${asset.payment_method || "N/A"}`;
    let instructions: string;
    if (riskLevel === "LOW") {
      instructions = `@nodesemesta/reviewer This is a LOW risk claim. Review and auto-approve if appropriate.\n\nClaim data: ${claimJson}${assetContext}`;
    } else if (riskLevel === "HIGH") {
      instructions = `@nodesemesta/reviewer @nodesemesta/investigator @nodesemesta/adjuster\n\nHIGH RISK CLAIM — Full investigation required.\n\n1. @nodesemesta/reviewer: Extract facts and classify risk factors.\n2. @nodesemesta/investigator: Analyze fraud patterns and provide verdict (CLEAN/SUSPICIOUS/LIKELY_FRAUDULENT).\n3. @nodesemesta/adjuster: After investigator verdict, issue final decision (APPROVED/PARTIAL_APPROVED/DENIED) with settlement amount.\n\nClaim data: ${claimJson}${assetContext}`;
    } else {
      instructions = `@nodesemesta/reviewer @nodesemesta/investigator\n\nMEDIUM RISK CLAIM — Investigation needed.\n\n1. @nodesemesta/reviewer: Extract facts and classify risk factors.\n2. @nodesemesta/investigator: Analyze fraud patterns and provide verdict (CLEAN/SUSPICIOUS/LIKELY_FRAUDULENT). If SUSPICIOUS, recommend adjuster review.\n\nClaim data: ${claimJson}${assetContext}`;
    }

    const mentions = [{ id: CLAIM_REVIEWER_ID }];
    if (riskLevel !== "LOW") mentions.push({ id: INVESTIGATOR_ID });
    if (riskLevel === "HIGH") mentions.push({ id: ADJUSTER_ID });

    await sendMessageToRoom(chatId, instructions, mentions);

    // Save to Supabase
    const baseClaimId = (claimData.claim_id as string) || `CLM-${Date.now()}`;
    // Ensure unique claim_id by appending short timestamp suffix
    const claimId = `${baseClaimId}-${Date.now().toString(36).slice(-4)}`;
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
      risk_level: riskLevel,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json({ error: "Failed to save claim to database" }, { status: 500 });
    }

    // Fire-and-forget: auto-resolve after agent responds
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pilot.nodesemesta.com';
    scheduleResolve(appUrl, chatId);

    return NextResponse.json({ room_id: chatId, claim_id: claimId, status: "submitted", parsed: claimData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function scheduleResolve(appUrl: string, chatId: string) {
  // Try resolve at 8s, 15s, 30s, 60s after submission
  const delays = [8000, 15000, 30000, 60000];
  for (const delay of delays) {
    setTimeout(() => {
      fetch(`${appUrl}/api/claims/${chatId}/resolve`, { method: "POST" }).catch(() => {});
    }, delay);
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

function triageClaim(data: Record<string, unknown>): "LOW" | "MEDIUM" | "HIGH" {
  let flags = 0;
  const amount = Number(data.claim_amount) || 0;
  if (amount > 15000) flags++;
  if (!data.police_report) flags++;
  if (Number(data.witnesses) === 0) flags++;
  if (Number(data.prior_claims_12mo) > 2) flags++;
  if (data.medical_claim) flags++;

  if (flags >= 3 || amount > 15000) return "HIGH";
  if (flags >= 1 || amount > 5000) return "MEDIUM";
  return "LOW";
}
