import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

const BAND_API_URL = process.env.BAND_API_URL || "https://app.band.ai";
const BAND_AGENT_API_KEY = process.env.BAND_AGENT_API_KEY!;
const RESOLVER_ID = process.env.RESOLVER_ID;

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

/**
 * POST /api/claims/[id]/resolve
 * 
 * Flow:
 * 1. Fetch messages from Band room
 * 2. Parse agent decisions (Reviewer/Investigator/Adjuster)
 * 3. Update claim in DB
 * 4. If final decision detected:
 *    a. Recruit Resolution Agent → posts confirmation in room
 *    b. Backend directly executes: send email + record payment
 * 5. Prevent double-trigger via resolved_at check
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;

  try {
    // 1. Fetch messages from Band room
    const res = await fetch(
      `${BAND_API_URL}/api/v1/agent/chats/${chatId}/context`,
      { headers: { "X-API-Key": BAND_AGENT_API_KEY } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 502 });
    }
    const json = await res.json();
    const messages: { content: string; sender_name: string; message_type: string }[] = json.data || [];

    // 2. Parse decision
    const resolution = parseResolution(messages);
    if (!resolution) {
      return NextResponse.json({ resolved: false, reason: "No final decision found yet" });
    }

    // 3. Get claim and check if already resolved
    const { data: claim } = await supabase
      .from("claims")
      .select("claim_id, policyholder, resolved_at, user_id")
      .eq("room_id", chatId)
      .single();

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const alreadyResolved = claim.resolved_at !== null;
    const isFinalDecision = resolution.status !== "investigating";

    // 4. Update claim in DB
    const { error: updateError } = await supabase
      .from("claims")
      .update({
        status: resolution.status,
        risk_level: resolution.riskLevel,
        verdict: resolution.verdict,
        settlement_amount: resolution.settlementAmount,
        fraud_score: resolution.fraudScore,
        resolution_reasoning: resolution.reasoning,
        resolved_at: isFinalDecision ? new Date().toISOString() : null,
      })
      .eq("room_id", chatId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 5. If final decision AND not already resolved → execute resolution
    if (isFinalDecision && !alreadyResolved) {
      await executeResolution(chatId, claim.claim_id, claim.policyholder, claim.user_id, resolution);
    }

    return NextResponse.json({ resolved: isFinalDecision, resolution });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Execute full resolution:
 * 1. Recruit Resolution Agent into room (for audit trail & confirmation message)
 * 2. Send email notification
 * 3. Record payment (if applicable)
 */
async function executeResolution(
  chatId: string,
  claimId: string,
  policyholder: string,
  userId: string,
  resolution: Resolution
) {
  const decision = resolution.verdict || resolution.status.toUpperCase();

  // Get real user email
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single();
  const email = profile?.email || deriveEmail(policyholder);

  // 1. Recruit Resolution Agent and instruct to post confirmation
  if (RESOLVER_ID) {
    try {
      await bandFetch(`/chats/${chatId}/participants`, {
        method: "POST",
        body: JSON.stringify({ participant: { participant_id: RESOLVER_ID } }),
      });

      // Send instruction to Resolver - it will post the confirmation in room
      const resolveMsg = [
        `@nodesemesta/resolver Execute resolution for claim ${claimId}:`,
        `- Decision: ${decision}`,
        `- Policyholder: ${policyholder}`,
        `- Settlement: ${resolution.settlementAmount ? `$${resolution.settlementAmount.toLocaleString()}` : "N/A"}`,
        `- Email notification: Sending to ${email}`,
        `- Payment: ${decision !== "DENIED" && resolution.settlementAmount ? "Processing wire transfer" : "N/A (denied)"}`,
        ``,
        `Please confirm all resolution steps are complete.`,
      ].join("\n");

      await bandFetch(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          message: { content: resolveMsg, mentions: [{ id: RESOLVER_ID }] },
        }),
      });
    } catch (err) {
      console.error("Failed to recruit resolver:", err);
    }
  }

  // 2. Send email notification
  await sendNotification(claimId, policyholder, email, decision, resolution);

  // 3. Record payment if applicable
  if (decision !== "DENIED" && resolution.settlementAmount && resolution.settlementAmount > 0) {
    await recordPayment(claimId, policyholder, resolution.settlementAmount);
  }
}

