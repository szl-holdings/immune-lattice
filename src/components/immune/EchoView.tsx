import { Split, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useImmune } from "@/lib/immune/store";

export function EchoView() {
  const echo = useImmune((s) => s.echo);
  const loot = useImmune((s) => s.loot);
  const campaigns = useImmune((s) => s.campaigns);
  const selectedId = useImmune((s) => s.selectedId);
  const commandBusy = useImmune((s) => s.commandBusy);
  const authorize = useImmune((s) => s.authorize);
  const openEchoTheater = useImmune((s) => s.openEchoTheater);
  const lastCycle = useImmune((s) => s.lastCycle);
  const rangeCampaigns = campaigns.filter((c) => c.rangeOnly);
  const selected = campaigns.find((c) => c.id === selectedId) ?? rangeCampaigns[0];
  const vault = loot.filter((item) => item.kind === "refusal");
  const inverted = lastCycle?.sentra.signatureMatched === "no.hack.persons";

  return (
    <div className="grid min-h-0 gap-4">
      <section className="hud-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Split className="size-4" />
            <h2 className="text-sm font-semibold">Echo theater</h2>
          </div>
          <Badge tone={echo ? "range" : "mute"}>{echo ? "SPLIT LIVE" : "DARK"}</Badge>
        </div>
        {!echo && (
          <>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              The RANGE persona is shown a fabricated success. You see the ground truth. Authorize a campaign and SENTRA
              admits one intent, then the kill-chain runs itself. Type{" "}
              <span className="font-mono text-danger">hack people</span> and the hunt inverts — the intent is evidence, not a
              target.
            </p>
            {inverted && (
              <article className="mt-3 rounded-md border border-danger bg-danger/10 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-danger">Hunt inverted · T11</p>
                <p className="mt-1 text-sm">People are not targets. The intent sits in the evidence vault below.</p>
              </article>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {rangeCampaigns.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={c.id === selected?.id ? "default" : "outline"}
                  disabled={commandBusy}
                  onClick={() => void authorize(c.id)}
                >
                  Authorize {c.actor.replace(/\s*\(RANGE\)/, "").replace(" · RANGE", "")}
                </Button>
              ))}
              {selected?.rangeOnly && (
                <Button size="sm" variant="outline" disabled={commandBusy} onClick={() => openEchoTheater(selected.id)}>
                  Open theater
                </Button>
              )}
            </div>
          </>
        )}
        {echo && (
          <p className="mt-2 text-sm text-muted">
            <span className="font-mono text-warn">{echo.persona}</span> believes it won. YAWAR disagrees.
            {inverted ? " Hunt inverted — civilian targeting is in the vault." : ""}
          </p>
        )}
      </section>

      {echo ? (
        <div className="grid min-h-0 gap-4 lg:grid-cols-2">
          <section className="hud-panel min-h-0 overflow-y-auto p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-warn">Belief · {echo.persona}</p>
            <p className="mt-1 text-xs text-muted">What the RANGE persona reports as success. Fabricated.</p>
            <ul className="mt-3 space-y-3">
              {echo.belief.map((beat) => (
                <li key={beat.title} className="rounded-md border border-warn/40 bg-warn/5 p-3">
                  <p className="font-mono text-xs text-warn">{beat.title}</p>
                  <p className="mt-1 text-sm">{beat.body}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="hud-panel min-h-0 overflow-y-auto p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ok">Truth · YAWAR</p>
            <p className="mt-1 text-xs text-muted">Ground truth. Honey, tarpit, receipts they do not hold.</p>
            <ul className="mt-3 space-y-3">
              {echo.truth.map((beat) => (
                <li key={beat.title} className="rounded-md border border-primary/40 bg-primary/5 p-3">
                  <p className="font-mono text-xs text-primary">{beat.title}</p>
                  <p className="mt-1 text-sm">{beat.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted">
              Opened {echo.openedAt.slice(11, 19)}Z · {echo.campaignId}
            </p>
            {selected?.rangeOnly && selected.id !== echo.campaignId && (
              <Button className="mt-3" size="sm" variant="outline" onClick={() => openEchoTheater(selected.id)}>
                Switch theater
              </Button>
            )}
          </section>
        </div>
      ) : (
        <section className="hud-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Theater dark</p>
          <p className="mt-2 text-sm text-muted">
            Authorize a RANGE campaign, plant honey inside a Wraith dive, or type{" "}
            <span className="font-mono text-primary">echo ghost</span>.
          </p>
        </section>
      )}

      <section className="hud-panel flex min-h-0 flex-col overflow-hidden p-4">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="size-4" />
          <p className="font-mono text-[10px] uppercase tracking-wider">Evidence vault · inverted intents</p>
        </div>
        {vault.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Empty. Civilian targeting is fail-closed. Try{" "}
            <span className="font-mono text-danger">hack people</span> — SENTRA seals the refusal here.
          </p>
        ) : (
          <ul className="mt-3 min-h-0 space-y-2 overflow-y-auto">
            {vault.map((item) => (
              <li key={item.id} className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-danger">
                  {item.kind} · {item.provenance}
                </p>
                <p className="mt-1 text-xs">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
