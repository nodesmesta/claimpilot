"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = { x: -500, y: -500 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let mouse = { x: -500, y: -500 };
    let animId: number;

    // Nodes represent "agents" - connected network
    const nodeCount = 60;
    const nodes: { x: number; y: number; baseX: number; baseY: number; vx: number; vy: number; radius: number; color: string }[] = [];
    const colors = [
      "59, 130, 246",  // blue
      "139, 92, 246",  // purple
      "99, 102, 241",  // indigo
      "16, 185, 129",  // green
    ];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initNodes();
    };

    const initNodes = () => {
      nodes.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        nodes.push({
          x, y, baseX: x, baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 1.5 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouse.x = -500;
      mouse.y = -500;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const connectionDist = 150;
    const mouseRadius = 200;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      for (const node of nodes) {
        // Drift slowly
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges softly
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Repel/attract from cursor
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius) {
          const force = (mouseRadius - dist) / mouseRadius;
          // Push nodes away slightly, pull them in a swirl
          const angle = Math.atan2(dy, dx) + Math.PI * 0.5;
          node.x -= Math.cos(angle) * force * 1.5;
          node.y -= Math.sin(angle) * force * 1.5;
          // Brighten near cursor
          const glow = force * 0.8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + force * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${node.color}, ${0.4 + glow})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${node.color}, 0.3)`;
          ctx.fill();
        }
      }

      // Draw connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;

            // Brighter lines near cursor
            const midX = (nodes[i].x + nodes[j].x) / 2;
            const midY = (nodes[i].y + nodes[j].y) / 2;
            const mouseDist = Math.sqrt((mouse.x - midX) ** 2 + (mouse.y - midY) ** 2);
            const boost = mouseDist < mouseRadius ? (1 - mouseDist / mouseRadius) * 0.4 : 0;

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha + boost})`;
            ctx.lineWidth = 0.5 + boost * 2;
            ctx.stroke();
          }
        }
      }

      // Cursor glow
      if (mouse.x > 0 && mouse.y > 0) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mouseRadius);
        g.addColorStop(0, "rgba(99, 102, 241, 0.06)");
        g.addColorStop(0.5, "rgba(139, 92, 246, 0.03)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