async function sendNotification(
  claimId: string,
  policyholder: string,
  email: string,
  decision: string,
  resolution: Resolution
) {
  const subject = decision === "DENIED"
    ? `Claim ${claimId} — Decision: Denied`
    : `Claim ${claimId} — Decision: ${decision === "PARTIAL_APPROVED" ? "Partially Approved" : "Approved"}`;

  const body = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Claim Decision Notification</h2>
      <p>Dear ${policyholder},</p>
      <p>Your insurance claim <strong>${claimId}</strong> has been reviewed.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Decision</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${decision}</td></tr>
        ${resolution.settlementAmount ? `<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Settlement</td><td style="padding: 8px; border: 1px solid #e2e8f0;">$${resolution.settlementAmount.toLocaleString()}</td></tr>` : ""}
      </table>
      ${decision !== "DENIED" ? "<p>Payment will be processed within 5 business days via wire transfer.</p>" : "<p>If you disagree with this decision, you may file an appeal within 30 days.</p>"}
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">— ClaimPilot AI Claims Investigation</p>
    </div>`;

  // Record in DB
  await supabase.from("notifications").insert({
    claim_id: claimId,
    recipient_email: email,
    type: "decision",
    subject,
    body,
    status: process.env.RESEND_API_KEY ? "pending" : "sent",
  });

  // Send actual email if Resend configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.NOTIFICATION_FROM_EMAIL || "ClaimPilot <noreply@nodesemesta.com>",
        to: email,
        subject,
        html: body,
      });
      if (error) {
        await supabase.from("notifications").update({ status: "failed" }).eq("claim_id", claimId).eq("type", "decision");
      } else {
        await supabase.from("notifications").update({ status: "sent" }).eq("claim_id", claimId).eq("type", "decision");
      }
    } catch (e) {
      console.error("Email send failed:", e);
    }
  }
}

async function recordPayment(claimId: string, policyholder: string, amount: number) {
  await supabase.from("payments").insert({
    claim_id: claimId,
    amount,
    policyholder,
    method: "wire_transfer",
    status: "processed",
  });
}

function deriveEmail(policyholder: string): string {
  // In production, this would come from the policy database
  return `${policyholder.toLowerCase().replace(/\s+/g, '.')}@email.com`;
}

// --- Parsing logic ---

interface Resolution {
  status: "approved" | "partial_approved" | "denied" | "investigating";
  riskLevel: string | null;
  verdict: string | null;
  settlementAmount: number | null;
  fraudScore: number | null;
  reasoning: string | null;
}

function parseResolution(messages: { content: string; sender_name: string; message_type: string }[]): Resolution | null {
  const textMsgs = messages.filter(m => m.message_type === "text");

  let riskLevel: string | null = null;
  for (const msg of textMsgs) {
    if (msg.sender_name === "Claim Reviewer" || msg.sender_name === "Reviewer") {
      const riskMatch = msg.content.match(/(?:risk|classification|level)[:\s]*(LOW|MEDIUM|HIGH)/i);
      if (riskMatch) riskLevel = riskMatch[1].toUpperCase();
    }
  }

  // Priority 1: Adjuster Decision Report
  for (let i = textMsgs.length - 1; i >= 0; i--) {
    const msg = textMsgs[i];
    if (msg.sender_name === "Senior Adjuster" && msg.content.includes("Decision")) {
      return parseAdjusterDecision(msg.content, riskLevel);
    }
  }

  // Priority 2: Investigator verdict
  for (let i = textMsgs.length - 1; i >= 0; i--) {
    const msg = textMsgs[i];
    if (msg.sender_name === "Fraud Investigator") {
      const verdictMatch = msg.content.match(/(CLEAN|SUSPICIOUS|LIKELY_FRAUDULENT)/i);
      if (verdictMatch) {
        const v = verdictMatch[1].toUpperCase();
        return {
          status: v === "CLEAN" ? "approved" : "investigating",
          riskLevel,
          verdict: v,
          settlementAmount: v === "CLEAN" ? extractAmount(msg.content) : null,
          fraudScore: v === "CLEAN" ? 1 : null,
          reasoning: msg.content.slice(0, 500),
        };
      }
    }
  }

  // Priority 3: Reviewer auto-approve (with or without explicit LOW risk)
  for (let i = textMsgs.length - 1; i >= 0; i--) {
    const msg = textMsgs[i];
    if (msg.sender_name === "Claim Reviewer" || msg.sender_name === "Reviewer") {
      const approveMatch = msg.content.match(/\bapprov(e|ed|al)\b/i);
      if (approveMatch) {
        return {
          status: "approved",
          riskLevel: riskLevel || "LOW",
          verdict: "AUTO_APPROVED",
          settlementAmount: extractAmount(msg.content),
          fraudScore: 0,
          reasoning: msg.content.slice(0, 500),
        };
      }
    }
  }

  if (riskLevel) {
    return { status: "investigating", riskLevel, verdict: null, settlementAmount: null, fraudScore: null, reasoning: null };
  }
  return null;
}

function parseAdjusterDecision(content: string, riskLevel: string | null): Resolution {
  let status: Resolution["status"] = "investigating";
  const decisionMatch = content.match(/Decision[:\s]*(APPROVED|PARTIAL_APPROVED|DENIED)/i);
  if (decisionMatch) {
    const d = decisionMatch[1].toUpperCase();
    if (d === "APPROVED") status = "approved";
    else if (d === "PARTIAL_APPROVED") status = "partial_approved";
    else if (d === "DENIED") status = "denied";
  }

  const fraudMatch = content.match(/Fraud Risk Score[:\s]*(\d+)/i);
  const fraudScore = fraudMatch ? parseInt(fraudMatch[1]) : null;

  return {
    status,
    riskLevel,
    verdict: decisionMatch ? decisionMatch[1].toUpperCase() : null,
    settlementAmount: extractAmount(content),
    fraudScore,
    reasoning: content.slice(0, 500),
  };
}

function extractAmount(text: string): number | null {
  const match = text.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
  if (match) return parseFloat(match[1].replace(/,/g, ""));
  const numMatch = text.match(/Settlement(?:\s+Amount)?[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
  if (numMatch) return parseFloat(numMatch[1].replace(/,/g, ""));
  return null;
}
