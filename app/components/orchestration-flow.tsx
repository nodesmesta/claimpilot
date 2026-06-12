"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { DotDistortion } from "./dot-distortion";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { label: "Claim Submission", color: "#3b82f6", description: "User submits a claim. Claim Reviewer extracts facts and classifies risk level automatically." },
  { label: "Investigation", color: "#ef4444", description: "Fraud Investigator is recruited on-demand. Analyzes patterns with clarification loops." },
  { label: "Judgment", color: "#8b5cf6", description: "Senior Adjuster reviews all evidence and produces a structured final decision." },
  { label: "Resolution", color: "#22c55e", description: "Settlement executed — policyholder notified, payment processed, case archived." },
];

export function OrchestrationFlow() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".orch-step");
      const slides = gsap.utils.toArray<HTMLElement>(".orch-slide");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=" + items.length * 80 + "%",
          pin: true,
          scrub: true,
        },
      });

      gsap.set(fillRef.current, { scaleY: 1 / items.length, transformOrigin: "top left" });
      gsap.set(items[0], { color: steps[0].color, opacity: 1 });
      gsap.set(slides[0], { autoAlpha: 1 });

      items.forEach((item, i) => {
        if (i > 0) {
          // Outgoing: quick blur+fade out in first 10% of transition
          tl.to(slides[i - 1], { autoAlpha: 0, filter: "blur(6px)", scale: 0.97, duration: 0.08 }, 0.5 * i)
            .to(items[i - 1], { color: "#a1a1aa", opacity: 0.4, duration: 0.08 }, "<")
            // Incoming: appear sharp immediately after
            .fromTo(slides[i],
              { autoAlpha: 0, filter: "blur(6px)", scale: 0.97 },
              { autoAlpha: 1, filter: "blur(0px)", scale: 1, duration: 0.08 },
              0.5 * i + 0.08
            )
            .to(item, { color: steps[i].color, opacity: 1, duration: 0.08 }, "<");
        }
      });

      tl.to(fillRef.current, { scaleY: 1, transformOrigin: "top left", ease: "none", duration: tl.duration() }, 0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="orchestration" className="relative min-h-screen flex items-center bg-white">
      {/* Dot pattern background - interactive */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50" />
        <div className="absolute top-[20%] left-[5%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-purple-100/30 rounded-full blur-[100px]" />
      </div>
      <DotDistortion />
      <div className="max-w-7xl mx-auto px-6 w-full py-20 relative z-10">

        {/* Section header - centered */}
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-zinc-500 border border-zinc-200 rounded-full px-3 py-1 w-fit mx-auto mb-4">Orchestration</p>
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 leading-tight mb-4">
            AI agents investigating claims.
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Multi-agent coordination over the Band platform — dynamic recruitment, clarification loops, and structured decisions with full audit trail.
          </p>
        </div>

        <div className="flex gap-12 lg:gap-20 items-start">

          {/* Left: Steps + per-slide description */}
          <div className="flex-shrink-0 w-[280px] md:w-[320px]">
            <div className="relative">
              <div className="absolute left-0 top-0 w-[2px] h-full bg-zinc-100 rounded-full overflow-hidden">
                <div ref={fillRef} className="w-full h-full bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 rounded-full origin-top" />
              </div>
              <div className="pl-5 space-y-6">
                {steps.map((step, i) => (
                  <div key={i} className="orch-step text-zinc-300 opacity-40">
                    <p className="text-sm font-bold">{step.label}</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Flow diagrams */}
          <div className="flex-1 relative min-h-[520px] flex items-start justify-center pt-2">

            {/* SLIDE 1: Claim Submission
                 Flow: Submit → Reviewer → Risk Check → (Auto-Approve | Recruit)
            */}
            <div className="orch-slide absolute inset-0 flex items-center justify-center invisible opacity-0">
              <div className="flex flex-col items-center gap-3 w-full max-w-[340px]">
                <FlowCard accent="blue" badge="Trigger">
                  <p className="font-semibold text-zinc-800 text-sm">Claim Submitted</p>
                  <p className="text-xs text-zinc-500 mt-0.5">User sends claim to the room</p>
                </FlowCard>
                <Connector />
                <FlowCard accent="blue" badge="Processing">
                  <p className="font-semibold text-zinc-800 text-sm">Claim Reviewer</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Extract facts, classify risk level</p>
                </FlowCard>
                <Connector />
                <FlowCard accent="amber" badge="Decision">
                  <p className="font-semibold text-zinc-800 text-sm">Risk Assessment</p>
                  <p className="text-xs text-zinc-500 mt-0.5">LOW / MEDIUM / HIGH classification</p>
                </FlowCard>
                <ConnectorFork />
                <div className="flex gap-4 w-full">
                  <FlowCard accent="green" badge="Completed" className="flex-1">
                    <p className="font-semibold text-zinc-800 text-sm">Auto-Approve</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Low risk → instant</p>
                  </FlowCard>
                  <FlowCard accent="red" className="flex-1">
                    <p className="font-semibold text-zinc-800 text-sm">Recruit Specialist</p>
                    <p className="text-xs text-zinc-500 mt-0.5">HIGH → Fraud Inv.</p>
                  </FlowCard>
                </div>
              </div>
            </div>

            {/* SLIDE 2: Investigation
                 Flow: Fraud Investigator (with clarification loop as side-branch)
                       → Verdict → (Approve | Escalate)
                 The clarification is a LOOP back into the same investigator, not a separate step.
            */}
            <div className="orch-slide absolute inset-0 flex items-center justify-center invisible opacity-0">
              <div className="flex flex-col items-center gap-3 w-full max-w-[340px]">
                {/* Fraud Investigator with side clarification loop */}
                <div className="flex items-stretch gap-4 w-full">
                  <FlowCard accent="red" badge="Active" className="flex-1">
                    <p className="font-semibold text-zinc-800 text-sm">Fraud Investigator</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Pattern analysis &amp; cross-reference</p>
                  </FlowCard>
                  {/* Clarification side-loop */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative border-2 border-dashed border-amber-400 rounded-xl px-3 py-2 text-center">
                      <span className="absolute -top-2 left-2 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 rounded-full">loop</span>
                      <p className="text-xs font-medium text-amber-700">Clarification</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">↔ Claim Reviewer</p>
                    </div>
                  </div>
                </div>
                <Connector />
                <FlowCard accent="red" badge="Processing">
                  <p className="font-semibold text-zinc-800 text-sm">Analysis Complete</p>
                  <p className="text-xs text-zinc-500 mt-0.5">All evidence gathered &amp; analyzed</p>
                </FlowCard>
                <Connector />
                <FlowCard accent="red" badge="Decision">
                  <p className="font-semibold text-zinc-800 text-sm">Fraud Verdict</p>
                  <p className="text-xs text-zinc-500 mt-0.5">CLEAN or SUSPICIOUS determination</p>
                </FlowCard>
                <ConnectorFork />
                <div className="flex gap-4 w-full">
                  <FlowCard accent="green" badge="Completed" className="flex-1">
                    <p className="font-semibold text-zinc-800 text-sm">Approve</p>
                    <p className="text-xs text-zinc-500 mt-0.5">CLEAN → done</p>
                  </FlowCard>
                  <FlowCard accent="purple" className="flex-1">
                    <p className="font-semibold text-zinc-800 text-sm">Escalate</p>
                    <p className="text-xs text-zinc-500 mt-0.5">→ Senior Adjuster</p>
                  </FlowCard>
                </div>
              </div>
            </div>

            {/* SLIDE 3: Judgment
                 Flow: Senior Adjuster → Structured Decision → Final Outcome → (APPROVED | PARTIAL | DENIED)
            */}
            <div className="orch-slide absolute inset-0 flex items-center justify-center invisible opacity-0">
              <div className="flex flex-col items-center gap-3 w-full max-w-[340px]">
                <FlowCard accent="purple" badge="Active">
                  <p className="font-semibold text-zinc-800 text-sm">Senior Adjuster</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Reviews all findings and evidence</p>
                </FlowCard>
                <Connector color="purple" />
                <FlowCard accent="purple" badge="Processing">
                  <p className="font-semibold text-zinc-800 text-sm">Structured Decision</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Settlement amount, confidence score, reasoning</p>
                </FlowCard>
                <Connector color="purple" />
                <FlowCard accent="purple" badge="Decision">
                  <p className="font-semibold text-zinc-800 text-sm">Final Outcome</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Based on evidence, policy, and compliance</p>
                </FlowCard>
                <ConnectorTriple />
                <div className="flex gap-3 w-full">
                  <div className="flex-1 text-center px-3 py-3 rounded-xl border border-green-300 bg-green-50/50 shadow-sm">
                    <p className="font-bold text-green-600 text-sm">APPROVED</p>
                    <p className="text-[10px] text-green-500 mt-0.5">Full payout</p>
                  </div>
                  <div className="flex-1 text-center px-3 py-3 rounded-xl border border-amber-300 bg-amber-50/50 shadow-sm">
                    <p className="font-bold text-amber-600 text-sm">PARTIAL</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">Reduced</p>
                  </div>
                  <div className="flex-1 text-center px-3 py-3 rounded-xl border border-red-300 bg-red-50/50 shadow-sm">
                    <p className="font-bold text-red-600 text-sm">DENIED</p>
                    <p className="text-[10px] text-red-500 mt-0.5">Rejected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 4: Resolution
                 Flow: All paths converge → Settlement Actions (notify, pay, close) → Audit & Compliance
            */}
            <div className="orch-slide absolute inset-0 flex items-center justify-center invisible opacity-0">
              <div className="flex flex-col items-center gap-3 w-full max-w-[340px]">
                {/* Converging sources */}
                <div className="flex gap-3 w-full">
                  <div className="flex-1 text-center px-3 py-2.5 rounded-xl border border-green-300 bg-green-50/50 shadow-sm">
                    <p className="font-semibold text-green-700 text-xs">Auto-Approved</p>
                  </div>
                  <div className="flex-1 text-center px-3 py-2.5 rounded-xl border border-green-300 bg-green-50/50 shadow-sm">
                    <p className="font-semibold text-green-700 text-xs">Cleared</p>
                  </div>
                  <div className="flex-1 text-center px-3 py-2.5 rounded-xl border border-purple-300 bg-purple-50/50 shadow-sm">
                    <p className="font-semibold text-purple-700 text-xs">Adjudicated</p>
                  </div>
                </div>
                <ConnectorMerge />
                {/* Settlement actions - parallel execution */}
                <FlowCard accent="green" badge="Active">
                  <p className="font-semibold text-zinc-800 text-sm">Settlement Execution</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Trigger resolution actions in parallel</p>
                </FlowCard>
                <ConnectorTripleDown />
                <div className="flex gap-3 w-full">
                  <div className="flex-1 px-3 py-3 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm text-center">
                    <p className="font-semibold text-zinc-800 text-xs">Notify</p>
                    <p className="text-[10px] text-zinc-500">Email + letter</p>
                  </div>
                  <div className="flex-1 px-3 py-3 rounded-xl border border-green-200 bg-green-50/30 shadow-sm text-center">
                    <p className="font-semibold text-zinc-800 text-xs">Payment</p>
                    <p className="text-[10px] text-zinc-500">Wire transfer</p>
                  </div>
                  <div className="flex-1 px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50/30 shadow-sm text-center">
                    <p className="font-semibold text-zinc-800 text-xs">Close Case</p>
                    <p className="text-[10px] text-zinc-500">Archive &amp; seal</p>
                  </div>
                </div>
                <Connector />
                <FlowCard accent="zinc" badge="Completed">
                  <p className="font-semibold text-zinc-800 text-sm">Audit Trail &amp; Compliance</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Full record sealed — ready for regulators</p>
                </FlowCard>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Sub-components --- */

function FlowCard({ accent, badge, className, children }: {
  accent: string; badge?: string; className?: string; children: React.ReactNode;
}) {
  const borderColor: Record<string, string> = {
    blue: "border-blue-300",
    red: "border-red-300",
    green: "border-green-300",
    purple: "border-purple-300",
    amber: "border-amber-300",
    zinc: "border-zinc-300",
  };

  const badgeColor: Record<string, string> = {
    Trigger: "text-blue-600 bg-blue-50",
    Processing: "text-blue-600 bg-blue-50",
    Active: "text-green-600 bg-green-50",
    Completed: "text-green-600 bg-green-50",
    Decision: "text-amber-600 bg-amber-50",
    Loop: "text-amber-600 bg-amber-50",
  };

  return (
    <div className={`relative w-full px-5 py-4 rounded-xl border bg-white shadow-sm ${borderColor[accent] || "border-zinc-300"} ${className || ""}`}>
      {badge && (
        <span className={`absolute -top-2.5 left-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badgeColor[badge] || "text-zinc-500 bg-zinc-50"}`}>
          {badge}
        </span>
      )}
      {children}
    </div>
  );
}

function Connector({ color = "green" }: { color?: string }) {
  const c = color === "purple" ? "#a78bfa" : "#34d399";
  return (
    <div className="flex flex-col items-center py-0.5">
      <div className="w-0.5 h-5 rounded-full" style={{ backgroundColor: c }} />
      <div className="w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: c }} />
      <div className="w-0.5 h-2 rounded-full" style={{ backgroundColor: c }} />
    </div>
  );
}

function ConnectorFork() {
  return (
    <div className="w-full flex items-center justify-center py-0.5">
      <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
        <line x1="100" y1="0" x2="50" y2="28" stroke="#34d399" strokeWidth="2" />
        <line x1="100" y1="0" x2="150" y2="28" stroke="#34d399" strokeWidth="2" />
        <circle cx="100" cy="3" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
        <circle cx="50" cy="25" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
        <circle cx="150" cy="25" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
      </svg>
    </div>
  );
}

function ConnectorTriple() {
  return (
    <div className="w-full flex items-center justify-center py-0.5">
      <svg width="240" height="28" viewBox="0 0 240 28" fill="none">
        <line x1="120" y1="0" x2="40" y2="28" stroke="#34d399" strokeWidth="2" />
        <line x1="120" y1="0" x2="120" y2="28" stroke="#fbbf24" strokeWidth="2" />
        <line x1="120" y1="0" x2="200" y2="28" stroke="#f87171" strokeWidth="2" />
        <circle cx="120" cy="3" r="3" fill="white" stroke="#a78bfa" strokeWidth="2" />
        <circle cx="40" cy="25" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
        <circle cx="120" cy="25" r="3" fill="white" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="200" cy="25" r="3" fill="white" stroke="#f87171" strokeWidth="2" />
      </svg>
    </div>
  );
}

function ConnectorMerge() {
  return (
    <div className="w-full flex items-center justify-center py-0.5">
      <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
        <line x1="33" y1="0" x2="100" y2="28" stroke="#34d399" strokeWidth="2" />
        <line x1="100" y1="0" x2="100" y2="28" stroke="#34d399" strokeWidth="2" />
        <line x1="167" y1="0" x2="100" y2="28" stroke="#a78bfa" strokeWidth="2" />
        <circle cx="33" cy="3" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
        <circle cx="100" cy="3" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
        <circle cx="167" cy="3" r="3" fill="white" stroke="#a78bfa" strokeWidth="2" />
        <circle cx="100" cy="25" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
      </svg>
    </div>
  );
}

function ConnectorTripleDown() {
  return (
    <div className="w-full flex items-center justify-center py-0.5">
      <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
        <line x1="100" y1="0" x2="33" y2="28" stroke="#3b82f6" strokeWidth="2" />
        <line x1="100" y1="0" x2="100" y2="28" stroke="#34d399" strokeWidth="2" />
        <line x1="100" y1="0" x2="167" y2="28" stroke="#71717a" strokeWidth="2" />
        <circle cx="100" cy="3" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
        <circle cx="33" cy="25" r="3" fill="white" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="100" cy="25" r="3" fill="white" stroke="#34d399" strokeWidth="2" />
        <circle cx="167" cy="25" r="3" fill="white" stroke="#71717a" strokeWidth="2" />
      </svg>
    </div>
  );
}
