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
    const searchParams = req.nextUrl.searchParams;
    const since = searchParams.get('since');

    let path = `/api/v1/agent/chats/${chatId}/context`;
    if (since) {
      path += `?since=${encodeURIComponent(since)}`;
    }

    const data = await bandFetchWithRetry(path);
    
    // Add fallback for empty responses
    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json({ 
        data: [],
        meta: { fallback: true, timestamp: new Date().toISOString() }
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error fetching messages for chat ${(await params).id}:`, error.message);
    
    // Return empty response instead of error for frontend
    return NextResponse.json({ 
      data: [],
      error: error.message,
      meta: { error: true, timestamp: new Date().toISOString() }
    }, { status: 200 }); // Return 200 with error flag instead of 500
  }
}