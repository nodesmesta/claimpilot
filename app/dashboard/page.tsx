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
  TrendingDown,
  Minus,
  Shield,
  Zap,
  XCircle,
  Users,
  Camera,
  ClipboardCheck,
  Download,
  ArrowUpDown,
} from "lucide-react";
import DashboardTour from "./tour";
import { getOnboarding, setOnboarding } from "@/app/lib/onboarding";

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
  incident_date: string | null;
  policy_type: string | null;
  location: string | null;
  witnesses: number;
  photos_submitted: number;
  prior_claims_12mo: number;
  police_report: boolean;
  medical_claim: boolean;
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
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f4f4f5" strokeWidth="2.5" />
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
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f4f4f5" strokeWidth="2.5" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={arc.color}
            strokeWidth="3.2"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
            className="transition-all duration-700 drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">{total}</span>
        <span className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase">TOTAL</span>
      </div>
    </div>
  );
}

/* ── Bar Chart ───────────────────────────────────────── */
function MiniBarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div className="w-full flex items-end relative" style={{ height: "96px" }}>
            {/* Tooltip on hover */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-semibold py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10 border border-zinc-700/50">
              {d.value} {d.value === 1 ? "claim" : "claims"}
            </div>
            <div
              className="w-full rounded-t-md transition-all duration-500 hover:brightness-105"
              style={{
                height: `${(d.value / max) * 96}px`,
                minHeight: d.value > 0 ? 4 : 0,
                background: d.value > 0 ? `linear-gradient(to top, ${d.color || "#6366f1"}dd, ${d.color || "#6366f1"})` : "#e4e4e7",
                opacity: d.value === 0 ? 0.2 : 1,
              }}
            />
          </div>
          <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">{d.label}</span>
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
  
  if (!values || values.length < 2) return null;
  
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2; // pad 2px top/bottom
    return { x, y };
  });
  
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const gradId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#${gradId})`}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [assets, setAssets] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<"urgency" | "newest" | "oldest" | "amount">("urgency");

  useEffect(() => {
    Promise.all([
      fetch("/api/claims").then((r) => r.json()),
      fetch("/api/assets").then((r) => r.json()),
    ]).then(([claimsJson, assetsJson]) => {
      setClaims(claimsJson.data || []);
      setAssets(assetsJson.data || []);
    }).finally(() => setLoading(false));
  }, []);

  // Reset onboarding tour when database is empty (e.g. after reset)
  useEffect(() => {
    if (assets.length === 0) {
      const current = getOnboarding();
      if (current === "completed" || current === "assets") {
        setOnboarding("dashboard");
      }
    }
  }, [assets.length]);

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

    // Average resolution time (hours)
    const resolvedClaims_ = claims.filter((c) => c.resolved_at && c.created_at);
    const totalResolutionMs = resolvedClaims_.reduce((s, c) => {
      return s + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime());
    }, 0);
    const avgResolutionHours = resolvedClaims_.length > 0
      ? Math.round(totalResolutionMs / resolvedClaims_.length / (1000 * 60 * 60))
      : 0;

    // Stalled — claims stuck in investigating for > 1 hour
    const now = Date.now();
    const stalledClaims = claims.filter((c) => {
      if (c.status !== "investigating" || !c.created_at) return false;
      const ageMs = now - new Date(c.created_at).getTime();
      return ageMs > 3600000; // > 1 hour
    });
    const stalledCount = stalledClaims.length;

    // Repeat claimants & evidence quality
    const repeatClaimants = claims.filter((c) => (c.prior_claims_12mo || 0) > 0).length;
    const claimsWithPoliceReport = claims.filter((c) => c.police_report).length;
    const totalClaimsWithData = claims.length || 1;
    const avgWitnesses = +(claims.reduce((s, c) => s + (c.witnesses || 0), 0) / totalClaimsWithData).toFixed(1);
    const avgPhotos = +(claims.reduce((s, c) => s + (c.photos_submitted || 0), 0) / totalClaimsWithData).toFixed(1);

    // Average filing delay (days between incident_date and created_at)
    const claimsWithDates = claims.filter((c) => c.incident_date && c.created_at);
    const totalDelayDays = claimsWithDates.reduce((s, c) => {
      return s + (new Date(c.created_at).getTime() - new Date(c.incident_date!).getTime());
    }, 0);
    const avgFilingDelay = claimsWithDates.length > 0
      ? Math.round(totalDelayDays / claimsWithDates.length / (1000 * 60 * 60 * 24))
      : 0;

    // Incident type breakdown
    const typeMap = new Map<string, number>();
    claims.forEach((c) => {
      const t = c.incident_type || "Unknown";
      typeMap.set(t, (typeMap.get(t) || 0) + 1);
    });
    const incidentTypeBreakdown = Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));

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
        label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 3),
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
      avgResolutionHours,
      stalledCount,
      stalledClaims,
      repeatClaimants,
      claimsWithPoliceReport,
      avgWitnesses,
      avgPhotos,
      avgFilingDelay,
      incidentTypeBreakdown,
      dailyClaims,
    };
  }, [claims]);

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case "LOW": return "bg-green-50/80 text-green-700 border border-green-200/60";
      case "MEDIUM": return "bg-amber-50/80 text-amber-700 border border-amber-200/60";
      case "HIGH": return "bg-red-50/80 text-red-700 border border-red-200/60";
      default: return "bg-zinc-50/80 text-zinc-500 border border-zinc-200/60";
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
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-zinc-400 font-medium">Dashboard</span>
            <span className="text-xs text-zinc-300">/</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-900 text-white text-xs font-semibold tracking-wide">Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>
          <p className="text-zinc-500 mt-1">Summary of all claims and investigation activity</p>
        </div>
      </div>

      {/* ── Tour ───────────────────────────────────────────────────────── */}
      {!loading && assets.length === 0 && <DashboardTour />}

      {/* ── Row 1: Summary KPIs ────────────────────────────────────────── */}
      <div data-tour="tour-kpi" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group">
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
          <div className="mt-2 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{stats.approved} approved</span>
            <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{stats.denied} denied</span>
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{stats.partial} partial</span>
            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{stats.investigating} active</span>
          </div>
        </div>

        {/* Active Investigations */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            {stats.investigating > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50/80 border border-blue-200/60 px-2.5 py-0.5 rounded-full font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Live
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.investigating}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Active Investigations</p>
          {stats.stalledCount > 0 && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{stats.stalledCount} stalled &gt;1h</span>
            </div>
          )}
        </div>

        {/* Approval Rate */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            {stats.resolved > 0 ? (
              stats.approvalRate >= 70 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50/80 text-green-700 border border-green-200/60 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5" /> Good
                </span>
              ) : stats.approvalRate >= 40 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50/80 text-amber-700 border border-amber-200/60 shadow-sm">
                  <Minus className="w-3.5 h-3.5" /> Fair
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50/80 text-red-700 border border-red-200/60 shadow-sm">
                  <TrendingDown className="w-3.5 h-3.5" /> Low
                </span>
              )
            ) : (
              <span className="text-xs text-zinc-400 font-medium">—</span>
            )}
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.approvalRate}%</p>
          <p className="text-xs text-zinc-500 mt-0.5">Approval Rate</p>
          <div className="mt-2 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{stats.approved} approved</span>
            <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{stats.denied} denied</span>
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{stats.partial} partial</span>
          </div>
        </div>

        {/* Avg Settlement */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-purple-100">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            ${stats.avgSettlement > 0 ? stats.avgSettlement.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Avg Settlement</p>
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
              Total paid: ${stats.totalSettlement.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Resolution Time */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            {stats.avgResolutionHours > 0 ? `${stats.avgResolutionHours}h` : "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Avg Resolution Time</p>
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
              {stats.resolved} resolved claims
            </span>
          </div>
        </div>

        {/* High Risk */}
        <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            {stats.highRisk > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50/80 border border-red-200/60 px-2.5 py-0.5 rounded-full font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Active
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.highRisk}</p>
          <p className="text-xs text-zinc-500 mt-0.5">High Risk Claims</p>
          <div className="mt-2 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{stats.mediumRisk} medium</span>
            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{stats.lowRisk} low</span>
          </div>
        </div>
      </div>

      {/* ── Alert Bar ─────────────────────────────────────────────────── */}
      {(stats.stalledCount > 0 || stats.repeatClaimants > 0 || stats.highRisk > 3) && (
        <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {stats.stalledCount > 0 && (
              <div className="flex items-center justify-between px-5 py-3 hover:bg-red-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{stats.stalledCount} Stalled Investigation{stats.stalledCount > 1 ? "s" : ""}</p>
                    <p className="text-xs text-zinc-500">Claims stuck in investigation for over 1 hour</p>
                  </div>
                </div>
                <a
                  href="/dashboard/claims"
                  className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg bg-red-50/80 border border-red-200/60 hover:bg-red-100/80 transition-colors"
                >
                  Review
                </a>
              </div>
            )}
            {stats.repeatClaimants > 0 && (
              <div className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{stats.repeatClaimants} Repeat Claimant{stats.repeatClaimants > 1 ? "s" : ""} Detected</p>
                    <p className="text-xs text-zinc-500">Claimants with prior claims in the last 12 months</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5 rounded-lg">
                  {stats.repeatClaimants > 0 ? `${Math.round((stats.repeatClaimants / claims.length) * 100)}% of all claims` : ""}
                </span>
              </div>
            )}
            {stats.highRisk > 3 && (
              <div className="flex items-center justify-between px-5 py-3 hover:bg-red-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{stats.highRisk} High-Risk Claims</p>
                    <p className="text-xs text-zinc-500">Claims flagged as high priority</p>
                  </div>
                </div>
                <a
                  href="/dashboard/claims"
                  className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg bg-red-50/80 border border-red-200/60 hover:bg-red-100/80 transition-colors"
                >
                  View All
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 2: Charts ─────────────────────────────────────────────── */}
      <div data-tour="tour-charts" className="grid lg:grid-cols-5 gap-4">
        {/* Outcome Donut */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" /> Claim Outcomes
          </h3>
          <p className="text-xs text-zinc-400 mb-4">Resolution breakdown by status</p>
          <div className="flex items-center gap-3">
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

        {/* Incident Type Breakdown */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-500" /> Incident Types
          </h3>
          <p className="text-xs text-zinc-400 mb-4">Breakdown by incident type</p>
          <div className="space-y-2">
            {stats.incidentTypeBreakdown.length > 0 ? (
              stats.incidentTypeBreakdown.slice(0, 5).map((item) => {
                const pct = Math.round((item.value / stats.total) * 100);
                const colors = ["#6366f1", "#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b"];
                const ci = stats.incidentTypeBreakdown.indexOf(item) % colors.length;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-700 font-medium truncate max-w-[120px]">{item.label}</span>
                      <span className="text-xs text-zinc-500">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: colors[ci] }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400 text-center py-6">No incident type data</p>
            )}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-zinc-500" /> Risk Distribution
          </h3>
          <p className="text-xs text-zinc-400 mb-4">Claims by risk level</p>
          <div className="space-y-3">
            {[
              { label: "LOW", value: stats.lowRisk, color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50/80 border border-green-200/60" },
              { label: "MEDIUM", value: stats.mediumRisk, color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50/80 border border-yellow-200/60" },
              { label: "HIGH", value: stats.highRisk, color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50/80 border border-red-200/60" },
            ].map((r) => {
              const pct = stats.total > 0 ? Math.round((r.value / stats.total) * 100) : 0;
              return (
                <div key={r.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.bgColor} ${r.textColor}`}>{r.label}</span>
                    <span className="text-xs text-zinc-500">{r.value} claims ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r"
                      style={{
                        width: `${pct}%`,
                        background: r.label === "LOW" ? "linear-gradient(to right, #4ade80, #22c55e)" : r.label === "MEDIUM" ? "linear-gradient(to right, #facc15, #eab308)" : "linear-gradient(to right, #f87171, #ef4444)"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-zinc-500" /> Financial Overview
          </h3>
          <p className="text-xs text-zinc-400 mb-4">Claimed vs settled amounts</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50/80 border border-zinc-100">
              <div>
                <p className="text-xs text-zinc-500">Total Claimed</p>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">${stats.totalClaimed.toLocaleString()}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-50/80 border border-zinc-100">
              <div>
                <p className="text-xs text-zinc-500">Total Settled</p>
                <p className="text-lg font-bold text-green-700 mt-0.5">${stats.totalSettlement.toLocaleString()}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
            {stats.totalClaimed > 0 && (
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-100">
                <span className="text-xs font-medium text-zinc-500">Payout Ratio</span>
                <span className="text-xs font-bold text-zinc-800 bg-zinc-100 px-3 py-1 rounded-full">
                  {Math.round((stats.totalSettlement / stats.totalClaimed) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Evidence Quality ───────────────────────────────────── */}
      <div data-tour="tour-evidence">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">Evidence Quality</h2>
          <p className="text-xs text-zinc-400">Documentation completeness across all claims</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Police Report Rate */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-green-100">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">Documentation</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {stats.total > 0 ? Math.round((stats.claimsWithPoliceReport / stats.total) * 100) : 0}%
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Police Report Rate</p>
            <div className="mt-3 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stats.total > 0 ? (stats.claimsWithPoliceReport / stats.total) * 100 : 0}%`,
                  background: `linear-gradient(to right, #4ade80, #22c55e)`,
                }}
              />
            </div>
          </div>

          {/* Avg Witnesses */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">Evidence</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{stats.avgWitnesses}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Avg Witnesses per Claim</p>
            <div className="mt-3 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((stats.avgWitnesses / 5) * 100, 100)}%`,
                  background: `linear-gradient(to right, #6366f1, #8b5cf6)`,
                }}
              />
            </div>
          </div>

          {/* Avg Photos */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-purple-100">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">Evidence</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{stats.avgPhotos}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Avg Photos per Claim</p>
            <div className="mt-3 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((stats.avgPhotos / 10) * 100, 100)}%`,
                  background: `linear-gradient(to right, #a78bfa, #c084fc)`,
                }}
              />
            </div>
          </div>

          {/* Filing Delay */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">Timeliness</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {stats.avgFilingDelay > 0 ? `${stats.avgFilingDelay}d` : "—"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Avg Filing Delay (incident → report)</p>
            <div className="mt-3 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((stats.avgFilingDelay / 30) * 100, 100)}%`,
                  background: stats.avgFilingDelay > 14
                    ? "linear-gradient(to right, #f87171, #ef4444)"
                    : stats.avgFilingDelay > 7
                      ? "linear-gradient(to right, #facc15, #eab308)"
                      : "linear-gradient(to right, #4ade80, #22c55e)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Recent Claims ───────────────────────────────────────── */}
      <div data-tour="tour-claims">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-zinc-900">Recent Claims</h2>
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
              {(["urgency", "newest", "oldest", "amount"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    sortMode === mode
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {mode === "urgency" ? "Urgency" : mode === "newest" ? "Newest" : mode === "oldest" ? "Oldest" : "Amount"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/claims"
              className="text-sm text-blue-600 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                const csv = [
                  ["Claim ID", "Policyholder", "Status", "Risk Level", "Claim Amount", "Settlement", "Incident Type", "Created"],
                  ...claims.map((c) => [
                    c.claim_id,
                    c.policyholder,
                    c.status,
                    c.risk_level,
                    c.claim_amount?.toString() ?? "",
                    c.settlement_amount?.toString() ?? "",
                    c.incident_type ?? "",
                    new Date(c.created_at).toLocaleDateString(),
                  ]),
                ].map((r) => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `claims-export-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-sm text-zinc-500 hover:text-zinc-700 font-medium flex items-center gap-1 transition-colors border border-zinc-200 rounded-lg px-2.5 py-1"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
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
            {[...claims]
              .sort((a, b) => {
                if (sortMode === "newest") {
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                if (sortMode === "oldest") {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                if (sortMode === "amount") {
                  return (b.claim_amount || 0) - (a.claim_amount || 0);
                }
                // urgency (default): HIGH risk first, then stalled investigating, then MEDIUM, oldest
                const riskOrder: Record<string, number> = { "HIGH": 0, "MEDIUM": 1, "LOW": 2 };
                const aRisk = riskOrder[a.risk_level ?? ""] ?? 3;
                const bRisk = riskOrder[b.risk_level ?? ""] ?? 3;
                if (aRisk !== bRisk) return aRisk - bRisk;
                if (a.status === "investigating" && b.status !== "investigating") return -1;
                if (a.status !== "investigating" && b.status === "investigating") return 1;
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              })
              .slice(0, 6).map((claim) => {
                const ageMs = Date.now() - new Date(claim.created_at).getTime();
                const ageHours = Math.floor(ageMs / 3600000);
                const ageLabel = ageHours < 1 ? "< 1h" : ageHours < 24 ? `${ageHours}h` : `${Math.floor(ageHours / 24)}d`;
                const isStalled = claim.status === "investigating" && ageHours >= 1;
                const hasPriorClaims = (claim.prior_claims_12mo || 0) > 0;
                return (
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
                  <div className="flex items-center gap-2">
                    {isStalled && (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50/80 border border-red-200/60 px-1.5 py-0.5 rounded">Stalled</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRiskBadge(claim.risk_level)}`}>
                      {claim.risk_level || "—"}
                    </span>
                  </div>
                </div>

                {/* Claim Info */}
                <p className="font-semibold text-zinc-900">{claim.claim_id}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{claim.policyholder}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {claim.incident_type && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200/50 text-zinc-600 font-medium">
                      {claim.incident_type}
                    </span>
                  )}
                  {hasPriorClaims && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 border border-amber-200/50 text-amber-700 font-medium flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" /> {claim.prior_claims_12mo}x prior
                    </span>
                  )}
                </div>

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
                  {!claim.police_report && claim.status === "investigating" && (
                    <span className="text-[10px] text-red-500 font-medium">No police report</span>
                  )}
                  <span className="text-[10px] text-zinc-400 ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {ageLabel}
                  </span>
                </div>
              </Link>
              );})}
          </div>
        )}
      </div>
    </div>
  );
}
