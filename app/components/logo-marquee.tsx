"use client";

import Image from "next/image";

const logos = [
  { name: "Band", href: "https://band.ai", img: "/logos/band.ico" },
  { name: "AI/ML API", href: "https://aimlapi.com", img: "/logos/aimlapi.ico" },
  { name: "Featherless AI", href: "https://featherless.ai", img: "/logos/featherless.ico" },
  { name: "LabLab AI", href: "https://lablab.ai", img: "/logos/lablab.ico" },
];

export function LogoMarquee() {
  return (
    <section className="relative py-8 overflow-hidden border-y border-zinc-100">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-5">
        Powered by
      </p>

      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex w-max marquee-scroll">
          {[0, 1, 2].map((setIndex) => (
            <div key={setIndex} className="flex shrink-0 items-center gap-12 px-6">
              {[...logos, ...logos, ...logos].map((logo, i) => (
                <a
                  key={i}
                  href={logo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300"
                  title={logo.name}
                >
                  <Image
                    src={logo.img}
                    alt={logo.name}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                    unoptimized
                  />
                  <span className="text-sm font-bold text-zinc-600 whitespace-nowrap">
                    {logo.name}
                  </span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
