"use client";

import { useEffect, useRef } from "react";

export function DotDistortion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = { x: -9999, y: -9999 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const spacing = 16;
    const radius = 38;
    const strength = 10;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };

    window.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y <= canvas.height; y += spacing) {
        for (let x = 0; x <= canvas.width; x += spacing) {
          const dx = x - mousePos.x;
          const dy = y - mousePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let px = x;
          let py = y;
          let dotRadius = 1.5;
          let opacity = 0.2;

          if (dist < radius) {
            const force = (1 - dist / radius) * strength;
            px = x + (dx / dist) * force;
            py = y + (dy / dist) * force;
            dotRadius = 1.5 + (1 - dist / radius) * 2;
            opacity = 0.2 + (1 - dist / radius) * 0.4;
          }

          ctx.beginPath();
          ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      aria-hidden="true"
    />
  );
}
