import { NextRequest } from "next/server";

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY!;
const MODEL = "deepseek-ai/DeepSeek-V4-Pro";

const SYSTEM_PROMPT = `You are ClaimPilot AI Assistant — an expert in insurance claims investigation. You help users understand:
- How the multi-agent investigation process works
- Claim statuses and what they mean
- Risk levels (LOW, MEDIUM, HIGH) and how they're determined
- What to expect during fraud investigations
- Policy and coverage questions

Be concise, helpful, and professional. Use markdown formatting for clarity.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: true,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return new Response(JSON.stringify({ error }), { status: res.status });
  }

  // Stream the response
  return new Response(res.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
