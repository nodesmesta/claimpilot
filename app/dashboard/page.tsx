"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  XCircle,
} from "lucide-react";

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
  incident_type: string | null;
}

/* ── Donut Chart ─────────────────────────────────────── */
function DonutChart({
  segments,
}: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f4f4f5" strokeWidth="3" />
        </svg>
      </div>
    );
  }

  let offset = 0;
  const circumference = 2 * Math.PI * 15.9;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const dash = (seg.value / total) * circumference;
      const gap = circumference - dash;
      const arc = { ...seg, dash, gap, offset };
      offset += dash;
      return arc;
    });

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f4f4f5" strokeWidth="3" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={arc.color}
            strokeWidth="3"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-zinc-900">{total}</span>
        <span className="text-[10px] text-zinc-400 font-medium">TOTAL</span>
      </div>
    </div>
  );
}

/* ── Bar Chart ───────────────────────────────────────── */
function MiniBarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end" style={{ height: "48px" }}>
            <div
              className="w-full rounded-t-sm transition-all duration-700"
              style={{
                height: `${(d.value / max) * 48}px`,
                minHeight: d.value > 0 ? 3 : 0,
                backgroundColor: d.color || "#6366f1",
                opacity: d.value === 0 ? 0.15 : 1,
              }}
            />
          </div>
          <span className="text-[9px] text-zinc-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Sparkline ───────────────────────────────────────── */
