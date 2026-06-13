"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, RefreshCw } from "lucide-react";

interface Claim {
  id: string;
  claim_id: string;
  room_id: string;
  policyholder: string;
  claim_amount: number;
  risk_level: string | null;
  status: string;
  created_at: string;
  incident_type: string;
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
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "LOW": return "bg-green-50 text-green-700 border border-green-200";
      case "MEDIUM": return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "HIGH": return "bg-red-50 text-red-700 border border-red-200";
      default: return "bg-zinc-50 text-zinc-500 border border-zinc-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600";
      case "denied": return "text-red-600";
      case "investigating": return "text-yellow-600";
      default: return "text-zinc-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Claims</h1>
          <p className="text-zinc-500 mt-1">All submitted insurance claims</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchClaims} className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition">
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/claims/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> New Claim
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        {loading && claims.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading claims...
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">No claims submitted yet</p>
            <Link href="/dashboard/claims/new" className="text-blue-600 hover:text-purple-600 text-sm font-medium mt-2 inline-block">
              Submit your first claim →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-500 text-sm border-b border-zinc-100">
                  <th className="px-6 py-4 font-medium">Claim ID</th>
                  <th className="px-6 py-4 font-medium">Policyholder</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Risk</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">{claim.claim_id}</td>
                    <td className="px-6 py-4 text-zinc-700">{claim.policyholder}</td>
                    <td className="px-6 py-4 text-zinc-600 text-sm">{claim.incident_type}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">${claim.claim_amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(claim.risk_level)}`}>
                        {claim.risk_level || "PENDING"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium capitalize ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-sm">{new Date(claim.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/claims/${claim.room_id}`} className="text-blue-600 hover:text-purple-600 text-sm font-medium transition-colors">
                        View Live
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
