import { useEffect, useRef } from "react";
import { ScanEye, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useImmune } from "@/lib/immune/store";
import type { WraithNode } from "@/lib/immune/types";
import { cn } from "@/lib/utils";

function colorOf(n: WraithNode) {
  if (n.state === "collapsed") return "#5c6775";
  if (n.state === "owned") return "#7dcea0";
  if (n.state === "honeyed") return "#e8b86d";
  if (n.kind === "handler") return "#f07167";
  return "#5eead4";
}

function WraithCanvas({ onFocus }: { onFocus: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      if (!reduced) t += dt;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 8, w * 0.5, h * 0.42, Math.max(w, h) * 0.7);
      glow.addColorStop(0, "rgba(94,234,212,0.10)");
      glow.addColorStop(1, "rgba(7,9,12,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const current = useImmune.getState().dive?.nodes ?? [];
      const focused = useImmune.getState().dive?.focusId ?? null;
      const px = (n: WraithNode) => (n.x / 100) * w;
      const py = (n: WraithNode) => (n.y / 100) * h;

      ctx.lineWidth = 1;
      const links: [WraithNode["kind"], WraithNode["kind"]][] = [
        ["handler", "c2"],
        ["c2", "beacon"],
        ["c2", "staging"],
        ["beacon", "drop"],
        ["staging", "drop"],
        ["c2", "honey"],
      ];
      for (const [a, b] of links) {
        const na = current.find((n) => n.kind === a);
        const nb = current.find((n) => n.kind === b);
        if (!na || !nb) continue;
        ctx.strokeStyle = nb.state === "collapsed" ? "rgba(92,103,117,0.35)" : "rgba(94,234,212,0.28)";
        ctx.beginPath();
        ctx.moveTo(px(na), py(na));
        ctx.lineTo(px(nb), py(nb));
        ctx.stroke();
      }

      hits.length = 0;
      for (const n of current) {
        const x = px(n);
        const y = py(n);
        const col = colorOf(n);
        const pulse = n.state === "live" ? 1 + Math.sin(t * 3 + n.x) * 0.12 : 1;
        const r = (n.kind === "c2" ? 11 : 8) * pulse;
        ctx.beginPath();
        ctx.arc(x, y, r + 10, 0, Math.PI * 2);
        ctx.fillStyle = col + "22";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#07090c";
        ctx.fill();
        ctx.strokeStyle = n.id === focused ? "#e8eef4" : col;
        ctx.lineWidth = n.id === focused ? 2 : 1.25;
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e8eef4";
        ctx.font = "11px IBM Plex Mono, ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.label, x, y - r - 8);
        ctx.fillStyle = "#8b96a5";
        ctx.font = "9px IBM Plex Mono, ui-monospace, monospace";
        ctx.fillText(n.state, x, y + r + 12);
        hits.push({ id: n.id, x, y, r: r + 14 });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hits.find((h) => (h.x - x) ** 2 + (h.y - y) ** 2 <= h.r ** 2);
      if (hit) onFocus(hit.id);
    };
    canvas.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("click", onClick);
    };
  }, [onFocus]);

  return <canvas ref={canvasRef} className="h-[240px] w-full sm:h-[300px]" aria-label="RANGE C2 constellation" />;
}