function Sparkline({ values, color = "#6366f1" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const width = 80;
  const height = 28;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
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

  /* ── Derived statistics ──────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = claims.length;
    const investigating = claims.filter((c) => c.status === "investigating").length;
    const approved = claims.filter((c) => c.status === "approved").length;
    const partial = claims.filter((c) => c.status === "partial_approved").length;
    const denied = claims.filter((c) => c.status === "denied").length;
    const resolved = approved + partial + denied;
    const highRisk = claims.filter((c) => c.risk_level === "HIGH").length;
    const mediumRisk = claims.filter((c) => c.risk_level === "MEDIUM").length;
    const lowRisk = claims.filter((c) => c.risk_level === "LOW").length;

    const totalSettlement = claims.reduce((s, c) => s + (c.settlement_amount || 0), 0);
    const totalClaimed = claims.reduce((s, c) => s + (c.claim_amount || 0), 0);
    const approvalRate = resolved > 0 ? Math.round(((approved + partial) / resolved) * 100) : 0;
    const avgSettlement =
      (approved + partial) > 0
        ? Math.round(totalSettlement / (approved + partial))
        : 0;

    // Claims per day — last 7 days
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });
    const dailyClaims = days.map((d) => {
      const dateStr = d.toISOString().split("T")[0];
      return {
        label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
        value: claims.filter((c) => c.created_at?.startsWith(dateStr)).length,
      };
    });

    return {
      total,
      investigating,
      approved,
      partial,
      denied,
      resolved,
      highRisk,
      mediumRisk,
      lowRisk,
      totalSettlement,
      totalClaimed,
      approvalRate,
      avgSettlement,
      dailyClaims,
    };
  }, [claims]);

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
      case "denied": return <XCircle className="w-4 h-4 text-red-500" />;
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

  const FREE_LIMIT = 10;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const donutSegments = [
    { value: stats.approved, color: "#22c55e", label: "Approved" },
    { value: stats.partial, color: "#f59e0b", label: "Partial" },
    { value: stats.denied, color: "#ef4444", label: "Denied" },
    { value: stats.investigating, color: "#3b82f6", label: "In Progress" },
  ];

  const sparkValues = stats.dailyClaims.map((d) => d.value);

  return (
    <div className="space-y-6">
      {/* ── Row 1: Summary KPIs ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <Sparkline values={sparkValues} color="#3b82f6" />
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            {stats.total}
            <span className="text-sm font-normal text-zinc-400">/{FREE_LIMIT}</span>
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Total Claims</p>
        </div>

        {/* Approval Rate */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stats.approvalRate >= 70 ? "bg-green-50 text-green-700" : stats.approvalRate >= 40 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
              {stats.resolved > 0 ? (stats.approvalRate >= 70 ? "↑ Good" : stats.approvalRate >= 40 ? "~ Fair" : "↓ Low") : "—"}
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.approvalRate}%</p>
          <p className="text-xs text-zinc-500 mt-0.5">Approval Rate</p>
        </div>

        {/* Avg Settlement */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-purple-100">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            ${stats.avgSettlement > 0 ? stats.avgSettlement.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Avg Settlement</p>
        </div>

        {/* High Risk */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            {stats.highRisk > 0 && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-medium animate-pulse">
                ● Active
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.highRisk}</p>
          <p className="text-xs text-zinc-500 mt-0.5">High Risk Claims</p>
        </div>
      </div>

      {/* ── Row 2: Charts ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Outcome Donut */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" /> Claim Outcomes
          </h3>
          <div className="flex items-center gap-6">
            <DonutChart segments={donutSegments} />
            <div className="space-y-2 flex-1">
              {[
                { label: "Approved", value: stats.approved, color: "#22c55e" },
                { label: "Partial", value: stats.partial, color: "#f59e0b" },
                { label: "Denied", value: stats.denied, color: "#ef4444" },
                { label: "In Progress", value: stats.investigating, color: "#3b82f6" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-600">{item.label}</span>
                  </div>
                  <span className="font-semibold text-zinc-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Activity Bar Chart */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-500" /> Claims This Week
          </h3>
          <p className="text-xs text-zinc-400 mb-4">Claims submitted per day</p>
          <MiniBarChart
            data={stats.dailyClaims.map((d) => ({ ...d, color: "#6366f1" }))}
          />
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Total: <span className="font-semibold text-zinc-800">{stats.total}</span></span>
            <span>This week: <span className="font-semibold text-zinc-800">{stats.dailyClaims.reduce((s, d) => s + d.value, 0)}</span></span>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-zinc-500" /> Risk Distribution
          </h3>
          <div className="space-y-3">
            {[
              { label: "LOW", value: stats.lowRisk, color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" },
              { label: "MEDIUM", value: stats.mediumRisk, color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" },
              { label: "HIGH", value: stats.highRisk, color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
            ].map((r) => {
              const pct = stats.total > 0 ? Math.round((r.value / stats.total) * 100) : 0;
              return (
                <div key={r.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.bgColor} ${r.textColor}`}>{r.label}</span>
                    <span className="text-xs text-zinc-500">{r.value} claims ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${r.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial summary */}
          <div className="mt-4 pt-4 border-t border-zinc-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Total Claimed</span>
              <span className="font-semibold text-zinc-800">${stats.totalClaimed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Total Settled</span>
              <span className="font-semibold text-green-700">${stats.totalSettlement.toLocaleString()}</span>
            </div>
            {stats.totalClaimed > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Payout Ratio</span>
                <span className="font-semibold text-zinc-800">
                  {Math.round((stats.totalSettlement / stats.totalClaimed) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent Claims ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">Recent Claims</h2>
          <Link
            href="/dashboard/claims"
            className="text-sm text-blue-600 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {claims.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200">
            <FileText className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-500">
              No claims yet.{" "}
              <Link href="/dashboard/claims/new" className="text-blue-600 font-medium hover:text-purple-600">
                Submit one →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claims.slice(0, 6).map((claim) => (
              <Link
                key={claim.id}
                href={`/dashboard/claims/${claim.room_id}`}
                className="block p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(claim.status)}
                    <span className="text-sm font-medium text-zinc-700">
                      {getStatusLabel(claim.status)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRiskBadge(claim.risk_level)}`}>
                    {claim.risk_level || "—"}
                  </span>
                </div>

                {/* Claim Info */}
                <p className="font-semibold text-zinc-900">{claim.claim_id}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{claim.policyholder}</p>
                {claim.incident_type && (
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200/50 text-zinc-600 font-medium">
                    {claim.incident_type}
                  </span>
                )}

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
                    <DollarSign className={`w-3.5 h-3.5 ${claim.status === "denied" ? "text-zinc-300" : claim.resolved_at ? "text-green-500" : "text-zinc-300"}`} />
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
