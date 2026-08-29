import { useEffect, useRef } from "react";
import { useImmune } from "@/lib/immune/store";
import type { LatticeNode } from "@/lib/immune/types";

function project(lat: number, lon: number, rot: number, tilt: number, r: number) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180 + rot;
  const x = Math.cos(la) * Math.sin(lo);
  const y = Math.sin(la);
  const z = Math.cos(la) * Math.cos(lo);
  const yt = y * Math.cos(tilt) - z * Math.sin(tilt);
  const zt = y * Math.sin(tilt) + z * Math.cos(tilt);
  return { x: x * r, y: -yt * r, z: zt, visible: zt > -0.05 };
}

function colorFor(n: LatticeNode) {
  if (n.status === "hostile") return "#f07167";
  if (n.status === "down") return "#5c6775";
  if (n.status === "isolated" || n.status === "watch") return "#e8b86d";
  if (n.kind === "estate") return "#5eead4";
  if (n.kind === "range") return "#f07167";
  return "#8b96a5";
}

export function LatticeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const select = useImmune((s) => s.select);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rot = 0.55;
    let tilt = 0.32;
    let auto = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let last = performance.now();
    const hits: { id: string; x: number; y: number; r: number }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const mode = useImmune.getState().mode;
      if (auto && mode !== "DEADMAN") rot += dt * 0.22;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2 + 8;
      const R = Math.min(w, h) * 0.42;
      const accent = mode === "DEADMAN" ? "#f07167" : mode === "SENTRA_REJECT" ? "#e8b86d" : "#5eead4";

      ctx.clearRect(0, 0, w, h);

      const grd = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
      grd.addColorStop(0, "rgba(94,234,212,0.08)");
      grd.addColorStop(1, "rgba(7,9,12,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
      ctx.strokeStyle = accent + "33";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(14,18,24,0.85)";
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = accent;
      ctx.lineWidth = 0.7;
      ctx.globalAlpha = 0.22;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        for (let lon = -180; lon <= 180; lon += 6) {
          const p = project(i * 22, lon, rot, tilt, R);
          if (!p.visible) continue;
          const x = cx + p.x;
          const y = cy + p.y;
          if (lon === -180) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let lon = -150; lon <= 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 6) {
          const p = project(lat, lon, rot, tilt, R);
          if (!p.visible) {
            started = false;
            continue;
          }
          const x = cx + p.x;
          const y = cy + p.y;
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const scanLat = Math.sin(now * 0.0008) * 50;
      ctx.beginPath();
      let scanStarted = false;
      for (let lon = -180; lon <= 180; lon += 4) {
        const p = project(scanLat, lon, rot, tilt, R);
        if (!p.visible) {
          scanStarted = false;
          continue;
        }
        const x = cx + p.x;
        const y = cy + p.y;
        if (!scanStarted) {
          ctx.moveTo(x, y);
          scanStarted = true;
        } else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      const nodes = useImmune.getState().nodes;
      const arcs = useImmune.getState().arcs;
      const selected = useImmune.getState().selectedId;
      const byId: Record<string, LatticeNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));

      for (const arc of arcs) {
        const from = byId[arc.from];
        const to = byId[arc.to];
        if (!from || !to) continue;
        const a = project(from.lat, from.lon, rot, tilt, R);
        const b = project(to.lat, to.lon, rot, tilt, R);
        if (!a.visible && !b.visible) continue;
        ctx.beginPath();
        ctx.moveTo(cx + a.x, cy + a.y);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 - R * (0.18 + arc.intensity * 0.2);
        ctx.quadraticCurveTo(cx + mx, cy + my, cx + b.x, cy + b.y);
        ctx.strokeStyle = arc.active ? "rgba(240,113,103,0.55)" : "rgba(92,103,117,0.25)";
        ctx.lineWidth = arc.active ? 1.4 : 0.8;
        ctx.stroke();
      }

      hits.length = 0;
      for (const n of nodes) {
        const p = project(n.lat, n.lon, rot, tilt, R);
        if (!p.visible) continue;
        const x = cx + p.x;
        const y = cy + p.y;
        const rad = n.id === selected ? 6.5 : 4.2;
        ctx.beginPath();
        ctx.arc(x, y, rad + 5, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(n) + "33";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(n);
        ctx.fill();
        hits.push({ id: n.id, x, y, r: 14 });
      }

      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "rgba(139,150,165,0.85)";
      ctx.fillText("LATTICE COP", 16, 22);
      ctx.fillStyle = accent;
      ctx.fillText(mode, 16, 38);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onDown = (e: PointerEvent) => {
      dragging = true;
      auto = false;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      rot += (e.clientX - lastX) * 0.006;
      tilt = Math.max(-0.8, Math.min(0.9, tilt + (e.clientY - lastY) * 0.004));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hits.find((h) => (h.x - x) ** 2 + (h.y - y) ** 2 < h.r ** 2);
      if (hit) select(hit.id);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [select]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      aria-label="Holographic lattice globe. Drag to rotate. Click a node to inspect."
    />
  );
}
