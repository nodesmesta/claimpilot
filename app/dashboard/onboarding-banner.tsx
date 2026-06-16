"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Send, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { getOnboarding, setOnboarding } from "@/app/lib/onboarding";

interface Props {
  target: "assets" | "claims";
  isEmpty: boolean;
}

export default function OnboardingBanner({ target, isEmpty }: Props) {
  const [stage, setStage] = useState<string | null>(null);

  useEffect(() => {
    setStage(getOnboarding());
  }, []);

  if (!stage) return null;

  // Assets page: show when stage is "assets" and no assets yet
  if (target === "assets" && stage === "assets" && isEmpty) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-100 shrink-0">
            <Upload className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Upload Your First Asset
            </h3>
            <p className="text-sm text-zinc-600 mt-1">
              Upload a policy document or CSV file to register your first asset. Once uploaded,
              you can create a claim against it.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" /> Step 2 of 3
              </span>
              <span className="text-xs text-zinc-400">
                After upload, we'll guide you to create a claim
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/claims/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-white/60 rounded-xl transition-colors shrink-0"
          >
            Skip <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Claims/new page: show when stage is "claims"
  if (target === "claims" && stage === "claims") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-purple-100 shrink-0">
            <Send className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> Submit Your First Claim
            </h3>
            <p className="text-sm text-zinc-600 mt-1">
              Upload a claim PDF or fill the form manually. The system will analyze the claim,
              assess risk, and process it automatically.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" /> Final Step
              </span>
              <span className="text-xs text-zinc-400">
                Your first claim will complete the setup!
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setOnboarding("completed");
              setStage(null);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-white/60 rounded-xl transition-colors shrink-0"
          >
            Dismiss <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
