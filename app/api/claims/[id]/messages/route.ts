import { NextRequest, NextResponse } from "next/server";
import { getBandEnv } from "@/app/lib/env";

const { BAND_API_URL, BAND_AGENT_API_KEY } = getBandEnv();

async function bandFetchWithRetry(path: string, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${BAND_API_URL}${path}`, {
        headers: { "X-API-Key": BAND_AGENT_API_KEY },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }

      const text = await res.text();
      throw new Error(`Band API ${res.status}: ${text}`);
    } catch (error: any) {
      if (attempt === retries) throw error;
      if (error.name === 'AbortError') {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`Band API request failed after ${retries + 1} attempts`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatId } = await params;

    // Fetch both endpoints and merge — /context has messages mentioning us,
    // /messages has messages sent to the room that we received
    const [contextData, messagesData] = await Promise.all([
      bandFetchWithRetry(`/api/v1/agent/chats/${chatId}/context`).catch(() => ({ data: [] })),
      bandFetchWithRetry(`/api/v1/agent/chats/${chatId}/messages`).catch(() => ({ data: [] })),
    ]);

    const contextMsgs: any[] = contextData.data || [];
    const receivedMsgs: any[] = messagesData.data || [];

    // Merge and deduplicate by id
    const seen = new Set<string>();
    const all: any[] = [];
    for (const msg of [...contextMsgs, ...receivedMsgs]) {
      if (!seen.has(msg.id)) {
        seen.add(msg.id);
        all.push(msg);
      }
    }

    // Sort by time
    all.sort((a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime());

    return NextResponse.json({
      data: all,
      meta: { total_count: all.length, sources: { context: contextMsgs.length, messages: receivedMsgs.length } }
    });
  } catch (error: any) {
    console.error(`Error fetching messages:`, error.message);
    return NextResponse.json({ 
      data: [],
      error: error.message,
      meta: { error: true, timestamp: new Date().toISOString() }
    }, { status: 200 });
  }
}