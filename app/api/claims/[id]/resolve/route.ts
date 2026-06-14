import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

const BAND_API_URL = process.env.BAND_API_URL || "https://app.band.ai";
const BAND_AGENT_API_KEY = process.env.BAND_AGENT_API_KEY!;
const RESOLVER_ID = process.env.RESOLVER_ID;

const AGENT_ID_TO_ROLE: Record<string, string> = {
  [process.env.CLAIM_REVIEWER_ID || ""]: "reviewer",
  [process.env.INVESTIGATOR_ID || ""]: "investigator",
  [process.env.ADJUSTER_ID || ""]: "adjuster",
  [process.env.RESOLVER_ID || ""]: "resolver",
};

function extractRecruitedAgents(messages: { sender_name: string; message_type: string }[]): string[] {
  const recruited = new Set<string>();
  for (const msg of messages) {
    if (msg.message_type === "text") {
      if (/investigator/i.test(msg.sender_name)) {
        recruited.add("investigator");
      } else if (/adjuster/i.test(msg.sender_name)) {
        recruited.add("adjuster");
      } else if (/resolver/i.test(msg.sender_name)) {
        recruited.add("resolver");
      }
    }
  }
  return Array.from(recruited);
}

async function bandFetch(path: string, options: RequestInit = {}) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
        if (res.status === 429 || res.status >= 500) {
          lastError = new Error(`Band API ${res.status}: ${text}`);
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(`Band API ${res.status}: ${text}`);
      }
      return res.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError || new Error("Band API request failed");
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
    // 1. Fetch messages from Band room (with retry)
    let contextData: any;
    let fetchError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(
        `${BAND_API_URL}/api/v1/agent/chats/${chatId}/context`,
        { headers: { "X-API-Key": BAND_AGENT_API_KEY } }
      );
      if (res.ok) {
        contextData = await res.json();
        break;
      }
      const errText = await res.text();
      if (errText.includes("deleted") || errText.includes("not found")) {
        await supabase.from("claims").update({ status: "denied", resolution_reasoning: "Band room no longer available" }).eq("room_id", chatId);
        return NextResponse.json({ resolved: false, reason: "Room deleted" });
      }
      fetchError = errText;
      if (res.status === 429 || res.status >= 500) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      break;
    }
    if (!contextData) {
      return NextResponse.json({ error: `Failed to fetch messages: ${fetchError}` }, { status: 502 });
    }
    const messages: { content: string; sender_name: string; message_type: string }[] = contextData.data || [];

    // 2. Parse decision
    const resolution = parseResolution(messages);
    if (!resolution) {
      const retryResult = await retryFailedDelivery(chatId, contextData.data || []);
      return NextResponse.json({ resolved: false, reason: retryResult || "No final decision found yet" });
    }

    // If still investigating (escalated but next agent hasn't decided), check for stalled agents
    if (resolution.status === "investigating") {
      const retryResult = await retryFailedDelivery(chatId, contextData.data || []);
      const recruitedAgents = extractRecruitedAgents(messages);
      // Update intermediate state (risk_level, verdict so far)
      await supabase.from("claims").update({
        risk_level: resolution.riskLevel,
        verdict: resolution.verdict,
        fraud_score: resolution.fraudScore,
        resolution_reasoning: resolution.reasoning,
        recruited_agents: recruitedAgents,
      }).eq("room_id", chatId);
      return NextResponse.json({ resolved: false, reason: retryResult || "Awaiting next agent response" });
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
    // At this point, resolution.status is always final (approved/partial_approved/denied)
    // because "investigating" is handled above with early return

    const recruitedAgents = extractRecruitedAgents(messages);
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
        resolved_at: new Date().toISOString(),
        recruited_agents: recruitedAgents,
      })
      .eq("room_id", chatId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 5. If not already resolved → execute resolution
    if (!alreadyResolved) {
      await executeResolution(chatId, claim.claim_id, claim.policyholder, claim.user_id, resolution);
    }

    return NextResponse.json({ resolved: true, resolution });
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

  // Get real user email - try profiles first, fallback to auth.users
  let email: string;
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single();
  if (profile?.email) {
    email = profile.email;
  } else {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    email = authUser?.user?.email || deriveEmail(policyholder);
  }

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
  // Human-readable decision
  const displayDecision = decision === "DENIED" ? "Denied"
    : decision === "PARTIAL_APPROVED" ? "Partially Approved"
    : "Approved";

  const subject = `Claim ${claimId} — Decision: ${displayDecision}`;

  const amount = resolution.settlementAmount;

  const body = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Claim Decision Notification</h2>
      <p>Dear ${policyholder},</p>
      <p>Your insurance claim <strong>${claimId}</strong> has been reviewed by our AI investigation team.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Decision</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${displayDecision}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Risk Level</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${resolution.riskLevel || "N/A"}</td></tr>
        ${amount ? `<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Settlement Amount</td><td style="padding: 8px; border: 1px solid #e2e8f0;">$${amount.toLocaleString()}</td></tr>` : ""}
      </table>
      ${decision !== "DENIED" ? `<p>Your claim has been <strong>approved</strong>${amount ? ` for <strong>$${amount.toLocaleString()}</strong>` : ""}. Payment will be processed within 5 business days via wire transfer.</p>` : "<p>If you disagree with this decision, you may file an appeal within 30 days.</p>"}
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

const MAX_RETRIES = 5;
const RETRY_BACKOFF_MS = [30_000, 60_000, 120_000, 300_000, 600_000];

/**
 * Detect stalled agents and retry. Handles two cases:
 * 1. delivery_status = "failed" → agent never received the message
 * 2. Agent was mentioned but never responded → remind them
 * 
 * Gateway can see who was mentioned and who responded. If an agent
 * was mentioned but hasn't sent a visible message, we remind them.
 */
async function retryFailedDelivery(chatId: string, rawMessages: any[]): Promise<string | null> {
  // Get claim retry state + context for retry message
  const { data: claim } = await supabase
    .from("claims")
    .select("retry_count, last_retry_at, created_at, claim_id, policyholder, claim_amount, risk_level, incident_type, description")
    .eq("room_id", chatId)
    .single();

  if (!claim) return null;

  const retryCount = claim.retry_count || 0;
  if (retryCount >= MAX_RETRIES) {
    await supabase.from("claims").update({ status: "denied", resolution_reasoning: "Agent failed to respond after max retries" }).eq("room_id", chatId);
    return "Max retries exceeded — claim marked as failed";
  }

  // Check backoff
  const backoffMs = RETRY_BACKOFF_MS[retryCount] || 600_000;
  const lastRetry = claim.last_retry_at ? new Date(claim.last_retry_at).getTime() : 0;
  const timeSinceLastAction = Date.now() - (lastRetry || new Date(claim.created_at).getTime());
  if (timeSinceLastAction < backoffMs) {
    return `Waiting for backoff (retry ${retryCount + 1}/${MAX_RETRIES})`;
  }
  // Guard against concurrent resolve calls (< 10s since last retry = skip)
  if (lastRetry && Date.now() - lastRetry < 10_000) {
    return `Retry recently sent, skipping`;
  }

  // Case 1: Explicit delivery failure
  const failedMsg = rawMessages.find((m: any) => {
    const statuses = m.metadata?.delivery_status || {};
    return Object.values(statuses).some((ds: any) => ds.status === "failed");
  });

  if (failedMsg) {
    const failedAgentId = Object.entries(failedMsg.metadata?.delivery_status || {})
      .find(([, ds]: [string, any]) => ds.status === "failed")?.[0];
    if (failedAgentId) {
      return await sendRetry(chatId, failedAgentId, retryCount, "delivery failed", claim, rawMessages);
    }
  }

  // Case 2: Agent mentioned but never responded
  const mentionedAgents = new Set<string>();
  const respondedAgents = new Set<string>();

  // Dynamically resolve Gateway ID from messages where sender_name is Gateway
  const gatewayMsg = rawMessages.find((m: any) => m.sender_name === "Gateway");
  const gatewayId = gatewayMsg?.sender_id || process.env.GATEWAY_ID || "";

  for (const msg of rawMessages) {
    const mentions: { id: string }[] = msg.metadata?.mentions || [];
    for (const m of mentions) {
      if (m.id !== gatewayId) mentionedAgents.add(m.id);
    }
    if (msg.sender_name !== "Gateway" && msg.message_type === "text") {
      respondedAgents.add(msg.sender_id);
    }
  }

  const stalledAgent = [...mentionedAgents].find(id => 
    !respondedAgents.has(id) && 
    id in AGENT_ID_TO_ROLE
  );
  if (stalledAgent) {
    return await sendRetry(chatId, stalledAgent, retryCount, "no response", claim, rawMessages);
  }

  // Case 3: Reviewer escalated but next agent was never added to room
  // (add_participant_service failed on Band platform side)
  const hasReviewerEscalation = rawMessages.some(m =>
    /reviewer/i.test(m.sender_name) && m.message_type === "text" &&
    (/ESCALATE/i.test(m.content) || /MEDIUM|HIGH/i.test(m.content))
  );
  const hasInvestigatorResponse = rawMessages.some(m =>
    /investigator/i.test(m.sender_name) && m.message_type === "text"
  );
  const hasInvestigatorVerdict = rawMessages.some(m =>
    /investigator/i.test(m.sender_name) && m.message_type === "text" &&
    /(SUSPICIOUS|LIKELY_FRAUDULENT)/i.test(m.content)
  );
  const hasAdjusterResponse = rawMessages.some(m =>
    /adjuster/i.test(m.sender_name) && m.message_type === "text"
  );

  const INVESTIGATOR_ID = process.env.INVESTIGATOR_ID;
  const ADJUSTER_ID = process.env.ADJUSTER_ID;

  if (hasReviewerEscalation && !hasInvestigatorResponse && INVESTIGATOR_ID) {
    // Investigator never joined — manually add and send claim
    try {
      await bandFetch(`/chats/${chatId}/participants`, {
        method: "POST",
        body: JSON.stringify({ participant: { participant_id: INVESTIGATOR_ID } }),
      });
    } catch { /* may already be participant */ }
    return await sendRetry(chatId, INVESTIGATOR_ID, retryCount, "agent never joined room", claim, rawMessages);
  }

  if (hasInvestigatorVerdict && !hasAdjusterResponse && ADJUSTER_ID) {
    // Adjuster never joined — manually add and send claim
    try {
      await bandFetch(`/chats/${chatId}/participants`, {
        method: "POST",
        body: JSON.stringify({ participant: { participant_id: ADJUSTER_ID } }),
      });
    } catch { /* may already be participant */ }
    return await sendRetry(chatId, ADJUSTER_ID, retryCount, "agent never joined room", claim, rawMessages);
  }

  return null;
}



function buildRetryMessage(agentId: string, claim: any, rawMessages: any[]): string {
  const role = AGENT_ID_TO_ROLE[agentId] || "agent";

  // Extract the last substantive message from other agents as context
  const lastAgentMsg = [...rawMessages]
    .filter(m => m.message_type === "text" && m.sender_name !== "Gateway")
    .pop();

  const claimContext = [
    `Claim ${claim.claim_id} | ${claim.policyholder} | $${(claim.claim_amount || 0).toLocaleString()}`,
    `Risk: ${claim.risk_level || "UNKNOWN"} | Incident: ${claim.incident_type || "N/A"}`,
    claim.description ? `Description: ${claim.description.slice(0, 200)}` : "",
  ].filter(Boolean).join("\n");

  if (role === "reviewer") {
    return [
      `@nodesemesta/reviewer You have not responded yet. Please triage this claim NOW.`,
      ``,
      claimContext,
      ``,
      `Provide your REVIEWER_REPORT with risk_level, decision (AUTO_APPROVE or ESCALATE_INVESTIGATION), and reasoning. Use send_direct_message_service and mention @nodesemesta/gateway.`,
    ].join("\n");
  }

  if (role === "investigator") {
    const reviewerReport = rawMessages.find(m => /reviewer/i.test(m.sender_name) && m.message_type === "text")?.content?.slice(0, 300) || "";
    return [
      `@nodesemesta/investigator You have not responded yet. Please analyze this claim for fraud NOW.`,
      ``,
      claimContext,
      reviewerReport ? `\nReviewer's assessment:\n${reviewerReport}` : "",
      ``,
      `Provide your INVESTIGATOR_REPORT with fraud_score (1-10) and verdict (CLEAN/SUSPICIOUS/LIKELY_FRAUDULENT). Use send_direct_message_service and mention @nodesemesta/gateway.`,
    ].join("\n");
  }

  if (role === "adjuster") {
    const investigatorReport = rawMessages.find(m => /investigator/i.test(m.sender_name) && m.message_type === "text")?.content?.slice(0, 300) || "";
    return [
      `@nodesemesta/adjuster You have not responded yet. Please issue your final decision NOW.`,
      ``,
      claimContext,
      investigatorReport ? `\nInvestigator's findings:\n${investigatorReport}` : "",
      ``,
      `Provide your ADJUSTER_DECISION with decision (APPROVED/PARTIAL_APPROVED/DENIED), settlement_amount, and reasoning. Use send_direct_message_service and mention @nodesemesta/gateway.`,
    ].join("\n");
  }

  return `You have not responded. Please review the claim above and provide your analysis/decision now.\n\n${claimContext}`;
}

async function sendRetry(chatId: string, agentId: string, retryCount: number, reason: string, claim: any, rawMessages: any[]): Promise<string> {
  try {
    const content = buildRetryMessage(agentId, claim, rawMessages);

    await bandFetch(`/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        message: { content, mentions: [{ id: agentId }] },
      }),
    });

    await supabase.from("claims").update({
      retry_count: retryCount + 1,
      last_retry_at: new Date().toISOString(),
    }).eq("room_id", chatId);

    return `Retry ${retryCount + 1}/${MAX_RETRIES} sent to ${AGENT_ID_TO_ROLE[agentId] || agentId} (reason: ${reason})`;
  } catch (err: any) {
    if (err.message?.includes("deleted") || err.message?.includes("not found")) {
      await supabase.from("claims").update({
        status: "denied",
        resolution_reasoning: "Band room no longer available",
      }).eq("room_id", chatId);
      return "Room deleted — claim marked as failed";
    }
    return `Retry failed: ${err.message}`;
  }
}

function parseResolution(messages: { content: string; sender_name: string; message_type: string }[]): Resolution | null {
  const textMsgs = messages.filter(m => m.message_type === "text");

  let riskLevel: string | null = null;
  let reviewerSettlement: number | null = null;

  // Parse Reviewer report
  for (const msg of textMsgs) {
    if (/reviewer/i.test(msg.sender_name) && msg.content.includes("REVIEWER_REPORT")) {
      const rl = msg.content.match(/risk_level:\s*(LOW|MEDIUM|HIGH)/i);
      if (rl) riskLevel = rl[1].toUpperCase();
      const decision = msg.content.match(/decision:\s*(AUTO_APPROVE|ESCALATE_INVESTIGATION)/i);
      if (decision && decision[1] === "AUTO_APPROVE") {
        reviewerSettlement = extractAmount(msg.content);
      }
    }
    // Fallback: old format
    if (!riskLevel && /reviewer/i.test(msg.sender_name)) {
      const rl = msg.content.match(/(?:risk|classification|level)[:\s]*(LOW|MEDIUM|HIGH)/i);
      if (rl) riskLevel = rl[1].toUpperCase();
    }
  }

  // Priority 1: Adjuster Decision (structured ADJUSTER_DECISION)
  for (let i = textMsgs.length - 1; i >= 0; i--) {
    const msg = textMsgs[i];
    if (/adjuster/i.test(msg.sender_name) && msg.content.includes("ADJUSTER_DECISION")) {
      return parseAdjusterDecision(msg.content, riskLevel);
    }
    // Fallback: old format
    if (/adjuster/i.test(msg.sender_name) && msg.content.includes("Decision")) {
      return parseAdjusterDecision(msg.content, riskLevel);
    }
  }

  // Priority 2: Investigator verdict (structured INVESTIGATOR_REPORT)
  for (let i = textMsgs.length - 1; i >= 0; i--) {
    const msg = textMsgs[i];
    if (/investigator/i.test(msg.sender_name)) {
      let verdict: string | null = null;
      let fraudScore: number | null = null;

      if (msg.content.includes("INVESTIGATOR_REPORT")) {
        const vm = msg.content.match(/verdict:\s*(CLEAN|SUSPICIOUS|LIKELY_FRAUDULENT)/i);
        if (vm) verdict = vm[1].toUpperCase();
        const fs = msg.content.match(/fraud_score:\s*(\d+)/i);
        if (fs) fraudScore = parseInt(fs[1]);
      } else {
        // Fallback
        const vm = msg.content.match(/(CLEAN|SUSPICIOUS|LIKELY_FRAUDULENT)/i);
        if (vm) verdict = vm[1].toUpperCase();
      }

      if (verdict) {
        if (verdict === "CLEAN") {
          return {
            status: "approved",
            riskLevel,
            verdict: "CLEAN",
            settlementAmount: extractAmount(msg.content) || reviewerSettlement,
            fraudScore: fraudScore || 1,
            reasoning: msg.content.slice(0, 500),
          };
        }
        // SUSPICIOUS or LIKELY_FRAUDULENT — check if adjuster already decided after this
        for (let j = i + 1; j < textMsgs.length; j++) {
          if (/adjuster/i.test(textMsgs[j].sender_name) && 
              (textMsgs[j].content.includes("ADJUSTER_DECISION") || textMsgs[j].content.includes("Decision"))) {
            return parseAdjusterDecision(textMsgs[j].content, riskLevel);
          }
        }
        // Adjuster hasn't decided yet
        return { status: "investigating", riskLevel, verdict, settlementAmount: null, fraudScore, reasoning: msg.content.slice(0, 500) };
      }
    }
  }

  // Priority 3: Reviewer auto-approve (structured or fallback)
  for (let i = textMsgs.length - 1; i >= 0; i--) {
    const msg = textMsgs[i];
    if (/reviewer/i.test(msg.sender_name)) {
      // Structured: decision: AUTO_APPROVE
      if (msg.content.match(/decision:\s*AUTO_APPROVE/i)) {
        return {
          status: "approved",
          riskLevel: riskLevel || "LOW",
          verdict: "AUTO_APPROVED",
          settlementAmount: extractAmount(msg.content),
          fraudScore: 0,
          reasoning: msg.content.slice(0, 500),
        };
      }
      // Fallback: word "approved" in reviewer message
      if (msg.content.match(/\bapprov(e|ed|al)\b/i) && !msg.content.match(/ESCALATE/i)) {
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

  // Structured format: decision: APPROVED|PARTIAL_APPROVED|DENIED
  const decisionMatch = content.match(/decision[:\s]*(APPROVED|PARTIAL_APPROVED|DENIED)/i);
  if (decisionMatch) {
    const d = decisionMatch[1].toUpperCase();
    if (d === "APPROVED") status = "approved";
    else if (d === "PARTIAL_APPROVED") status = "partial_approved";
    else if (d === "DENIED") status = "denied";
  }

  // fraud_risk_score from structured format
  const fraudMatch = content.match(/fraud_risk_score[:\s]*(\d+)/i)
    || content.match(/fraud_score[:\s]*(\d+)/i)
    || content.match(/Fraud Risk Score[:\s]*(\d+)/i);
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
  // Structured format: settlement_amount: 12500 or settlement_amount: $12,500
  const structured = text.match(/settlement_amount[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
  if (structured) return parseFloat(structured[1].replace(/,/g, ""));
  // Dollar sign format: $12,500
  const dollar = text.match(/\$[\s]*([\d,]+(?:\.\d{2})?)/);
  if (dollar) return parseFloat(dollar[1].replace(/,/g, ""));
  // Settlement Amount: 12500
  const label = text.match(/Settlement(?:\s+Amount)?[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
  if (label) return parseFloat(label[1].replace(/,/g, ""));
  // claim_amount: 25000
  const claim = text.match(/claim_amount[:\s]*\$?([\d,]+(?:\.\d{2})?)/i);
  if (claim) return parseFloat(claim[1].replace(/,/g, ""));
  return null;
}
