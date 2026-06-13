"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

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

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/claims")
      .then((r) => r.json())
      .then((json) => setClaims(json.data || []))
      .finally(() => setLoading(false));
  }, []);

  const total = claims.length;
  const investigating = claims.filter((c) => c.status === "investigating").length;
  const approved = claims.filter((c) => c.status === "approved").length;
  const highRisk = claims.filter((c) => c.risk_level === "HIGH").length;

  const stats = [
    { title: "Total Claims", value: total, icon: FileText, color: "blue" },
    { title: "Investigating", value: investigating, icon: Clock, color: "yellow" },
    { title: "Approved", value: approved, icon: CheckCircle, color: "green" },
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

      {/* Recent Claims */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Recent Claims</h2>
          <Link href="/dashboard/claims" className="text-sm text-blue-600 hover:text-purple-600 font-medium">View all →</Link>
        </div>
        {claims.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p>No claims yet. <Link href="/dashboard/claims/new" className="text-blue-600 font-medium">Submit one →</Link></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-500 text-sm border-b border-zinc-100">
                  <th className="px-6 py-4 font-medium">Claim ID</th>
                  <th className="px-6 py-4 font-medium">Policyholder</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Risk</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 5).map((claim) => (
                  <tr key={claim.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">{claim.claim_id}</td>
                    <td className="px-6 py-4 text-zinc-700">{claim.policyholder}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">${claim.claim_amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(claim.risk_level)}`}>
                        {claim.risk_level || "PENDING"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium capitalize ${getStatusColor(claim.status)}`}>{claim.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/claims/${claim.room_id}`} className="text-blue-600 hover:text-purple-600 text-sm font-medium">
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
