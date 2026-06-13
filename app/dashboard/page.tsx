"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, AlertTriangle, Mail, DollarSign, ArrowRight } from "lucide-react";

interface Claim {
  id: string;
  claim_id: string;
  room_id: string;
  policyholder: string;
  claim_amount: number;
  settlement_amount: number | null;
  risk_level: string | null;
  status: string;
  verdict: string | null;
  created_at: string;
  resolved_at: string | null;
}

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/claims")
      .then((r) => r.json())
      .then((json) => setClaims(json.data || []))
      .finally(() => setLoading(false));
  }, []);

  const FREE_LIMIT = 10;
  const total = claims.length;
  const investigating = claims.filter((c) => c.status === "investigating").length;
  const resolved = claims.filter((c) => c.status !== "investigating").length;
  const highRisk = claims.filter((c) => c.risk_level === "HIGH").length;

  const stats = [
    { title: "Total Claims", value: `${total}/${FREE_LIMIT}`, icon: FileText, color: "blue" },
    { title: "Investigating", value: investigating, icon: Clock, color: "yellow" },
    { title: "Resolved", value: resolved, icon: CheckCircle, color: "green" },
    { title: "High Risk", value: highRisk, icon: AlertTriangle, color: "red" },
  ];

  const getIconBg = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-100 text-blue-600";
      case "yellow": return "bg-yellow-100 text-yellow-600";
      case "green": return "bg-green-100 text-green-600";
      case "red": return "bg-red-100 text-red-600";
      default: return "bg-zinc-100 text-zinc-600";
    }
  };

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case "LOW": return "bg-green-100 text-green-700";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700";
      case "HIGH": return "bg-red-100 text-red-700";
      default: return "bg-zinc-100 text-zinc-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "partial_approved": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "denied": return <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">✕</span>;
      default: return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Approved";
      case "partial_approved": return "Partial Approved";
      case "denied": return "Denied";
      default: return "Investigating...";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.title} className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-zinc-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${getIconBg(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Claims — Card Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">Recent Claims</h2>
          <Link href="/dashboard/claims" className="text-sm text-blue-600 hover:text-purple-600 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {claims.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200">
            <p className="text-zinc-500">No claims yet. <Link href="/dashboard/claims/new" className="text-blue-600 font-medium">Submit one →</Link></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claims.slice(0, 6).map((claim) => (
              <Link key={claim.id} href={`/dashboard/claims/${claim.room_id}`}
                className="block p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(claim.status)}
                    <span className="text-sm font-medium text-zinc-700">{getStatusLabel(claim.status)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRiskBadge(claim.risk_level)}`}>
                    {claim.risk_level || "—"}
                  </span>
                </div>

                {/* Claim Info */}
                <p className="font-semibold text-zinc-900">{claim.claim_id}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{claim.policyholder}</p>

                {/* Amount */}
                <p className="text-xl font-bold text-zinc-900 mt-3">
                  ${(claim.claim_amount || 0).toLocaleString()}
                  {claim.settlement_amount != null && claim.status !== "investigating" && (
                    <span className="text-sm font-normal text-zinc-400 ml-2">
                      → ${claim.settlement_amount.toLocaleString()}
                    </span>
                  )}
                </p>

                {/* Status Indicators */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-1">
                    <Mail className={`w-3.5 h-3.5 ${claim.resolved_at ? "text-green-500" : "text-zinc-300"}`} />
                    <span className="text-[10px] text-zinc-500">{claim.resolved_at ? "Sent" : "Pending"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className={`w-3.5 h-3.5 ${
                      claim.status === "denied" ? "text-zinc-300" :
                      claim.resolved_at ? "text-green-500" : "text-zinc-300"
                    }`} />
                    <span className="text-[10px] text-zinc-500">
                      {claim.status === "denied" ? "N/A" : claim.resolved_at ? "Processed" : "Pending"}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 ml-auto">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
