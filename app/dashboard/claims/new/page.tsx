"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@heroui/react";

export default function NewClaimPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      router.push(`/dashboard/claims/${data.room_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-zinc-900/50 border border-zinc-800">
        <CardHeader className="px-8 py-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold">Submit New Claim</h1>
          <p className="text-zinc-400 mt-1">Fill in the claim details to start investigation</p>
        </CardHeader>
        <CardContent className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Policyholder Name</label>
                <input name="policyholder" required placeholder="John Doe" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Policy Type</label>
                <select name="policy_type" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Comprehensive Auto">Comprehensive Auto</option>
                  <option value="Basic Auto">Basic Auto</option>
                  <option value="Home">Home</option>
                  <option value="Health">Health</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Incident Type</label>
                <input name="incident_type" required placeholder="Vehicle collision" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Incident Date</label>
                <input name="incident_date" type="date" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
              <textarea name="description" required placeholder="Describe the incident..." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Claim Amount ($)</label>
                <input name="claim_amount" type="number" required placeholder="18500" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Location</label>
                <input name="location" required placeholder="City, State" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Witnesses</label>
                <input name="witnesses" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Photos Submitted</label>
                <input name="photos" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Prior Claims (12mo)</label>
                <input name="prior_claims" type="number" defaultValue={0} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input name="police_report" type="checkbox" className="w-4 h-4 rounded" />
                Police report filed
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input name="medical_claim" type="checkbox" className="w-4 h-4 rounded" />
                Includes medical claim
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
            >
              {loading ? "Submitting to Investigation..." : "Submit Claim"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
