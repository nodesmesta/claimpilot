"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, ChevronLeft, X } from "lucide-react";
import { getOnboarding, setOnboarding } from "@/app/lib/onboarding";

type StepDef = {
  title: string;
  description: string;
  target?: string;
  placement?: "bottom" | "top" | "right" | "left";
};

const STEPS: StepDef[] = [
  {
    title: "Welcome to ClaimPilot",
    description:
      "Your adjuster dashboard for managing insurance claims. Let's take a quick tour so you know where everything is.",
  },
  {
    title: "Key Metrics at a Glance",
    description: "Six KPI cards show totals, approval rate, settlement averages, resolution time, and high-risk alerts. Hover any card for deeper breakdowns.",
    target: "tour-kpi",
    placement: "bottom",
  },
  {
    title: "Charts & Analytics",
    description: "Visualize outcomes, weekly trends, incident types, risk distribution, and financial overview — even with no data yet, you'll see where everything lives.",
    target: "tour-charts",
    placement: "top",
  },
  {
    title: "Evidence Quality",
    description: "Track documentation completeness — police reports, witness statements, photos, and filing delays — to spot weak claims early.",
    target: "tour-evidence",
    placement: "top",
  },
  {
    title: "Claims & Export",
    description: "Sort claims by urgency, date, or amount. Aging indicators highlight overdue items. Export data as CSV with one click using the Download button.",
    target: "tour-claims",
    placement: "top",
  },
];

export default function DashboardTour() {
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const s = STEPS[step];
    if (!s.target) { setPos(null); return; }
    const el = document.querySelector(`[data-tour="${s.target}"]`);
    if (!el) { setPos(null); return; }
    const r = el.getBoundingClientRect();
    setPos({ top: r.top, left: r.left, width: r.width, height: r.height });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  useEffect(() => {
    const stage = getOnboarding();
    if (stage === "dashboard") {
      const timer = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => {
          setEntering(true);
          document.body.style.overflow = "hidden";
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => measure());
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [visible, step, measure]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setStep(0);
      setEntering(false);
      setTimeout(() => {
        setVisible(false);
        setDone(true);
        document.body.style.overflow = "";
        requestAnimationFrame(() => setEntering(true));
      }, 200);
    }
  }, [step]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const dismiss = useCallback(() => {
    setOnboarding("completed");
    setEntering(false);
    document.body.style.overflow = "";
    setTimeout(() => setVisible(false), 200);
  }, []);

  const complete = useCallback(() => {
    setOnboarding("assets");
    setStep(0);
    setEntering(false);
    document.body.style.overflow = "";
    setTimeout(() => {
      setVisible(false);
      setDone(true);
      requestAnimationFrame(() => setEntering(true));
    }, 200);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dismiss, next, prev]);

  if (!visible && !done) return null;

  const s = STEPS[step];

  return (
    <>
      {/* Dark overlay with spotlight */}
      {visible && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-500"
          style={{ opacity: entering ? 1 : 0 }}
        >
          {/* Spotlight cutout using box-shadow */}
          {pos && s.target && (
            <div
              className="absolute rounded-xl border-2 border-white/60 animate-pulse"
              style={{
                left: pos.left - 6,
                top: pos.top - 6,
                width: pos.width + 12,
                height: pos.height + 12,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)",
                borderRadius: "16px",
              }}
            />
          )}
        </div>
      )}

      {/* Done card */}
      {done && entering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-500">
          <div className="relative w-full max-w-md mx-4 bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-2xl overflow-hidden transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">You&apos;re all set!</h3>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                Now let&apos;s upload your first asset — a policy document or vehicle registration.
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => { setDone(false); }}
                  className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors rounded-xl hover:bg-white/60"
                >
                  Later
                </button>
                <Link
                  href="/dashboard/assets"
                  onClick={() => setOnboarding("assets")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                >
                  Upload Asset <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating tooltip */}
      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 transition-all duration-500"
          style={{
            opacity: entering ? 1 : 0,
            ...(s.target && pos
              ? s.placement === "bottom"
                ? { top: pos.top + pos.height + 20, left: Math.max(16, Math.min(pos.left + pos.width / 2 - 200, window.innerWidth - 416)) }
                : s.placement === "top"
                ? { top: Math.max(16, pos.top - 200), left: Math.max(16, Math.min(pos.left + pos.width / 2 - 200, window.innerWidth - 416)) }
                : { top: pos.top + pos.height / 2 - 80, left: pos.left + pos.width + 20 }
              : { top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "100%", maxWidth: "420px" }
            ),
          }}
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl p-5 min-w-[360px] max-w-[400px]">
            {/* Step indicator */}
            {s.target && (
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {step}
                </span>
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                  Step {step} of {STEPS.length - 1}
                </span>
              </div>
            )}

            {/* Content */}
            <h4 className="text-base font-bold text-zinc-900">{s.title}</h4>
            <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">{s.description}</p>

            {/* Actions */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-100">
              <button
                onClick={dismiss}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  {step < STEPS.length - 1 ? (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  ) : (
                    "Got it"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
