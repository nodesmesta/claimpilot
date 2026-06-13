"use client";

import { useState } from "react";
import { Bot, Clock, Users, CheckCircle, Wifi, WifiOff } from "lucide-react";

const agents = [
  { name: "Claim Reviewer", framework: "LangGraph", model: "GPT-4o (AI/ML API)", role: "Triage & recruitment", status: "online", uptime: "5h 23m", color: "blue" },
  { name: "Fraud Investigator", framework: "CrewAI", model: "GPT-4o (AI/ML API)", role: "Fraud pattern analysis", status: "online", uptime: "4h 15m", color: "red" },
  { name: "Senior Adjuster", framework: "Pydantic AI", model: "GPT-4o (AI/ML API)", role: "Final decision authority", status: "online", uptime: "3h 48m", color: "green" },
];

const agentStats = { totalInvestigated: 147, claimsPerHour: 18, avgResponseTime: "2.3s", errorRate: "0.8%" };

const colorMap: Record<string, { iconBg: string; iconText: string; border: string; healthBar: string }> = {
  blue: { iconBg: "bg-blue-100", iconText: "text-blue-600", border: "hover:border-blue-300", healthBar: "bg-blue-500" },
  red: { iconBg: "bg-red-100", iconText: "text-red-600", border: "hover:border-red-300", healthBar: "bg-red-500" },
  green: { iconBg: "bg-green-100", iconText: "text-green-600", border: "hover:border-green-300", healthBar: "bg-green-500" },
};

const IconFor = ({ color }: { color: string }) => {
  const cls = `w-6 h-6 ${colorMap[color]?.iconText || "text-zinc-600"}`;
  if (color === "blue") return <Users className={cls} />;
  if (color === "red") return <Clock className={cls} />;
  return <Bot className={cls} />;
};

export default function AgentsPage() {
  const [lastChecked] = useState("Just now");

  return (
    <div className="space-y-8">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Agent Status</h1>
          <p className="text-zinc-500 mt-1">Monitor all AI agents in real-time</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-200 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          All systems operational
        </span>
      </div>

      {/* Agent Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const c = colorMap[agent.color];
          return (
            <div key={agent.name} className={`p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 ${c.border} hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                  <IconFor color={agent.color} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {agent.status === "online" ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-red-500" />}
                    <span className={`text-xs font-medium ${agent.status === "online" ? "text-green-600" : "text-red-600"}`}>{agent.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="text-zinc-500">Framework</span><p className="font-medium text-zinc-900">{agent.framework}</p></div>
                <div><span className="text-zinc-500">Model</span><p className="font-medium text-zinc-900">{agent.model}</p></div>
                <div><span className="text-zinc-500">Role</span><p className="font-medium text-zinc-900">{agent.role}</p></div>
                <div><span className="text-zinc-500">Uptime</span><p className="font-medium text-zinc-900">{agent.uptime}</p></div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-sm">
                <span className="text-zinc-500">Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-zinc-100 rounded-full h-2">
                    <div className={`h-full rounded-full ${c.healthBar}`} style={{ width: agent.status === "online" ? "95%" : "0%" }} />
                  </div>
                  <span className="font-medium text-zinc-900">{agent.status === "online" ? "95%" : "0%"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Stats */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">System Performance</h2>
          <span className="text-zinc-500 text-sm">Updated {lastChecked}</span>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Claims Investigated", value: agentStats.totalInvestigated },
            { label: "Claims Per Hour", value: agentStats.claimsPerHour },
            { label: "Avg Response Time", value: agentStats.avgResponseTime },
            { label: "Error Rate", value: agentStats.errorRate },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-50 rounded-xl p-5">
              <p className="text-sm text-zinc-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900">Recent Agent Activity</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {[
            { icon: Users, color: "blue", text: "Claim Reviewer recruited Fraud Investigator", sub: "Claim CLM-2026-4521", time: "10:03 AM" },
            { icon: Clock, color: "red", text: "Fraud Investigator requested clarification", sub: "Certification question", time: "10:05 AM" },
            { icon: Bot, color: "green", text: "Senior Adjuster joined investigation", sub: "Final decision phase", time: "10:09 AM" },
            { icon: CheckCircle, color: "green", text: "Senior Adjuster completed review", sub: "PARTIAL_APPROVED decision", time: "10:12 AM" },
          ].map((item, i) => (
            <div key={i} className="px-6 py-4 hover:bg-zinc-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${colorMap[item.color]?.iconBg || "bg-zinc-100"} rounded-full flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 ${colorMap[item.color]?.iconText || "text-zinc-600"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{item.text}</p>
                    <p className="text-sm text-zinc-500">{item.sub}</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
