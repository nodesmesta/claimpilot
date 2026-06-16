"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import OnboardingBanner from "../../onboarding-banner";
import { setOnboarding } from "@/app/lib/onboarding";

export default function NewClaimPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"pdf" | "form">("pdf");

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/claims", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOnboarding("completed");
      router.push(`/dashboard/claims/${data.room_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const claimData = {
      claim_id: `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      policyholder: form.get("policyholder"),
      policy_type: form.get("policy_type"),
      incident_type: form.get("incident_type"),
      description: form.get("description"),
      claim_amount: Number(form.get("claim_amount")),
      location: form.get("location"),
      incident_date: form.get("incident_date"),
      filing_date: new Date().toISOString().split("T")[0],
      witnesses: Number(form.get("witnesses") || 0),
      photos_submitted: Number(form.get("photos") || 0),
      prior_claims_12mo: Number(form.get("prior_claims") || 0),
      police_report: form.get("police_report") === "on",
      medical_claim: form.get("medical_claim") === "on",
    };
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOnboarding("completed");
      router.push(`/dashboard/claims/${data.room_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="max-w-4xl mx-auto">
      <OnboardingBanner target="claims" isEmpty={false} />
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-200">
          <h1 className="text-2xl font-bold text-zinc-900">Submit New Claim</h1>
          <p className="text-zinc-500 mt-1">Upload a claim PDF or fill the form manually</p>
        </div>

        {/* Mode toggle */}
        <div className="px-8 pt-6 flex gap-2">
          <button onClick={() => setMode("pdf")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "pdf" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            Upload PDF
          </button>
          <button onClick={() => setMode("form")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "form" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            Manual Form
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {mode === "pdf" ? (
            <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center hover:border-blue-300 transition">
              <Upload className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-700 font-medium mb-2">Drop your claim PDF here or click to browse</p>
              <p className="text-sm text-zinc-400 mb-6">System will extract claim details automatically</p>
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium cursor-pointer hover:opacity-90 transition shadow-lg shadow-blue-500/20">
                {loading ? "Processing..." : "Select PDF"}
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" disabled={loading} />
              </label>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Policyholder Name</label>
                  <input name="policyholder" required placeholder="John Doe" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Policy Type</label>
                  <select name="policy_type" required className={inputCls}>
                    <option value="Comprehensive Auto">Comprehensive Auto</option>
                    <option value="Basic Auto">Basic Auto</option>
                    <option value="Home">Home</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Incident Type</label>
                  <input name="incident_type" required placeholder="Vehicle collision" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Incident Date</label>
                  <input name="incident_date" type="date" required className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Description</label>
                <textarea name="description" required placeholder="Describe the incident..." rows={3} className={inputCls} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Claim Amount ($)</label>
                  <input name="claim_amount" type="number" required placeholder="18500" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Location</label>
                  <input name="location" required placeholder="City, State" className={inputCls} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Witnesses</label>
                  <input name="witnesses" type="number" defaultValue={0} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Photos Submitted</label>
                  <input name="photos" type="number" defaultValue={0} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Prior Claims (12mo)</label>
                  <input name="prior_claims" type="number" defaultValue={0} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input name="police_report" type="checkbox" className="w-4 h-4 rounded border-zinc-300" />
                  Police report filed
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input name="medical_claim" type="checkbox" className="w-4 h-4 rounded border-zinc-300" />
                  Includes medical claim
                </label>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition shadow-lg shadow-blue-500/20">
                {loading ? "Submitting..." : "Submit Claim"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
