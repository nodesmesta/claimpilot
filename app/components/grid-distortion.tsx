"use client";

import { useEffect, useRef } from "react";

export function GridDistortion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = { x: -9999, y: -9999 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const spacing = 12;
    const radius = 85;
    const strength = 12;

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

    const onMouseLeave = () => {
      mousePos.x = -9999;
      mousePos.y = -9999;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const distort = (x: number, y: number) => {
      const dx = x - mousePos.x;
      const dy = y - mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        const force = (1 - dist / radius) * strength;
        return {
          x: x + (dx / dist) * force,
          y: y + (dy / dist) * force,
        };
      }
      return { x, y };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Horizontal lines
      for (let y = 0; y <= canvas.height; y += spacing) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 4) {
          const p = distort(x, y);
          if (x === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(99, 102, 241, 0.18)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Vertical lines
      for (let x = 0; x <= canvas.width; x += spacing) {
        ctx.beginPath();
        for (let y = 0; y <= canvas.height; y += 4) {
          const p = distort(x, y);
          if (y === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(139, 92, 246, 0.14)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
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