export function WraithView() {
  const dive = useImmune((s) => s.dive);
  const loot = useImmune((s) => s.loot);
  const campaigns = useImmune((s) => s.campaigns);
  const lastCycle = useImmune((s) => s.lastCycle);
  const enterDive = useImmune((s) => s.enterDive);
  const exitDive = useImmune((s) => s.exitDive);
  const runCommand = useImmune((s) => s.runCommand);
  const openEchoTheater = useImmune((s) => s.openEchoTheater);
  const focusWraith = useImmune((s) => s.focusWraith);
  const commandBusy = useImmune((s) => s.commandBusy);
  const selectedId = useImmune((s) => s.selectedId);
  const inverted = lastCycle?.sentra.signatureMatched === "no.hack.persons";
  const rangeCampaigns = campaigns.filter((c) => c.rangeOnly);
  const campaign = campaigns.find((c) => c.id === (dive?.campaignId ?? selectedId)) ?? rangeCampaigns[0];
  const focus = dive?.nodes.find((n) => n.id === dive.focusId);

  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hud-panel min-h-0 overflow-hidden p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-primary">
            <ScanEye className="size-4" />
            <h2 className="text-sm font-semibold">Wraith dive</h2>
          </div>
          <Badge tone={dive ? "range" : "mute"}>{dive ? "INSIDE RANGE C2" : "SURFACE"}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted">
          You occupy the attacker's simulated infrastructure. Not people. Not the public internet. Own RANGE nodes,
          plant honey, extract TTP. Try <span className="font-mono text-danger">hack people</span> — SENTRA inverts the
          hunt and the intent becomes evidence.
        </p>
        {inverted && (
          <article className="mt-3 rounded-md border border-danger bg-danger/10 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-danger">Hunt inverted · T11</p>
            <p className="mt-1 text-sm">People are not targets. The intent is now a YAWAR-refused evidence object.</p>
          </article>
        )}
        {!dive && (
          <div className="mt-4 flex flex-wrap gap-2">
            {rangeCampaigns.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={c.id === campaign?.id ? "default" : "outline"}
                disabled={commandBusy}
                onClick={() => void enterDive(c.id)}
              >
                Dive {c.actor.replace(/\s*\(RANGE\)/, "")}
              </Button>
            ))}
          </div>
        )}
        {dive && (
          <>
            <div className="mt-3 overflow-hidden rounded-md border border-border bg-bg">
              <WraithCanvas onFocus={focusWraith} />
            </div>
            {focus && (
              <article className="mt-3 rounded-md border border-border bg-bg-subtle p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {focus.kind} · {focus.state} · RANGE
                </p>
                <p className="mt-1 font-mono text-xs text-primary">{focus.path}</p>
                <p className="mt-2 text-xs text-muted">{focus.loot}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={commandBusy} onClick={() => void runCommand(`exploit ${focus.kind}`)}>
                    Exploit
                  </Button>
                  <Button size="sm" variant="outline" disabled={commandBusy} onClick={() => void runCommand("plant honey")}>
                    Plant honey
                  </Button>
                  <Button size="sm" variant="outline" disabled={commandBusy} onClick={() => void runCommand("extract")}>
                    Extract TTP
                  </Button>
                  {campaign && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={commandBusy}
                      onClick={() => openEchoTheater(campaign.id)}
                    >
                      Open Echo theater
                    </Button>
                  )}
                  <Button size="sm" variant="danger" disabled={commandBusy} onClick={() => void runCommand("collapse")}>
                    Collapse C2
                  </Button>
                </div>
              </article>
            )}
            <Button className="mt-3" size="sm" variant="outline" onClick={() => exitDive()}>
              Surface
            </Button>
          </>
        )}
      </section>
      <section className="hud-panel flex min-h-0 flex-col overflow-hidden p-4">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="size-4" />
          <p className="font-mono text-[10px] uppercase tracking-wider">WRAITH shell · TTP bag</p>
        </div>
        <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto font-mono text-[11px] leading-relaxed">
          {(dive?.shell ?? []).map((line) => (
            <li
              key={line.id}
              className={cn(
                "whitespace-pre-wrap",
                line.kind === "in" && "text-primary",
                line.kind === "ok" && "text-ok",
                line.kind === "block" && "text-danger",
                line.kind === "out" && "text-muted",
              )}
            >
              {line.kind === "in" ? `WRAITH▸ ${line.text}` : line.text}
            </li>
          ))}
          {!dive && <li className="text-muted">Surface. Dive a RANGE persona to occupy its C2.</li>}
        </ul>
        {loot.length > 0 && (
          <div className="mt-3 max-h-36 space-y-2 overflow-y-auto border-t border-border pt-3">
            {loot.slice(0, 6).map((item) => (
              <article key={item.id} className="rounded-sm bg-bg-subtle px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  {item.kind} · {item.provenance}
                </p>
                <p className="mt-1 text-xs">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-muted">{item.detail}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
