"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Bot, Users, Clock } from "lucide-react";

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
  "Claim Reviewer": { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  "Fraud Investigator": { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  "Senior Adjuster": { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
};

function getStyle(name: string) {
  return agentStyle[name] || { bg: "bg-zinc-50", border: "border-zinc-200", dot: "bg-zinc-400" };
}

export default function LiveInvestigationPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const query = sinceRef.current ? `?since=${sinceRef.current}` : "";
      const res = await fetch(`/api/claims/${chatId}/messages${query}`);
      if (!res.ok) return;
      const json = await res.json();
      const newMsgs: Message[] = json.data || [];
      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const unique = newMsgs.filter((m) => !ids.has(m.id));
          if (unique.length === 0) return prev;
          return [...prev, ...unique].sort(
            (a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime()
          );
        });
        const latest = newMsgs.reduce((a, b) =>
          new Date(a.inserted_at) > new Date(b.inserted_at) ? a : b
        );
        sinceRef.current = latest.inserted_at;
        // Try to resolve claim status from messages
        fetch(`/api/claims/${chatId}/resolve`, { method: "POST" }).catch(() => {});
      }
    } catch {
      // silently retry next poll
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

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
              <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-200">● LIVE</span>
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
                    <p className="text-zinc-700 text-sm whitespace-pre-wrap">{msg.content}</p>
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
            {["Claim Reviewer", "Fraud Investigator", "Senior Adjuster"].map((agent) => {
              const active = participants.includes(agent);
              const style = getStyle(agent);
              return (
                <div key={agent} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full ${style.dot} flex items-center justify-center`}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="flex-1 text-sm text-zinc-700">{agent}</span>
                  {active ? (
                    <span className="text-xs text-green-600 font-medium">● Joined</span>
                  ) : (
                    <span className="text-xs text-zinc-400">○ Waiting</span>
                  )}
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
