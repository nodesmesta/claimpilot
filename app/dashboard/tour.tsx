"use client";

import { useState, useEffect, useCallback } from "react";
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
  ArrowRight,
} from "lucide-react";
import { setOnboarding } from "@/app/lib/onboarding";

const STEPS = [
  {
    title: "Welcome to ClaimPilot",
    icon: Sparkles,
    gradient: "from-blue-500 to-indigo-500",
    gradientBg: "from-blue-100 to-indigo-100",
    description:
      "Your adjuster dashboard for managing insurance claims. Let's take a quick tour so you know where everything is.",
  },
  {
    title: "Key Metrics",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-500",
    gradientBg: "from-blue-100 to-cyan-100",
    description:
      "Six KPI cards show your totals at a glance: total claims, active investigations, approval rate, settlement averages, resolution time, and high-risk alerts. Hover any card for deeper breakdown.",
  },
  {
    title: "Alert Bar",
    icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-500",
    gradientBg: "from-amber-100 to-orange-100",
    description:
      "Urgent alerts appear automatically — stalled investigations, repeat claimants, and high-risk clusters that need your immediate attention.",
  },
  {
    title: "Charts & Analytics",
    icon: BarChart3,
    gradient: "from-indigo-500 to-purple-500",
    gradientBg: "from-indigo-100 to-purple-100",
    description:
      "Five chart cards visualize your claims data: outcome breakdown, weekly trends, incident types, risk distribution, and financial overview.",
  },
  {
    title: "Evidence Quality",
    icon: ClipboardCheck,
    gradient: "from-emerald-500 to-green-500",
    gradientBg: "from-emerald-100 to-green-100",
    description:
      "Track documentation completeness across all claims — police report rate, average witnesses, photos submitted, and filing delays.",
  },
  {
    title: "Claims List & Export",
    icon: Clock,
    gradient: "from-violet-500 to-pink-500",
    gradientBg: "from-violet-100 to-pink-100",
    description:
      "Your claims list supports smart sorting by urgency, newest, oldest, or amount. Export any data as CSV with one click.",
  },
];

export default function DashboardTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("claimpilot-onboarding");
    if (!seen) {
      const timer = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setEntering(true));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = useCallback(() => {
    setOnboarding("assets");
    setEntering(false);
    setTimeout(() => {
      setVisible(false);
      setDone(true);
      requestAnimationFrame(() => setEntering(true));
    }, 200);
  }, []);

  const dismiss = useCallback(() => {
    setOnboarding("completed");
    setEntering(false);
    setTimeout(() => setVisible(false), 200);
  }, []);

  const goNext = useCallback(() => {
    if (step === STEPS.length - 1) {
      complete();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, complete]);

  const goBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  // Keyboard handler
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, goNext, goBack, dismiss]);

  if (!visible && !done) return null;

  return (
    <>
      {/* ── Glass Modal ──────────────────────────────────────────────── */}
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Animated backdrop */}
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              entering
                ? "bg-black/60 backdrop-blur-xl"
                : "bg-black/0 backdrop-blur-0"
            }`}
            onClick={dismiss}
          />

          {/* Card */}
          <div
            className={`relative w-full max-w-lg mx-4 transition-all duration-500 ease-out ${
              entering
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-95"
            }`}
          >
            {/* Glass card */}
            <div className="relative rounded-3xl bg-white/80 backdrop-blur-2xl shadow-2xl shadow-black/10 border border-white/40 overflow-hidden">
              {/* Gradient top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

              {/* Step progress - thin line */}
              <div className="absolute top-1 left-0 right-0 h-0.5 bg-zinc-200/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              <div className="p-8 pt-10">
                {/* Close */}
                <button
                  onClick={dismiss}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-white/60 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Icon with gradient glow */}
                <div className="relative mb-6">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${current.gradient} opacity-10 blur-2xl rounded-full`}
                    style={{ width: 72, height: 72 }}
                  />
                  <div
                    className={`relative p-3.5 rounded-2xl bg-gradient-to-br ${current.gradientBg} shadow-inner`}
                  >
                    <Icon className={`w-8 h-8 bg-gradient-to-br ${current.gradient} bg-clip-text text-transparent`} />
                  </div>
                </div>

                {/* Step number */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                    Step {step + 1} of {STEPS.length}
                  </span>
                  <div className="flex gap-1">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-500 ${
                          i === step
                            ? "w-5 h-1.5 bg-zinc-900"
                            : i < step
                              ? "w-1.5 h-1.5 bg-zinc-400"
                              : "w-1.5 h-1.5 bg-zinc-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-zinc-900 mb-3 leading-tight">
                  {current.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {current.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
                  <button
                    onClick={dismiss}
                    className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
                  >
                    Skip tour
                  </button>

                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button
                        onClick={goBack}
                        className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-white/60 rounded-xl transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                    )}

                    <button
                      onClick={goNext}
                      className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all shadow-lg shadow-zinc-900/10"
                    >
                      {isLast ? "Got it" : "Next"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Next step: Upload Asset (glass card) ─────────────────────── */}
      {done && (
        <div
          className={`transition-all duration-500 ease-out ${
            entering
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <div className="relative rounded-2xl bg-white/80 backdrop-blur-xl shadow-sm border border-white/40 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner shrink-0">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Great, you know the dashboard!
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                    Now let's upload your first asset — a policy document or vehicle
                    registration. Then we'll create your first claim.
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <Link
                      href="/dashboard/assets"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all shadow-lg shadow-zinc-900/10"
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
          </div>
        </div>
      )}
    </>
  );
}
