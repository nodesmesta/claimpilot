import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const claimData = await req.json();

    // 1. Create chat room
    const roomRes = await bandFetch("/chats", {
      method: "POST",
      body: JSON.stringify({ chat: {} }),
    });
    const chatId = roomRes.data.id;

    // 2. Add platform agent (Reviewer) as participant
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
        message: {
          content,
          mentions: [{ id: CLAIM_REVIEWER_ID }],
        },
      }),
    });

    return NextResponse.json({
      room_id: chatId,
      claim_id: claimData.claim_id || `CLM-${Date.now()}`,
      status: "submitted",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error submitting claim:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
