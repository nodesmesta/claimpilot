"use client";

import { useState, useEffect } from "react";
import { Bot, Users, Clock, Wifi, Search, Scale } from "lucide-react";

interface ClaimStats {
  total: number;
  investigating: number;
  resolved: number;
  avgResolutionMinutes: number | null;
}

const agents = [
  { name: "Claim Reviewer", handle: "@nodesemesta/reviewer", role: "Triage & risk classification", color: "blue", icon: Users, desc: "Always in room. Classifies risk, auto-approves LOW claims, recruits specialists." },
  { name: "Fraud Investigator", handle: "@nodesemesta/investigator", role: "Fraud pattern analysis", color: "red", icon: Search, desc: "Recruited on-demand for MEDIUM/HIGH risk. Analyzes patterns, clarification loops." },
  { name: "Senior Adjuster", handle: "@nodesemesta/adjuster", role: "Final decision authority", color: "green", icon: Scale, desc: "Recruited for suspicious cases. Issues APPROVED/PARTIAL/DENIED with settlement." },
];

const colorMap: Record<string, { iconBg: string; iconText: string; border: string }> = {
  blue: { iconBg: "bg-blue-100", iconText: "text-blue-600", border: "hover:border-blue-300" },
  red: { iconBg: "bg-red-100", iconText: "text-red-600", border: "hover:border-red-300" },
  green: { iconBg: "bg-green-100", iconText: "text-green-600", border: "hover:border-green-300" },
};

export default function AgentsPage() {
  const [stats, setStats] = useState<ClaimStats>({ total: 0, investigating: 0, resolved: 0, avgResolutionMinutes: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/claims")
      .then((r) => r.json())
      .then((json) => {
        const claims = json.data || [];
        const resolved = claims.filter((c: { resolved_at: string | null }) => c.resolved_at);
        let avgMin: number | null = null;
        if (resolved.length > 0) {
          const totalMs = resolved.reduce((sum: number, c: { created_at: string; resolved_at: string }) => {
            return sum + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime());
          }, 0);
          avgMin = Math.round(totalMs / resolved.length / 60000);
        }
        setStats({
          total: claims.length,
          investigating: claims.filter((c: { status: string }) => c.status === "investigating").length,
          resolved: resolved.length,
          avgResolutionMinutes: avgMin,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Agent Status</h1>
          <p className="text-zinc-500 mt-1">Platform agents running on Band.ai</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-200 flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5" /> Band Platform Connected
        </span>
      </div>

      {/* Agent Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const c = colorMap[agent.color];
          return (
            <div key={agent.name} className={`p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 ${c.border} hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                  <agent.icon className={`w-6 h-6 ${c.iconText}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{agent.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{agent.handle}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 mb-4">{agent.desc}</p>
              <div className="pt-4 border-t border-zinc-100 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Role</span><span className="font-medium text-zinc-900">{agent.role}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Runtime</span><span className="font-medium text-zinc-900">Band Platform</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Model</span><span className="font-medium text-zinc-900">GPT-4o</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Stats from DB */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900">Investigation Metrics</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Real data from your claims</p>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-4 text-center py-6 text-zinc-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading metrics...
            </div>
          ) : (
            <>
              <div className="bg-zinc-50 rounded-xl p-5">
                <p className="text-sm text-zinc-500 mb-1">Total Claims</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-5">
                <p className="text-sm text-zinc-500 mb-1">Investigating</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.investigating}</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-5">
                <p className="text-sm text-zinc-500 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-5">
                <p className="text-sm text-zinc-500 mb-1">Avg Resolution</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {stats.avgResolutionMinutes !== null ? `${stats.avgResolutionMinutes}m` : "—"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900">Agent Orchestration Flow</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 text-sm text-zinc-600 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-medium">Claim Submitted</span>
            <span className="text-zinc-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-medium">Reviewer Triage</span>
            <span className="text-zinc-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-medium">Investigator (if HIGH)</span>
            <span className="text-zinc-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium">Adjuster (if SUSPICIOUS)</span>
            <span className="text-zinc-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 font-medium">Resolution</span>
          </div>
        </div>
      </div>
    </div>
  );
}
