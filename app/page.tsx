"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle,
  Shield,
  Zap,
  FileSearch,
  Scale,
  ArrowRight,
  Activity,
  Clock,
  TrendingUp,
  ExternalLink,
  Users,
  Brain,
  Search,
  Check,
} from "lucide-react";
import gsap from "gsap";
import { HeroSection } from "./components/hero-section";
import { OrchestrationFlow } from "./components/orchestration-flow";
import { LogoMarquee } from "./components/logo-marquee";

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<number | null>(null);

  useEffect(() => {
    const elements = document.querySelectorAll(".scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(entry.target, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8 });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: Zap, title: "Dynamic Recruitment", description: "Agents join investigation only when needed — no wasted resources on simple claims." },
    { icon: Shield, title: "Full Audit Trail", description: "Every message, decision, and tool call recorded in Band room for regulatory compliance." },
    { icon: Brain, title: "@Mention Routing", description: "Agents only process messages directed to them, enabling precise coordination." },
    { icon: Clock, title: "Clarification Loops", description: "Fraud Investigator asks Claim Reviewer questions mid-investigation." },
    { icon: TrendingUp, title: "Risk-Based Escalation", description: "Automatic escalation from LOW → MEDIUM → HIGH with specialist recruitment." },
    { icon: Activity, title: "Real-Time Investigation", description: "Watch agents collaborate live with delivery tracking and thinking indicators." },
  ];

  const testimonials = [
    { name: "Sarah Chen", role: "VP Claims, Pacific Insurance", quote: "ClaimPilot reduced our investigation time from 5 days to under 2 minutes. The audit trail alone is worth it." },
    { name: "Marcus Williams", role: "CTO, Southeastern Mutual", quote: "The dynamic recruitment of specialist agents means we only use resources when needed. Brilliant architecture." },
    { name: "Emily Rodriguez", role: "Head of Fraud, Atlas Re", quote: "The clarification loop between agents catches inconsistencies our team used to miss entirely." },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Navbar - Floating Pill */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <div className="flex items-center justify-between px-4 py-2 rounded-full bg-white/55 backdrop-blur-xl border border-zinc-200 shadow-lg shadow-black/5">
          {/* Left: Logo */}
          <Link href="/" className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </Link>

          {/* Center: Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-zinc-500 hover:text-zinc-900 transition text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100">Features</a>
            <a href="#orchestration" className="text-zinc-500 hover:text-zinc-900 transition text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100">Orchestration</a>
            <a href="#pricing" className="text-zinc-500 hover:text-zinc-900 transition text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100">Pricing</a>
            <a href="#faq" className="text-zinc-500 hover:text-zinc-900 transition text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100">FAQs</a>
          </div>

          {/* Right: Dashboard button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:scale-105 transition-transform shadow-lg shadow-blue-500/20 shrink-0"
          >
            Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection />

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Features */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Powerful features to streamline your claims investigation process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="scroll-reveal group p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-zinc-200 hover:border-blue-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">{feature.title}</h3>
                <p className="text-zinc-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Orchestration Flow */}
      <OrchestrationFlow />

      {/* Agents */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Meet the Agents
              </span>
            </h2>
            <p className="text-zinc-500 text-lg">Each uses a different framework, recruited dynamically</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: "Gateway", role: "Secure entry point", framework: "Band Platform", icon: Shield, color: "cyan", features: ["Secure claim submission", "Create Band investigation room", "Link frontend & AI team"] },
              { name: "Claim Reviewer", role: "Always in room", framework: "Band Platform", icon: Users, color: "blue", features: ["Extract facts & classify risk", "Dynamic agent recruitment", "Answer clarification queries"] },
              { name: "Fraud Investigator", role: "Recruited on-demand", framework: "Band Platform", icon: Search, color: "red", features: ["Pattern & anomaly analysis", "Cross-reference fraud indicators", "Clarification loop with Reviewer"] },
              { name: "Senior Adjuster", role: "Recruited on-demand", framework: "Band Platform", icon: Scale, color: "green", features: ["Final decision authority", "Settlement calculation", "Compliance & regulatory check"] },
              { name: "Resolution Agent", role: "Recruited post-decision", framework: "Band Platform", icon: CheckCircle, color: "purple", features: ["Email notification delivery", "Payment processing", "Case closure & audit trail"] },
            ].map((agent, i) => (
              <div
                key={i}
                onClick={() => setActiveAgent(activeAgent === i ? null : i)}
                className={`scroll-reveal cursor-pointer p-8 rounded-2xl bg-white/70 backdrop-blur-sm border transition-all duration-300 hover:-translate-y-2 ${
                  agent.color === "cyan" ? "border-cyan-200 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10" :
                  agent.color === "blue" ? "border-blue-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10" :
                  agent.color === "red" ? "border-red-200 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/10" :
                  agent.color === "purple" ? "border-purple-200 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10" :
                  "border-green-200 hover:border-green-400 hover:shadow-xl hover:shadow-green-500/10"
                } ${activeAgent !== null && activeAgent !== i ? "blur-sm" : ""}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
                    agent.color === "cyan" ? "bg-cyan-500 shadow-cyan-500/20" :
                    agent.color === "blue" ? "bg-blue-500 shadow-blue-500/20" :
                    agent.color === "red" ? "bg-red-500 shadow-red-500/20" :
                    agent.color === "purple" ? "bg-purple-500 shadow-purple-500/20" :
                    "bg-green-500 shadow-green-500/20"
                  }`}>
                    <agent.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-900">{agent.name}</h3>
                    <p className={`text-xs ${
                      agent.color === "cyan" ? "text-cyan-600" :
                      agent.color === "blue" ? "text-blue-600" : agent.color === "red" ? "text-red-600" : agent.color === "purple" ? "text-purple-600" : "text-green-600"
                    }`}>{agent.role}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {agent.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-zinc-600">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${
                        agent.color === "cyan" ? "text-cyan-500" :
                        agent.color === "blue" ? "text-blue-500" : agent.color === "red" ? "text-red-500" : agent.color === "purple" ? "text-purple-500" : "text-green-500"
                      }`} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-100">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    agent.color === "cyan" ? "bg-cyan-50 text-cyan-600" :
                    agent.color === "blue" ? "bg-blue-50 text-blue-600" :
                    agent.color === "red" ? "bg-red-50 text-red-600" :
                    agent.color === "purple" ? "bg-purple-50 text-purple-600" :
                    "bg-green-50 text-green-600"
                  }`}>{agent.framework}</span>
                  <span className="text-xs px-2 py-1 rounded bg-zinc-100 text-zinc-500">AI/ML API</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-zinc-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-12 scroll-reveal">
            Trusted by Industry Leaders
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="scroll-reveal p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                  <div>
                    <p className="font-semibold text-zinc-900">{t.name}</p>
                    <p className="text-sm text-zinc-500">{t.role}</p>
                  </div>
                </div>
                <p className="text-zinc-600 italic">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Simple Pricing</h2>
            <p className="text-zinc-500">Choose the plan that fits your team</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Demo */}
            <div className="scroll-reveal p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Free Demo</h3>
              <p className="text-sm text-zinc-500 mb-4">Try before you commit</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-zinc-900">$0</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">7-day trial</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Up to 10 claims", "All 3 AI agents", "Full audit trail", "Band platform access", "Email support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-medium transition">
                Start Free Trial
              </button>
            </div>

            {/* Single */}
            <div className="scroll-reveal p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Single</h3>
              <p className="text-sm text-zinc-500 mb-4">For individual adjusters</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-zinc-900">$20</span>
                <span className="text-zinc-400 text-sm">/month</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">1 user</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Unlimited claims", "All 3 AI agents", "Full audit trail", "Priority processing", "Email & chat support", "Analytics dashboard"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition">
                Subscribe
              </button>
            </div>

            {/* Small Team */}
            <div className="scroll-reveal p-6 rounded-2xl bg-gradient-to-b from-blue-50 to-purple-50 border border-blue-200 relative shadow-lg shadow-blue-500/5 flex flex-col">
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-[11px] font-semibold text-white">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Small Team</h3>
              <p className="text-sm text-zinc-500 mb-4">Up to 5 members</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-zinc-900">$100</span>
                <span className="text-zinc-400 text-sm">/month</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">Max 5 users</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Everything in Single", "5 team members", "Shared case dashboard", "Role-based access", "Team analytics", "Slack integration", "Priority support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium transition hover:opacity-90 shadow-lg shadow-blue-500/20">
                Get Started
              </button>
            </div>

            {/* Enterprise */}
            <div className="scroll-reveal p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Enterprise</h3>
              <p className="text-sm text-zinc-500 mb-4">For larger teams (5+)</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-zinc-900">Custom</span>
              </div>
              <p className="text-xs text-zinc-400 mb-6">Tailored to your org</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Everything in Small Team", "Unlimited members", "Dedicated account manager", "Custom integrations", "SLA guarantee", "On-premise option", "Compliance consulting"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:sales@claimpilot.ai" className="w-full py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-sm font-medium transition text-center block">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-zinc-500">Got questions? We&apos;ve got answers.</p>
          </div>

          <div className="scroll-reveal space-y-3">
            {[
              { q: "How does AI claims investigation work?", a: "Our system uses 3 specialized AI agents that collaborate through the Band platform. The Claim Reviewer triages and classifies risk, the Fraud Investigator analyzes patterns, and the Senior Adjuster makes the final decision — all with full audit trail." },
              { q: "Is my data secure?", a: "Yes, we use bank-level encryption and are SOC 2 compliant. All claim data is encrypted at rest and in transit. The investigation audit trail provides full transparency for regulatory review." },
              { q: "Can I integrate with my existing systems?", a: "Absolutely! We offer REST API and webhooks for easy integration with your existing claims management system, policy database, and notification infrastructure." },
              { q: "How fast is the investigation?", a: "Most claims are processed in under 2 minutes. Simple claims (LOW risk) are auto-approved in seconds. Complex claims requiring all 3 agents typically complete within 2-3 minutes." },
            ].map((item, i) => (
              <details key={i} className="group bg-white border border-zinc-200 rounded-xl shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-zinc-900 font-medium">
                  {item.q}
                  <span className="text-zinc-400 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="text-zinc-500 px-6 pb-4">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-16 pb-8 bg-zinc-950 text-zinc-400">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">ClaimPilot</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">AI-powered claims investigation platform for the modern insurer.</p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#orchestration" className="hover:text-white transition">Orchestration</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-4">Partners</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://band.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition inline-flex items-center gap-1">Band Platform <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://aimlapi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition inline-flex items-center gap-1">AI/ML API <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://featherless.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition inline-flex items-center gap-1">Featherless AI <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://lablab.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition inline-flex items-center gap-1">LabLab AI <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-200 mb-4">Newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-l-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-r-lg transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-zinc-800 pt-6 text-center text-zinc-600 text-sm">
            © 2026 ClaimPilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
