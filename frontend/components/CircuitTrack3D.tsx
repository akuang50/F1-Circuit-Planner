"use client";

import { useEffect, useRef } from "react";
import type { CircuitGuide } from "@/lib/circuitGuides";
import { elevColor, elevationRange, localMinima, resampleClosed } from "@/lib/trackGeometry";

type Vec3 = { x: number; y: number; z: number; name?: string; t: number };

function project(
  p: Vec3,
  yaw: number,
  pitch: number,
  scale: number,
  cx: number,
  cy: number,
): { x: number; y: number; depth: number } {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = p.x * cosY - p.z * sinY;
  const z1 = p.x * sinY + p.z * cosY;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y1 = p.y * cosP - z1 * sinP;
  const z2 = p.y * sinP + z1 * cosP;
  const persp = 5.2 / (5.2 + z2);
  return { x: cx + x1 * scale * persp, y: cy - y1 * scale * persp, depth: z2 };
}

function worldTrack(guide: CircuitGuide): { points: Vec3[]; min: number; max: number } {
  const samples = resampleClosed(guide.points, 128);
  const xs = samples.map((p) => p.x);
  const zs = samples.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 1);
  const { min, max } = elevationRange(samples);
  const delta = Math.max(max - min, 8);
  const amp = 0.55;
  return {
    min,
    max,
    points: samples.map((p) => ({
      x: ((p.x - cx) / span) * 2,
      y: ((p.elev - min) / delta) * amp,
      z: ((p.y - cz) / span) * 2,
      name: p.name,
      t: (p.elev - min) / delta,
    })),
  };
}

function perp(a: Vec3, b: Vec3) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: -dz / len, z: dx / len };
}

export function CircuitTrack3D({
  guide,
  wet = false,
}: {
  guide: CircuitGuide;
  wet?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const yawRef = useRef(0.85);
  const pitchRef = useRef(0.62);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const ctxEl = canvasEl.getContext("2d");
    if (!ctxEl) return;
    const canvas = canvasEl;
    const wrap = wrapEl;
    const ctx = ctxEl;

    const { points, min, max } = worldTrack(guide);
    const dips = wet ? localMinima(guide.points) : [];
    const dipSet = new Set(dips.map((d) => d.name).filter((name): name is string => Boolean(name)));
    let frame = 0;
    let running = true;

    function size() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);

    function draw() {
      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w * 0.5;
      const cy = h * 0.58;
      const scale = Math.min(w, h) * 0.42;
      const yaw = yawRef.current;
      const pitch = pitchRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = wet ? "#0a1628" : "#0c0c10";
      ctx.fillRect(0, 0, w, h);

      const ground: Vec3[] = [];
      for (let i = 0; i < 36; i += 1) {
        const a = (i / 36) * Math.PI * 2;
        ground.push({ x: Math.cos(a) * 1.35, y: 0, z: Math.sin(a) * 1.35, t: 0 });
      }
      ctx.beginPath();
      ground.forEach((p, i) => {
        const s = project(p, yaw, pitch, scale, cx, cy);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.fillStyle = wet ? "rgba(30, 64, 120, 0.35)" : "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();

      for (let g = -3; g <= 3; g += 1) {
        const a = project({ x: g * 0.35, y: 0, z: -1.2, t: 0 }, yaw, pitch, scale, cx, cy);
        const b = project({ x: g * 0.35, y: 0, z: 1.2, t: 0 }, yaw, pitch, scale, cx, cy);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.stroke();
      }

      const width = 0.07;
      type Face = { pts: { x: number; y: number }[]; depth: number; fill: string };
      const faces: Face[] = [];
      const n = points.length;
      for (let i = 0; i < n; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % n];
        const pr = perp(a, b);
        const aL: Vec3 = { x: a.x + pr.x * width, y: a.y, z: a.z + pr.z * width, t: a.t };
        const aR: Vec3 = { x: a.x - pr.x * width, y: a.y, z: a.z - pr.z * width, t: a.t };
        const bL: Vec3 = { x: b.x + pr.x * width, y: b.y, z: b.z + pr.z * width, t: b.t };
        const bR: Vec3 = { x: b.x - pr.x * width, y: b.y, z: b.z - pr.z * width, t: b.t };
        const paL = project(aL, yaw, pitch, scale, cx, cy);
        const paR = project(aR, yaw, pitch, scale, cx, cy);
        const pbL = project(bL, yaw, pitch, scale, cx, cy);
        const pbR = project(bR, yaw, pitch, scale, cx, cy);
        const paLg = project({ ...aL, y: 0 }, yaw, pitch, scale, cx, cy);
        const pbLg = project({ ...bL, y: 0 }, yaw, pitch, scale, cx, cy);
        const elev = min + ((a.t + b.t) / 2) * (max - min);
        const wetLow = wet && a.t < 0.38;
        faces.push({
          pts: [paL, pbL, pbLg, paLg],
          depth: (paL.depth + pbL.depth) / 2 + 0.15,
          fill: wetLow ? "rgba(37, 99, 235, 0.28)" : "rgba(0,0,0,0.35)",
        });
        faces.push({
          pts: [paL, paR, pbR, pbL],
          depth: (paL.depth + pbL.depth) / 2,
          fill: elevColor(elev, min, max, wetLow),
        });
      }
      faces.sort((left, right) => right.depth - left.depth);
      for (const face of faces) {
        ctx.beginPath();
        face.pts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = face.fill;
        ctx.fill();
      }

      const start = project(points[0], yaw, pitch, scale, cx, cy);
      ctx.beginPath();
      ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#f4f1ea";
      ctx.fill();
      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "rgba(244,241,234,0.85)";
      ctx.fillText("S/F", start.x + 8, start.y - 8);

      for (const p of points) {
        if (!p.name || p.name === "Start/finish") continue;
        const s = project(p, yaw, pitch, scale, cx, cy);
        if (Math.hypot(s.x - start.x, s.y - start.y) < 28) continue;
        ctx.fillStyle = dipSet.has(p.name) ? "#93c5fd" : "rgba(244,241,234,0.72)";
        ctx.fillText(p.name, s.x, s.y - 10);
      }
    }

    function tick() {
      if (!running) return;
      if (!dragging.current && !reduced.current) yawRef.current += 0.004;
      draw();
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    function down(event: PointerEvent) {
      dragging.current = true;
      last.current = { x: event.clientX, y: event.clientY };
      wrap.setPointerCapture(event.pointerId);
    }
    function move(event: PointerEvent) {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      last.current = { x: event.clientX, y: event.clientY };
      yawRef.current += dx * 0.008;
      pitchRef.current = Math.min(1.15, Math.max(0.28, pitchRef.current + dy * 0.006));
    }
    function up() {
      dragging.current = false;
    }

    wrap.addEventListener("pointerdown", down);
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerup", up);
    wrap.addEventListener("pointercancel", up);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      wrap.removeEventListener("pointerdown", down);
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointercancel", up);
    };
  }, [guide, wet]);

  return (
    <figure className="overflow-hidden rounded-2xl border border-stroke bg-black/40">
      <div
        ref={wrapRef}
        className="relative h-72 w-full cursor-grab touch-none active:cursor-grabbing sm:h-80"
      >
        <canvas ref={canvasRef} className="block h-full w-full" role="img" aria-label={`${guide.id} 3D schematic`} />
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-stroke px-3 py-2 text-[11px] text-muted">
        <span>3D schematic · drag to orbit · hills are exaggerated so terrain reads</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full bg-amber" /> low
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full bg-teal" /> high
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
