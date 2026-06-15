"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, RefreshCw, Mail, DollarSign, Shield, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

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
  incident_type: string;
  recruited_agents: string[] | null;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claims");
      const json = await res.json();
      setClaims(json.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

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
      case "partial_approved": return "Partial";
      case "denied": return "Denied";
      default: return "Investigating";
    }
  };

  const getStatusCardBg = (status: string) => {
    switch (status) {
      case "approved": return "border-green-200 bg-gradient-to-br from-green-50/80 to-white";
      case "partial_approved": return "border-amber-200 bg-gradient-to-br from-amber-50/80 to-white";
      case "denied": return "border-red-200 bg-gradient-to-br from-red-50/80 to-white";
      default: return "border-blue-200 bg-gradient-to-br from-blue-50/50 to-white";
    }
  };

  const isResolved = (status: string) => status !== "investigating";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Claims</h1>
          <p className="text-zinc-500 mt-1">All submitted insurance claims</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchClaims} className="cursor-pointer p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition">
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/claims/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> New Claim
          </Link>
        </div>
      </div>

      {loading && claims.length === 0 ? (
        <div className="p-12 text-center text-zinc-500">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading claims...
        </div>
      ) : claims.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500">No claims submitted yet</p>
          <Link href="/dashboard/claims/new" className="text-blue-600 hover:text-purple-600 text-sm font-medium mt-2 inline-block">
            Submit your first claim →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {claims.map((claim) => (
            <Link key={claim.id} href={`/dashboard/claims/${claim.room_id}`}
              className={`block p-5 rounded-2xl border backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 ${getStatusCardBg(claim.status)}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">{claim.claim_id}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{claim.policyholder}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskBadge(claim.risk_level)}`}>
                  {claim.risk_level || "—"}
                </span>
              </div>

              {/* Amount */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-zinc-900">
                  ${(claim.claim_amount || 0).toLocaleString()}
                </span>
                {claim.settlement_amount != null && claim.settlement_amount !== claim.claim_amount && (
                  <span className="text-sm text-zinc-500">
                    → <span className="font-medium text-green-600">${claim.settlement_amount.toLocaleString()}</span> settled
                  </span>
                )}
              </div>

              {/* Incident Details */}
              <div className="text-xs text-zinc-500 mb-4 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-zinc-100/80 border border-zinc-200/50 font-medium text-zinc-700">{claim.incident_type || "General Claim"}</span>
              </div>

              {/* Status Cards Row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Decision Status */}
                <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/70 border border-zinc-100">
                  {getStatusIcon(claim.status)}
                  <span className="text-xs font-medium text-zinc-700">{getStatusLabel(claim.status)}</span>
                </div>

                {/* Email Status */}
                <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/70 border border-zinc-100">
                  <Mail className={`w-4 h-4 ${isResolved(claim.status) ? "text-green-500" : "text-zinc-300"}`} />
                  <span className="text-xs font-medium text-zinc-700">
                    {isResolved(claim.status) ? "Sent" : "Pending"}
                  </span>
                </div>

                {/* Payment Status */}
                <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/70 border border-zinc-100">
                  <DollarSign className={`w-4 h-4 ${
                    claim.status === "denied" ? "text-zinc-300" :
                    isResolved(claim.status) ? "text-green-500" : "text-zinc-300"
                  }`} />
                  <span className="text-xs font-medium text-zinc-700">
                    {claim.status === "denied" ? "N/A" :
                     isResolved(claim.status) ? "Paid" : "—"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs text-zinc-500">
                    {(claim.recruited_agents || []).length + 1} agent{(claim.recruited_agents || []).length > 0 ? "s" : ""}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(claim.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
