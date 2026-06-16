"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, RefreshCw, Calendar, Shield, CreditCard, Activity, Car, Trash2, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import OnboardingBanner from "../onboarding-banner";
import { setOnboarding } from "@/app/lib/onboarding";

interface Asset {
  id: string;
  policyholder: string;
  policy_number: string;
  policy_type: string;
  vehicle_description: string;
  vin?: string;
  license_plate?: string;
  estimated_value: number;
  deductible: number;
  effective_date?: string;
  expiration_date?: string;
  premium?: string;
  coverage_collision?: string;
  coverage_comprehensive?: string;
  coverage_liability?: string;
  payment_method: string;
  billing_cycle?: string;
  claims_history_total?: number;
  claims_history_12mo?: number;
  created_at: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadLogs, setUploadLogs] = useState<{ text: string; type: "success" | "error" }[]>([]);

  const fetchAssets = () => {
    setLoading(true);
    fetch("/api/assets").then(r => r.json()).then(j => setAssets(j.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadLogs([]);
    const logs: { text: string; type: "success" | "error" }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/assets", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        logs.push({
          text: `Asset uploaded successfully: ${data.asset.policyholder} — ${data.asset.policy_number}`,
          type: "success",
        });
        setOnboarding("claims");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Upload failed";
        logs.push({
          text: errMsg,
          type: "error",
        });
      }
    }
    setUploadLogs(logs);
    setUploading(false);
    e.target.value = "";
    fetchAssets();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-zinc-400 font-medium">Dashboard</span>
            <span className="text-xs text-zinc-300">/</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-900 text-white text-xs font-semibold tracking-wide">Assets</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Assets</h1>
          <p className="text-zinc-500 mt-1">Your insured assets and policy declarations</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAssets} className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition">
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20 cursor-pointer">
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload PDF"}
            <input type="file" accept=".pdf" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <OnboardingBanner target="assets" isEmpty={assets.length === 0} />

      {uploadLogs.length > 0 && (
        <div className="space-y-2">
          {uploadLogs.map((log, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl text-sm flex items-center gap-2.5 border ${
                log.type === "success"
                  ? "bg-green-50/80 text-green-700 border-green-200/60 shadow-sm"
                  : "bg-red-50/80 text-red-700 border-red-200/60 shadow-sm"
              }`}
            >
              {log.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span className="font-medium">{log.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {loading && assets.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 rounded-2xl bg-white/60 border border-zinc-200">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading assets...
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/60 border border-zinc-200">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">No assets uploaded yet</p>
            <p className="text-sm text-zinc-400 mt-1">Upload a policy declaration PDF to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assets.map((a) => (
              <div key={a.id} className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all duration-200 relative group">
                
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-zinc-900 text-lg leading-tight">{a.policyholder}</h3>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">Policy #: {a.policy_number}</p>
                    </div>
                    <button 
                      onClick={async () => { await fetch(`/api/assets?id=${a.id}`, { method: "DELETE" }); fetchAssets(); }} 
                      className="text-zinc-300 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200/50">
                      {a.policy_type || "Auto Insurance"}
                    </span>
                    {a.effective_date && a.expiration_date && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-150 text-zinc-700 border border-zinc-200/50 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        Active: {a.effective_date} to {a.expiration_date}
                      </span>
                    )}
                  </div>

                  {/* Vehicle details */}
                  <div className="p-4 rounded-xl bg-white border border-zinc-100 mb-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-zinc-400" />
                      <span className="font-semibold text-zinc-800 text-sm">{a.vehicle_description || "Insured Asset"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-zinc-100/50 pt-2.5">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">VIN</span>
                        <span className="font-mono text-zinc-700 font-medium">{a.vin || "—"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">License Plate</span>
                        <span className="font-semibold text-zinc-700">{a.license_plate || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Coverages */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                      <span className="text-zinc-400 block text-[10px]">Estimated Value</span>
                      <span className="font-extrabold text-zinc-900 text-base">${a.estimated_value?.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                      <span className="text-zinc-400 block text-[10px]">Deductible Amount</span>
                      <span className="font-bold text-red-600 text-base">${a.deductible?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Coverage Limits */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-xs font-semibold text-zinc-800 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-zinc-400" /> Active Coverage Limits
                    </h4>
                    <div className="p-3 border border-zinc-100 rounded-xl bg-white space-y-1.5 text-xs text-zinc-600">
                      <div className="flex justify-between">
                        <span>Collision</span>
                        <span className="font-medium text-zinc-800">{a.coverage_collision || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comprehensive</span>
                        <span className="font-medium text-zinc-800">{a.coverage_comprehensive || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Liability limit</span>
                        <span className="font-medium text-zinc-800">{a.coverage_liability || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer details */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Claims History:</span>
                    <span className="font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                      Total: {a.claims_history_total ?? 0} (12mo: {a.claims_history_12mo ?? 0})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block text-[10px]">Premium ({a.billing_cycle || "Monthly"})</span>
                    <span className="font-bold text-zinc-800">{a.premium || "—"}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
