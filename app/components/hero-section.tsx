"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { GridDistortion } from "./grid-distortion";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-badge", { opacity: 0, y: 20, duration: 0.6, delay: 0.1 });
      gsap.from(".hero-title", { opacity: 0, y: 40, duration: 0.8, delay: 0.2 });
      gsap.from(".hero-subtitle", { opacity: 0, y: 30, duration: 0.8, delay: 0.4 });
      gsap.from(".hero-cta", { opacity: 0, y: 20, duration: 0.6, delay: 0.6 });
      gsap.from(".hero-social", { opacity: 0, y: 20, duration: 0.6, delay: 0.8 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background layers - light */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <svg className="absolute -top-[200px] left-1/2 -ml-[520px] -translate-x-1/2 opacity-40" xmlns="http://www.w3.org/2000/svg" width="674" height="596" fill="none">
          <g filter="url(#sh1a)">
            <path fill="url(#sh1b)" fillRule="evenodd" d="m93 93 488 329.105L303.687 503 93 93Z" clipRule="evenodd" />
          </g>
          <defs>
            <linearGradient id="sh1b" x1="-2.47" x2="149.396" y1="227.957" y2="586.484" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" stopOpacity=".25" />
              <stop offset="1" stopColor="#8B5CF6" stopOpacity=".05" />
            </linearGradient>
            <filter id="sh1a" width="672.843" height="594.843" x=".578" y=".578" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="46.211" />
            </filter>
          </defs>
        </svg>
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[15%] right-[10%] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] bg-cyan-200/20 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Interactive grid distortion */}
      <GridDistortion />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        {/* Badge */}
        <div className="hero-badge mb-8 inline-flex shadow-sm">
          <div className="group relative inline-flex w-fit overflow-hidden rounded-full p-[1px]">
            <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3B82F6_0%,#8B5CF6_50%,#3B82F6_100%)]" />
            <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium backdrop-blur-3xl">
              <span className="relative flex h-2 w-2 mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-zinc-600">AI-Powered Claims Investigation</span>
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="hero-title mb-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          <span className="text-zinc-900">Claims Investigation in</span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
            Minutes, Not Days
          </span>
        </h1>

        {/* Subheadline */}
        <p className="hero-subtitle mb-10 text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Three AI agents collaborate to <strong className="text-zinc-800">triage</strong>,{" "}
          <strong className="text-zinc-800">investigate</strong>, and{" "}
          <strong className="text-zinc-800">decide</strong> on insurance claims — with full audit trail.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            href="/dashboard/claims/new"
            className="shining group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/40"
          >
            Submit a Claim
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white/60 backdrop-blur-sm px-7 font-medium text-zinc-700 transition-all duration-300 hover:bg-white hover:border-zinc-300 hover:shadow-lg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch Demo
          </Link>
        </div>

        {/* Social Proof */}
        <div className="hero-social flex items-center justify-center gap-4">
          <div className="flex -space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform duration-300 hover:scale-110 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm text-zinc-500">
            Trusted by <span className="font-bold text-zinc-800">500+</span> companies
          </span>
        </div>
      </div>
    </section>
  );
}
