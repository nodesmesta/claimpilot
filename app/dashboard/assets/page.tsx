"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, RefreshCw } from "lucide-react";

interface Asset {
  id: string;
  policyholder: string;
  policy_number: string;
  policy_type: string;
  vehicle_description: string;
  estimated_value: number;
  deductible: number;
  payment_method: string;
  created_at: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchAssets = () => {
    setLoading(true);
    fetch("/api/assets").then(r => r.json()).then(j => setAssets(j.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/assets", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`✓ Asset uploaded: ${data.asset.policyholder} — ${data.asset.policy_number}`);
      fetchAssets();
    } catch (err: unknown) {
      setMsg(`✗ ${err instanceof Error ? err.message : "Upload failed"}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
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
            <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm ${msg.startsWith("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        {loading && assets.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading assets...
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">No assets uploaded yet</p>
            <p className="text-sm text-zinc-400 mt-1">Upload a policy declaration PDF to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-500 text-sm border-b border-zinc-100">
                  <th className="px-6 py-4 font-medium">Policyholder</th>
                  <th className="px-6 py-4 font-medium">Policy #</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Vehicle</th>
                  <th className="px-6 py-4 font-medium">Value</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">{a.policyholder}</td>
                    <td className="px-6 py-4 text-zinc-700 font-mono text-sm">{a.policy_number}</td>
                    <td className="px-6 py-4 text-zinc-600 text-sm">{a.policy_type}</td>
                    <td className="px-6 py-4 text-zinc-600 text-sm">{a.vehicle_description}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">${a.estimated_value?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-zinc-500 text-sm">{a.payment_method}</td>
                    <td className="px-6 py-4">
                      <button onClick={async () => { await fetch(`/api/assets?id=${a.id}`, { method: "DELETE" }); fetchAssets(); }} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
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
