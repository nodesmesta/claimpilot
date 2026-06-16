"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Upload,
  Send,
  ArrowRight,
} from "lucide-react";
import { setOnboarding } from "@/app/lib/onboarding";

const STEPS = [
  {
    title: "Welcome to ClaimPilot",
    icon: Sparkles,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    description:
      "Your adjuster dashboard for managing insurance claims. Let's take a quick tour so you know where everything is.",
  },
  {
    title: "Key Metrics",
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    description:
      "Six KPI cards show your totals at a glance: total claims, active investigations, approval rate, average settlement, resolution time, and high-risk alerts. Hover any card for deeper breakdown.",
  },
  {
    title: "Alert Bar",
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    description:
      "Urgent alerts appear automatically — stalled investigations, repeat claimants, and high-risk clusters that need your attention.",
  },
  {
    title: "Charts & Analytics",
    icon: BarChart3,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    description:
      "Five chart cards visualize your claims data: outcome breakdown, weekly trends, incident types, risk distribution, and financial overview.",
  },
  {
    title: "Evidence Quality",
    icon: ClipboardCheck,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    description:
      "Track documentation completeness across all claims — police report rate, average witnesses, photos submitted, and filing delays.",
  },
  {
    title: "Claims List & Export",
    icon: Clock,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    description:
      "Your claims list supports smart sorting by urgency, newest, oldest, or amount. Export any data as CSV with one click.",
  },
];

export default function DashboardTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("claimpilot-onboarding");
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = () => {
    setOnboarding("assets");
    setDone(true);
    setVisible(false);
  };

  const dismiss = () => {
    setOnboarding("completed");
    setVisible(false);
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  if (!visible && !done) return null;

  return (
    <>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="h-1 w-full bg-zinc-100">
              <div
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="p-8">
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className={`p-3 rounded-2xl ${current.iconBg} w-fit mb-5`}>
                <Icon className={`w-8 h-8 ${current.iconColor}`} />
              </div>

              <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                {current.title}
              </h3>

              <p className="text-sm text-zinc-500 leading-relaxed">
                {current.description}
              </p>

              <div className="flex items-center gap-1.5 mt-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step
                        ? "w-6 bg-zinc-900"
                        : i < step
                          ? "w-1.5 bg-zinc-400"
                          : "w-1.5 bg-zinc-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={dismiss}
                  className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
                >
                  Skip all
                </button>

                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep((s) => s - 1)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (isLast) {
                        complete();
                      } else {
                        setStep((s) => s + 1);
                      }
                    }}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    {isLast ? "Got it" : "Next"}{" "}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Next step: Upload Asset ──────────────────────────────────── */}
      {done && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-100 shrink-0">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-zinc-900">
                Great, you know the dashboard!
              </h3>
              <p className="text-sm text-zinc-600 mt-1">
                Now let's upload your first asset — a policy document or vehicle
                registration. Then we'll create your first claim.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  href="/dashboard/assets"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Upload Asset <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    setOnboarding("completed");
                    setDone(false);
                  }}
                  className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
