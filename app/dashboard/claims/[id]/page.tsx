"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, Chip, Spinner } from "@heroui/react";
import { Bot, Users, AlertTriangle, Clock, Send } from "lucide-react";

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
  "Claim Reviewer": { bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-500" },
  "Fraud Investigator": { bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-500" },
  "Senior Adjuster": { bg: "bg-green-500/10", border: "border-green-500/30", dot: "bg-green-500" },
};

function getStyle(name: string) {
  return agentStyle[name] || { bg: "bg-zinc-800/50", border: "border-zinc-700", dot: "bg-zinc-500" };
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
          const merged = [...prev, ...unique].sort(
            (a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime()
          );
          return merged;
        });
        const latest = newMsgs.reduce((a, b) =>
          new Date(a.inserted_at) > new Date(b.inserted_at) ? a : b
        );
        sinceRef.current = latest.inserted_at;
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

  // Derive participants from messages
  const participants = Array.from(
    new Set(messages.filter((m) => m.sender_type === "Agent").map((m) => m.sender_name))
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left — Live Room */}
      <div className="lg:col-span-2">
        <Card className="bg-zinc-900/50 border border-zinc-800">
          <CardHeader className="px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Live Investigation Room</h2>
              <Chip color="warning" variant="soft" size="sm">● LIVE</Chip>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Room: {chatId}</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
              {loading && messages.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                  <span className="ml-3 text-zinc-400">Waiting for agents...</span>
                </div>
              )}
              {messages.map((msg) => {
                const isSystem = msg.message_type !== "text";
                const style = getStyle(msg.sender_name);

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">
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
                      <span className="font-semibold text-sm">{msg.sender_name}</span>
                      <span className="text-xs text-zinc-500 ml-auto">{formatTime(msg.inserted_at)}</span>
                    </div>
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right — Sidebar */}
      <div className="space-y-4">
        {/* Participants */}
        <Card className="bg-zinc-900/50 border border-zinc-800">
          <CardHeader className="px-6 py-4 border-b border-zinc-800">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" /> Participants
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {["Claim Reviewer", "Fraud Investigator", "Senior Adjuster"].map((agent) => {
                const active = participants.includes(agent);
                const style = getStyle(agent);
                return (
                  <div key={agent} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full ${style.dot} flex items-center justify-center`}>
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="flex-1 text-sm">{agent}</span>
                    {active ? (
                      <span className="text-xs text-green-400">● Joined</span>
                    ) : (
                      <span className="text-xs text-zinc-500">○ Waiting</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-zinc-900/50 border border-zinc-800">
          <CardHeader className="px-6 py-4 border-b border-zinc-800">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Status
            </h3>
          </CardHeader>
          <CardContent className="p-6 text-sm text-zinc-400">
            <p>{messages.length} messages received</p>
            <p className="mt-1">Polling every 3s</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
