"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Bot, Users, Clock, FileText, Shield, CreditCard, Mail, Info, Calendar, MapPin, Activity, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";
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
  "Resolver":           { bg: "bg-purple-50",  border: "border-purple-200", dot: "bg-purple-500" },
};

function getStyle(name: string) {
  const lowercaseName = (name || "").toLowerCase();
  if (lowercaseName.includes("gateway")) {
    return agentStyle["Gateway"];
  }
  if (lowercaseName.includes("reviewer")) {
    return agentStyle["Reviewer"];
  }
  if (lowercaseName.includes("investigator")) {
    return agentStyle["Investigator"];
  }
  if (lowercaseName.includes("adjuster")) {
    return agentStyle["Adjuster"];
  }
  if (lowercaseName.includes("resolver")) {
    return agentStyle["Resolver"];
  }
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

// Default Agent ID to name mapping fallback
const DEFAULT_AGENT_NAMES: Record<string, string> = {
  "3ffde2c6-2967-42fd-a930-61ff239d8c18": "Reviewer",
  "71c8c2c4-7a60-4f03-991e-ed6afb52b186": "Investigator",
  "2e353c0b-23cc-4a37-ac4a-87b7a53f9c69": "Adjuster",
  "e6f31f80-3ab9-4a7d-b6f9-4147a6b77b83": "Resolver",
};

function cleanContent(content: string, senderName: string, customAgentNames?: Record<string, string>): string {
  const mergedNames = { ...DEFAULT_AGENT_NAMES, ...customAgentNames };
  // Replace @[[uuid]] with @AgentName
  let cleaned = content.replace(/@\[\[([a-f0-9-]+)\]\]/g, (_, id) => {
    const name = mergedNames[id];
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

interface ClaimDetail {
  id: string;
  claim_id: string;
  room_id: string;
  policyholder: string;
  policy_type: string;
  incident_type: string;
  description: string;
  claim_amount: number;
  settlement_amount: number | null;
  location: string;
  incident_date: string;
  filing_date: string;
  witnesses: number;
  photos_submitted: number;
  prior_claims_12mo: number;
  police_report: boolean;
  medical_claim: boolean;
  status: string;
  risk_level: string | null;
  verdict: string | null;
  fraud_score: number | null;
  resolution_reasoning: string | null;
  resolved_at: string | null;
  created_at: string;
  recruited_agents: string[] | null;
  retry_count: number;
  last_retry_at: string | null;
  payment: {
    amount: number;
    method: string;
    status: string;
    created_at: string;
  } | null;
  notifications: {
    id: string;
    recipient_email: string;
    type: string;
    subject: string;
    body: string;
    status: string;
    created_at: string;
  }[];
  asset: {
    policyholder: string;
    policy_number: string;
    policy_type: string;
    vehicle_description: string;
    vin: string;
    license_plate: string;
    estimated_value: number;
    deductible: number;
    premium: string;
    coverage_collision: string;
    coverage_comprehensive: string;
    coverage_liability: string;
    payment_method: string;
    billing_cycle: string;
    claims_history_total: number;
    claims_history_12mo: number;
  } | null;
}

export default function LiveInvestigationPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [claimDetail, setClaimDetail] = useState<ClaimDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"room" | "info" | "audit" | "asset" | "logs">("room");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState(false);
  const [customAgentNames, setCustomAgentNames] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchClaimDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/${chatId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setClaimDetail(json.data);
        if (json.data.status !== "investigating") {
          setResolved(true);
        }
      }
    } catch (err) {
      console.error("Error fetching claim details:", err);
    }
  }, [chatId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/${chatId}/messages`);
      if (!res.ok) return;
      const json = await res.json();
      const allMsgs: Message[] = json.data || [];
      if (json.meta?.agent_names) {
        setCustomAgentNames(json.meta.agent_names);
      }
      if (allMsgs.length > 0) {
        setMessages((prev) => {
          const prevIds = new Set(prev.map((m) => m.id));
          const fresh = allMsgs.filter((m) => !prevIds.has(m.id));
          if (fresh.length === 0) return prev;
          const freshAgentMsgs = fresh.filter(m => m.sender_name !== "Gateway");
          if (freshAgentMsgs.length > 0 && prev.length > 0) {
            setNewMsgIds(p => new Set([...p, ...freshAgentMsgs.map(m => m.id)]));
          }
          // Try to resolve when new agent messages appear
          if (freshAgentMsgs.length > 0) {
            fetch(`/api/claims/${chatId}/resolve`, { method: "POST" })
              .then(r => r?.json()).then(r => { 
                if (r?.resolved) {
                  setResolved(true);
                  fetchClaimDetail();
                }
              }).catch(() => null);
          }
          return allMsgs.sort(
            (a, b) => new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime()
          );
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [chatId, fetchClaimDetail]);

  useEffect(() => {
    fetchMessages();
    fetchClaimDetail();
    const interval = setInterval(() => {
      fetchMessages();
      fetchClaimDetail();
    }, resolved ? 10000 : 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchClaimDetail, resolved]);

  // Periodic resolve check for retry-on-failure (every 30s if not resolved)
  useEffect(() => {
    if (resolved) return;
    const retryInterval = setInterval(() => {
      fetch(`/api/claims/${chatId}/resolve`, { method: "POST" })
        .then(r => r?.json())
        .then(r => {
          if (r?.resolved) {
            setResolved(true);
            fetchClaimDetail();
          }
        })
        .catch(() => null);
    }, 30000);
    return () => clearInterval(retryInterval);
  }, [chatId, resolved, fetchClaimDetail]);

  // Background stalled-claims sweep (every 60s, independent of this claim)
  useEffect(() => {
    if (resolved) return;
    const sweepInterval = setInterval(() => {
      fetch("/api/claims/retry-stalled").catch(() => null);
    }, 60000);
    return () => clearInterval(sweepInterval);
  }, [resolved]);

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
              {resolved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50/80 text-green-700 border border-green-200/60 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" /> RESOLVED
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/60 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  LIVE
                </span>
              )}
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
                        ? <StreamingText text={cleanContent(msg.content, msg.sender_name, customAgentNames)} />
                        : <MarkdownContent content={cleanContent(msg.content, msg.sender_name, customAgentNames)} />
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
          {/* Tabs Navigation */}
          <div className="flex border-b border-zinc-200 bg-zinc-50/50 p-1 gap-1">
            {[
              { id: "room", label: "Timeline", icon: Activity },
              { id: "info", label: "Info Claim", icon: FileText },
              { id: "audit", label: "Audit", icon: Shield },
              { id: "asset", label: "Asset", icon: CreditCard },
              { id: "logs", label: "Logs", icon: Mail },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-medium transition-all ${
                    active
                      ? "bg-white text-blue-600 shadow-sm border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${active ? "text-blue-600" : "text-zinc-400"}`} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "room" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-zinc-900 flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-zinc-500" /> Active Participants
                  </h3>
                  <div className="space-y-3">
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
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50/80 border border-green-200/60 px-2 py-0.5 rounded-full shadow-sm">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            Joined
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <h3 className="font-semibold text-zinc-900 flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-zinc-500" /> Session Status
                  </h3>
                  <div className="space-y-1.5 text-xs text-zinc-500">
                    <p>Total messages: <span className="font-semibold text-zinc-800">{messages.length}</span></p>
                    <p className="flex items-center gap-1.5">
                      Connection:{" "}
                      <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Active (Polling 3s)
                      </span>
                    </p>
                    {claimDetail?.retry_count && claimDetail.retry_count > 0 ? (
                      <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-amber-800 space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" /> Agent Stalled Recovery Triggered
                        </p>
                        <p className="text-[11px] text-amber-700">Retries: {claimDetail.retry_count}/5</p>
                        {claimDetail.last_retry_at && (
                          <p className="text-[11px] text-amber-600">Last retry: {new Date(claimDetail.last_retry_at).toLocaleTimeString()}</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "info" && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-zinc-950 text-sm">{claimDetail?.claim_id || "Loading..."}</h3>
                  <p className="text-xs text-zinc-400">Submitted by: {claimDetail?.policyholder}</p>
                </div>

                <div className="space-y-2 text-xs text-zinc-600">
                  <div className="flex justify-between py-1.5 border-b border-zinc-100">
                    <span>Incident Type</span>
                    <span className="font-medium text-zinc-900">{claimDetail?.incident_type || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-100">
                    <span>Location</span>
                    <span className="font-medium text-zinc-900">{claimDetail?.location || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-100">
                    <span>Date of Incident</span>
                    <span className="font-medium text-zinc-900">{claimDetail?.incident_date || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-100">
                    <span>Date of Filing</span>
                    <span className="font-medium text-zinc-900">{claimDetail?.filing_date || "—"}</span>
                  </div>
                </div>

                {claimDetail?.description && (
                  <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl">
                    <h4 className="text-xs font-semibold text-zinc-800 mb-1">Claim Description</h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">{claimDetail.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <span className="text-zinc-500 block text-[10px]">Witnesses</span>
                    <span className="font-bold text-zinc-800 text-sm">{claimDetail?.witnesses ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <span className="text-zinc-500 block text-[10px]">Photos</span>
                    <span className="font-bold text-zinc-800 text-sm">{claimDetail?.photos_submitted ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between col-span-2">
                    <span className="text-zinc-500">Police Report Filed</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${claimDetail?.police_report ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {claimDetail?.police_report ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between col-span-2">
                    <span className="text-zinc-500">Includes Medical Claim</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${claimDetail?.medical_claim ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>
                      {claimDetail?.medical_claim ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "audit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200/60 bg-gradient-to-br from-zinc-50/50 to-white">
                  <h4 className="text-xs font-semibold text-zinc-500 mb-2">Triage & Risk Profile</h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-700">Risk Level</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      claimDetail?.risk_level === "HIGH" ? "bg-red-100 text-red-700" :
                      claimDetail?.risk_level === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {claimDetail?.risk_level || "LOW"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-700">Verdict Decision</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      claimDetail?.verdict === "DENIED" || claimDetail?.verdict === "LIKELY_FRAUDULENT" ? "bg-red-100 text-red-700" :
                      claimDetail?.verdict === "PARTIAL_APPROVED" || claimDetail?.verdict === "SUSPICIOUS" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {claimDetail?.verdict || "PENDING"}
                    </span>
                  </div>
                </div>

                {/* Fraud Score Bar */}
                {claimDetail?.fraud_score !== null && claimDetail?.fraud_score !== undefined && (
                  <div className="p-4 rounded-xl border border-zinc-200/60 bg-white shadow-sm">
                    <div className="flex justify-between items-baseline mb-2">
                      <h4 className="text-xs font-semibold text-zinc-800">Fraud Score</h4>
                      <span className="text-sm font-bold text-zinc-950">{claimDetail.fraud_score} <span className="text-xs text-zinc-400 font-normal">/ 10</span></span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          claimDetail.fraud_score >= 7 ? "bg-red-500" :
                          claimDetail.fraud_score >= 4 ? "bg-amber-500" :
                          "bg-green-500"
                        }`}
                        style={{ width: `${claimDetail.fraud_score * 10}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-3">
                      {claimDetail.fraud_score >= 7 ? (
                        <span className="flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span>High probability of fraud, adjust with caution</span>
                        </span>
                      ) : claimDetail.fraud_score >= 4 ? (
                        <span className="flex items-start gap-1.5">
                          <Search className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>Suspicious indicators, escalated to Adjuster</span>
                        </span>
                      ) : (
                        <span className="flex items-start gap-1.5">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Clean parameters, recommended for fast-track approval</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {claimDetail?.resolution_reasoning && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <h4 className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-blue-600" /> Resolution Auditing
                    </h4>
                    <p className="text-xs text-blue-800 leading-relaxed italic">
                      "{claimDetail.resolution_reasoning.replace(/^(ADJUSTER_DECISION|REVIEWER_REPORT|INVESTIGATOR_REPORT)/i, '').trim().slice(0, 300)}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "asset" && (
              <div className="space-y-4">
                {claimDetail?.asset ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-sm">{claimDetail.asset.vehicle_description}</h3>
                      <p className="text-xs text-zinc-500">Policyholder: {claimDetail.asset.policyholder}</p>
                    </div>

                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Policy Number</span>
                        <span className="font-mono font-semibold text-zinc-800">{claimDetail.asset.policy_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Estimated Value</span>
                        <span className="font-semibold text-zinc-950">${claimDetail.asset.estimated_value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Deductible Applied</span>
                        <span className="font-semibold text-red-600">${claimDetail.asset.deductible.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Premium Rate</span>
                        <span className="font-medium text-zinc-700">{claimDetail.asset.premium}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <h4 className="font-semibold text-zinc-800">Coverage Details</h4>
                      <div className="p-2.5 border border-zinc-100 rounded-xl space-y-1.5 bg-white">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Collision</span>
                          <span className="font-medium text-zinc-800">{claimDetail.asset.coverage_collision}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Comprehensive</span>
                          <span className="font-medium text-zinc-800">{claimDetail.asset.coverage_comprehensive}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Liability Limit</span>
                          <span className="font-medium text-zinc-800">{claimDetail.asset.coverage_liability}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs p-2 bg-zinc-50 rounded-lg">
                      <div className="text-center">
                        <span className="text-zinc-400 text-[10px] block">Lifetime Claims</span>
                        <span className="font-bold text-zinc-800">{claimDetail.asset.claims_history_total}</span>
                      </div>
                      <div className="text-center border-l border-zinc-200">
                        <span className="text-zinc-400 text-[10px] block">Last 12 Months</span>
                        <span className="font-bold text-zinc-800">{claimDetail.asset.claims_history_12mo}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 border border-dashed border-zinc-200 rounded-xl">
                    <CreditCard className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">No asset declarations found for policyholder.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-6">
                {/* Payout log */}
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5 mb-3">
                    <CreditCard className="w-4 h-4 text-zinc-500" /> Settlement Payout
                  </h3>
                  {claimDetail?.payment ? (
                    <div className="p-4 bg-green-50/50 border border-green-200/60 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Settled Amount</span>
                        <span className="font-bold text-green-700 text-sm">${claimDetail.payment.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Method</span>
                        <span className="font-medium text-zinc-800">{claimDetail.payment.method.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-600">Status</span>
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold text-[10px]">
                          {claimDetail.payment.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-green-100/50">
                        <span>Processed At</span>
                        <span>{new Date(claimDetail.payment.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-center text-xs text-zinc-500">
                      {claimDetail?.status === "denied" 
                        ? "Claim denied — No payment processed." 
                        : "No settlement payout processed yet."}
                    </div>
                  )}
                </div>

                {/* Email Notifications */}
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5 mb-3">
                    <Mail className="w-4 h-4 text-zinc-500" /> Email Notifications Log
                  </h3>
                  {claimDetail?.notifications && claimDetail.notifications.length > 0 ? (
                    <div className="space-y-3">
                      {claimDetail.notifications.map((n) => (
                        <div key={n.id} className="p-3 bg-white border border-zinc-200/80 rounded-xl text-xs space-y-1.5 shadow-sm">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-zinc-800 truncate max-w-[150px]">{n.subject}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              n.status === "sent" ? "bg-green-50 text-green-700 border border-green-150" :
                              n.status === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-150" :
                              "bg-red-50 text-red-700 border border-red-150"
                            }`}>
                              {n.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500">Recipient: {n.recipient_email}</p>
                          <p className="text-[9px] text-zinc-400">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-center text-xs text-zinc-500">
                      No notifications sent yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
