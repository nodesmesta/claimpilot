import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "ClaimPilot <noreply@claimpilot.ai>";

/**
 * POST /api/claims/[id]/notify
 * Called by Resolution Agent to send email notification to policyholder.
 * Body: { claim_id, policyholder, email, decision, settlement_amount, reasoning }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { claim_id, policyholder, email, decision, settlement_amount, reasoning } = body;

    if (!email || !claim_id) {
      return NextResponse.json({ error: "Missing email or claim_id" }, { status: 400 });
    }

    const subject = decision === "DENIED"
      ? `Claim ${claim_id} — Decision: Denied`
      : `Claim ${claim_id} — Decision: ${decision === "PARTIAL_APPROVED" ? "Partially Approved" : "Approved"}`;

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Claim Decision Notification</h2>
        <p>Dear ${policyholder},</p>
        <p>Your insurance claim <strong>${claim_id}</strong> has been reviewed and a decision has been made.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Decision</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${decision}</td></tr>
          ${settlement_amount ? `<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Settlement Amount</td><td style="padding: 8px; border: 1px solid #e2e8f0;">$${Number(settlement_amount).toLocaleString()}</td></tr>` : ""}
          <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Reasoning</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${reasoning || "See full report in your dashboard."}</td></tr>
        </table>
        ${decision !== "DENIED" ? "<p>Payment will be processed within 5 business days.</p>" : ""}
        <p>If you have questions, please contact your claims representative.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">— ClaimPilot AI Claims System</p>
      </div>
    `;

    // Send actual email via Resend
    let emailStatus = "sent";
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: emailError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: htmlBody,
        });
        if (emailError) {
          console.error("Email send error:", emailError);
          emailStatus = "failed";
        }
      } catch (e) {
        console.error("Resend error:", e);
        emailStatus = "failed";
      }
    } else {
      console.log(`[NOTIFY] Would send email to ${email}: ${subject}`);
    }

    // Record notification in DB
    await supabase.from("notifications").insert({
      claim_id,
      recipient_email: email,
      type: "decision",
      subject,
      body: htmlBody,
      status: emailStatus,
    });

    return NextResponse.json({ success: true, status: emailStatus });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
