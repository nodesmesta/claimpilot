import { NextRequest, NextResponse } from "next/server";
import { addParticipantToRoom, sendMessageToRoom } from "@/app/lib/band";
import { supabase } from "@/app/lib/supabase";

const BAND_API_URL = process.env.BAND_API_URL || "https://app.band.ai";
const BAND_AGENT_API_KEY = process.env.BAND_AGENT_API_KEY!;
const INVESTIGATOR_ID = process.env.INVESTIGATOR_ID!;
const ADJUSTER_ID = process.env.ADJUSTER_ID!;

const ROLE_MAP: Record<string, string> = {
  investigator: INVESTIGATOR_ID,
  adjuster: ADJUSTER_ID,
};

/**
 * POST /api/claims/[id]/recruit
 * 
 * Scans room messages for [RECRUIT:role] tags and adds the corresponding agent.
 * Tracks which agents have already been recruited to avoid duplicates.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;

  try {
    // Fetch messages from room
    const res = await fetch(`${BAND_API_URL}/api/v1/agent/chats/${chatId}/context`, {
      headers: { "X-API-Key": BAND_AGENT_API_KEY },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 502 });
    }
    const json = await res.json();
    const messages: { content: string; sender_name: string; id: string }[] = json.data || [];

    // Get claim to check already-recruited agents
    const { data: claim } = await supabase
      .from("claims")
      .select("recruited_agents")
      .eq("room_id", chatId)
      .single();

    const recruited: string[] = claim?.recruited_agents || [];
    const newRecruits: string[] = [];

    // Scan for [RECRUIT:role] tags
    for (const msg of messages) {
      const matches = msg.content.matchAll(/\[RECRUIT:(\w+)\]/gi);
      for (const match of matches) {
        const role = match[1].toLowerCase();
        if (ROLE_MAP[role] && !recruited.includes(role)) {
          // Add participant to room
          try {
            await addParticipantToRoom(chatId, ROLE_MAP[role]);
            newRecruits.push(role);

            // Send context message to newly recruited agent
            const handle = `@nodesemesta/${role}`;
            await sendMessageToRoom(
              chatId,
              `${handle} You have been recruited to this investigation. Please review the messages above and provide your analysis.`,
              [{ id: ROLE_MAP[role] }]
            );
          } catch (err: any) {
            // Agent might already be in room — not fatal
            if (!err.message?.includes("already")) {
              console.error(`Failed to recruit ${role}:`, err.message);
            }
            newRecruits.push(role); // Mark as recruited to avoid retrying
          }
        }
      }
    }

    // Update DB with newly recruited agents
    if (newRecruits.length > 0) {
      await supabase
        .from("claims")
        .update({ recruited_agents: [...recruited, ...newRecruits] })
        .eq("room_id", chatId);
    }

    return NextResponse.json({ recruited: newRecruits, total: [...recruited, ...newRecruits] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
