"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Bot, Users, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  content: string;
  message_type: string;
  sender_id: string;
  sender_type: string;
  sender_name: string;
  inserted_at: string;
  metadata?: { mentions?: { name: string; handle: string }[] };
}

const agentStyle: Record<string, { bg: string; border: string; dot: string }> = {
  "Gateway":            { bg: "bg-zinc-50",    border: "border-zinc-200",   dot: "bg-zinc-500" },
  "Reviewer":           { bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500" },
  "Claim Reviewer":     { bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500" },
  "Investigator":       { bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500" },
  "Fraud Investigator": { bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500" },
  "Adjuster":           { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  "Senior Adjuster":    { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  "resolver":           { bg: "bg-purple-50",  border: "border-purple-200", dot: "bg-purple-500" },
  "Resolver":           { bg: "bg-purple-50",  border: "border-purple-200", dot: "bg-purple-500" },
};

function getStyle(name: string) {
  return agentStyle[name] || { bg: "bg-zinc-50", border: "border-zinc-200", dot: "bg-zinc-400" };
}

function StreamingText({ text, speed = 8 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setDone(false);
    const interval = setInterval(() => {
      i += 2;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className="prose-agent">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayed}</ReactMarkdown>
      {!done && <span className="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse ml-0.5 align-middle" />}
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-agent">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// Agent ID to name mapping
const AGENT_NAMES: Record<string, string> = {
  "36558bfa-2887-4f7d-8bd5-ba64771a5f76": "Reviewer",
  "d39d2e28-ef86-4aa5-80aa-cbd0251b225e": "Gateway",
  "a55a1e0d-8ddf-4d08-ac3d-18428c7de10a": "Resolver",
  "57f4dc81-0bc6-4a4b-8c7a-6c1a67d6a6e7": "Investigator",
  "c8a12f3e-5d9a-4b1c-9e7f-2a3b4c5d6e7f": "Adjuster",
};

function cleanContent(content: string, senderName: string): string {
  // Replace @[[uuid]] with @AgentName
  let cleaned = content.replace(/@\[\[([a-f0-9-]+)\]\]/g, (_, id) => {
    const name = AGENT_NAMES[id];
    return name ? `**@${name}**` : "";
  });
  // Remove @nodesemesta/handle mentions (redundant with above)
  cleaned = cleaned.replace(/@nodesemesta\/\w+/g, "").trim();
  // For Gateway messages: format the claim data JSON nicely
  if (senderName === "Gateway" && cleaned.includes("Claim data:")) {
    const parts = cleaned.split("Claim data:");
    const intro = parts[0].trim();
    try {
      const jsonStr = parts[1].trim();
      const data = JSON.parse(jsonStr);
      const formatted = [
        intro,
        "",
        "| Field | Value |",
        "|-------|-------|",
        `| **Claim ID** | ${data.claim_id || "—"} |`,
        `| **Policyholder** | ${data.policyholder || "—"} |`,
        `| **Policy** | ${data.policy_type || "—"} |`,
        `| **Amount** | $${(data.claim_amount || 0).toLocaleString()} |`,
        `| **Incident Date** | ${data.incident_date || "—"} |`,
        `| **Witnesses** | ${data.witnesses ?? 0} |`,
        `| **Photos** | ${data.photos_submitted ?? 0} |`,
        `| **Police Report** | ${data.police_report ? "Yes" : "No"} |`,
        `| **Medical** | ${data.medical_claim ? "Yes" : "No"} |`,
        "",
        data.description ? `> ${data.description.slice(0, 200)}` : "",
      ].filter(Boolean).join("\n");
      return formatted;
    } catch {
      return cleaned;
    }
  }
  return cleaned;
}

export default function LiveInvestigationPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/${chatId}/messages`);
      if (!res.ok) return;
      const json = await res.json();
      const allMsgs: Message[] = json.data || [];
      if (allMsgs.length > 0) {
        setMessages((prev) => {
          const prevIds = new Set(prev.map((m) => m.id));
          const fresh = allMsgs.filter((m) => !prevIds.has(m.id));
          if (fresh.length === 0) return prev;
          const freshAgentIds = new Set(fresh.filter(m => m.sender_name !== "Gateway").map(m => m.id));
          if (freshAgentIds.size > 0 && prev.length > 0) {
            setNewMsgIds(p => new Set([...p, ...freshAgentIds]));
          }
          return allMsgs.sort(
            (a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime()
          );
        });
        // Try to resolve
        const resolveRes = await fetch(`/api/claims/${chatId}/resolve`, { method: "POST" }).catch(() => null);
        if (resolveRes) {
          const r = await resolveRes.json().catch(() => null);
          if (r?.resolved) setResolved(true);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, resolved ? 10000 : 1000);
    return () => clearInterval(interval);
  }, [fetchMessages, resolved]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const participants = Array.from(
    new Set(messages.filter((m) => m.sender_type === "Agent").map((m) => m.sender_name))
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (error) {
    return <div className="p-8 text-center text-red-600"><p>{error}</p></div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Live Room */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">Live Investigation Room</h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${resolved ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>{resolved ? "✓ RESOLVED" : "● LIVE"}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Room: {chatId}</p>
          </div>
          <div className="p-6">
            <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
              {loading && messages.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-zinc-500">Waiting for agents...</span>
                </div>
              )}
              {messages.map((msg) => {
                const isSystem = msg.message_type !== "text";
                const style = getStyle(msg.sender_name);

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                        [{msg.message_type}] {msg.sender_name}: {msg.content?.slice(0, 100)}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`p-4 rounded-2xl border ${style.bg} ${style.border}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-7 h-7 rounded-full ${style.dot} flex items-center justify-center`}>
                        {msg.sender_type === "Agent" ? <Bot className="w-3.5 h-3.5 text-white" /> : <Users className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="font-semibold text-sm text-zinc-900">{msg.sender_name}</span>
                      <span className="text-xs text-zinc-400 ml-auto">{formatTime(msg.inserted_at)}</span>
                    </div>
                    <div className="text-zinc-700 text-sm">
                      {newMsgIds.has(msg.id)
                        ? <StreamingText text={cleanContent(msg.content, msg.sender_name)} />
                        : <MarkdownContent content={cleanContent(msg.content, msg.sender_name)} />
                      }
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4" /> Participants
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {participants.length === 0 && (
              <p className="text-xs text-zinc-400">Waiting for agents to join...</p>
            )}
            {participants.map((agent) => {
              const style = getStyle(agent);
              return (
                <div key={agent} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full ${style.dot} flex items-center justify-center`}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="flex-1 text-sm text-zinc-700">{agent}</span>
                  <span className="text-xs text-green-600 font-medium">● Joined</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Status
            </h3>
          </div>
          <div className="p-6 text-sm text-zinc-500">
            <p>{messages.length} messages received</p>
            <p className="mt-1">Polling every 3s</p>
          </div>
        </div>
      </div>
    </div>
  );
}
