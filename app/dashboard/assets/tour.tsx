"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, ChevronRight, ChevronLeft, Upload } from "lucide-react";
import { getOnboarding, setOnboarding } from "@/app/lib/onboarding";

type StepDef = {
  title: string;
  description: string;
  target?: string;
  placement?: "bottom" | "top" | "right" | "left";
};

const STEPS: StepDef[] = [
  {
    title: "Your Assets & Policies",
    description:
      "This page stores all your insured assets — policy declarations, vehicle registrations, and coverage documents. Upload a PDF to register your first asset and unlock claim management.",
  },
  {
    title: "Upload a Policy PDF",
    description:
      "Click the Upload PDF button to upload a policy declaration or vehicle registration document. ClaimPilot will parse it and extract policyholder info, coverages, and vehicle details automatically.",
    target: "tour-assets-upload",
    placement: "bottom",
  },
  {
    title: "Asset Cards & Details",
    description:
      "Each uploaded asset becomes a card showing policy holder details, vehicle info, coverage limits, and claims history. Hover to see the full picture. From here you can also delete outdated assets.",
    target: "tour-assets-list",
    placement: "top",
  },
];

export default function AssetsTour() {
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

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
    if (stage === "assets") {
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
      setOnboarding("completed");
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
          className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-500"
          style={{ opacity: entering ? 1 : 0 }}
        >
          {pos && s.target && (
            <div
              className="absolute rounded-xl border-2 border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              style={{
                left: pos.left - 8,
                top: pos.top - 8,
                width: pos.width + 16,
                height: pos.height + 16,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 30px rgba(59,130,246,0.25)",
                borderRadius: "18px",
              }}
            />
          )}
        </div>
      )}

      {/* Floating tooltip */}
      {visible && (
        <div
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
                  {step + 1}
                </span>
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                  Step {step + 1} of {STEPS.length}
                </span>
              </div>
            )}

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
                {step > 0 && (
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
