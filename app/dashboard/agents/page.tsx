"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, Chip, Avatar } from "@heroui/react";
import { Bot, Clock, Users, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";

const agents = [
  {
    name: "Claim Reviewer",
    framework: "LangGraph",
    model: "GPT-4o (AI/ML API)",
    role: "Triage & recruitment",
    status: "online",
    uptime: "5h 23m",
    color: "blue",
    icon: <Users className="w-6 h-6 text-blue-500" />,
  },
  {
    name: "Fraud Investigator",
    framework: "CrewAI",
    model: "GPT-4o (AI/ML API)",
    role: "Fraud pattern analysis",
    status: "online",
    uptime: "4h 15m",
    color: "red",
    icon: <Clock className="w-6 h-6 text-red-500" />,
  },
  {
    name: "Senior Adjuster",
    framework: "Pydantic AI",
    model: "GPT-4o (AI/ML API)",
    role: "Final decision authority",
    status: "online",
    uptime: "3h 48m",
    color: "green",
    icon: <Bot className="w-6 h-6 text-green-500" />,
  },
];

const agentStats = {
  totalInvestigated: 147,
  claimsPerHour: 18,
  avgResponseTime: "2.3s",
  errorRate: "0.8%",
};

export default function AgentsPage() {
  const [lastChecked, setLastChecked] = useState("Just now");

  return (
    <div className="space-y-8">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Status</h1>
          <p className="text-zinc-400 mt-1">Monitor all AI agents in real-time</p>
        </div>
        <Chip color="success" variant="soft">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>All systems operational</span>
          </div>
        </Chip>
      </div>

      {/* Agent Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card 
            key={agent.name} 
            className={`bg-zinc-900/50 border border-zinc-800 hover:border-${agent.color}-500/50 transition-colors`}
          >
            <CardContent className="p-6">
              {/* Agent Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-${agent.color}-600/20 rounded-xl flex items-center justify-center`}>
                    {agent.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {agent.status === "online" ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                      <Chip 
                        size="sm" 
                        color={agent.status === "online" ? "success" : "danger"} 
                        variant="soft"
                      >
                        {agent.status.toUpperCase()}
                      </Chip>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-zinc-400 mb-1">Framework</h4>
                  <p className="font-medium">{agent.framework}</p>
                </div>
                <div>
                  <h4 className="text-sm text-zinc-400 mb-1">Model</h4>
                  <p className="font-medium">{agent.model}</p>
                </div>
                <div>
                  <h4 className="text-sm text-zinc-400 mb-1">Role</h4>
                  <p className="font-medium">{agent.role}</p>
                </div>
                <div>
                  <h4 className="text-sm text-zinc-400 mb-1">Uptime</h4>
                  <p className="font-medium">{agent.uptime}</p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Health</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-zinc-800 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full bg-${agent.color}-600`}
                        style={{ width: agent.status === "online" ? "95%" : "0%" }}
                      />
                    </div>
                    <span className="font-medium">
                      {agent.status === "online" ? "95%" : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Stats */}
      <Card className="bg-zinc-900/50 border border-zinc-800">
        <CardHeader className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">System Performance</h2>
          <p className="text-zinc-400 text-sm">Updated {lastChecked}</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-zinc-800/50 rounded-xl p-6">
              <h3 className="text-sm text-zinc-400 mb-2">Total Claims Investigated</h3>
              <p className="text-3xl font-bold">{agentStats.totalInvestigated}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-6">
              <h3 className="text-sm text-zinc-400 mb-2">Claims Per Hour</h3>
              <p className="text-3xl font-bold">{agentStats.claimsPerHour}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-6">
              <h3 className="text-sm text-zinc-400 mb-2">Avg Response Time</h3>
              <p className="text-3xl font-bold">{agentStats.avgResponseTime}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-6">
              <h3 className="text-sm text-zinc-400 mb-2">Error Rate</h3>
              <p className="text-3xl font-bold">{agentStats.errorRate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-zinc-900/50 border border-zinc-800">
        <CardHeader className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">Recent Agent Activity</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            <div className="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Claim Reviewer recruited Fraud Investigator</p>
                    <p className="text-sm text-zinc-400">Claim CLM-2026-4521</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-400">10:03 AM</span>
              </div>
            </div>
            <div className="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">Fraud Investigator requested clarification</p>
                    <p className="text-sm text-zinc-400">Certification question</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-400">10:05 AM</span>
              </div>
            </div>
            <div className="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Senior Adjuster joined investigation</p>
                    <p className="text-sm text-zinc-400">Final decision phase</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-400">10:09 AM</span>
              </div>
            </div>
            <div className="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Senior Adjuster completed review</p>
                    <p className="text-sm text-zinc-400">PARTIAL_APPROVED decision</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-400">10:12 AM</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}