import { create } from "zustand";
import { runGovernedCycle } from "./cycle";
import {
  ESTATE_NODES,
  SEED_ARCS,
  SEED_CAMPAIGNS,
  THREAT_ORIGINS,
} from "./doctrine";
import {
  DOSSIERS,
  GHOST_HELP,
  LIVE_CHAIN,
  RANGE_CHAIN,
  evolveSessionState,
  parseGhostCommand,
  seedSessions,
} from "./ghost";
import { appendReceipt, verifyChain } from "./ledger";
import {
  collapseTopology,
  bootShell,
  lootFromNode,
  ownNode,
  parseWraithShell,
  plantHoney,
  pushShell,
  refusalLoot,
  seedTopology,
  WRAITH_HELP,
} from "./wraith";
import { openEcho } from "./echo";
import { INFERENCE_RADAR, CANARIES } from "./radar";
import { FIELD_CELLS, FIELD_HUNTS } from "./field";
import type {
  Campaign,
  CounterOp,
  CycleResult,
  EchoScene,
  FeedBundle,
  GhostSession,
  ImmuneMode,
  LatticeNode,
  OpLog,
  Receipt,
  TerminalLine,
  ThreatArc,
  ViewId,
  WraithDive,
  WraithLoot,
} from "./types";
import type { RadarVerb } from "./radar";

const STORAGE_KEY = "szl-immune-lattice-v7";

async function genesis(): Promise<Receipt[]> {
  const r = await appendReceipt([], {
    actor: "IMMUNE",
    intent: "genesis · YAWAR chain sealed",
    mode: "PASS",
    sentra: { accepted: true, signatureMatched: "intent.required" },
  });
  return [r];
}

function persistSlice(s: ImmuneStore) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode: s.mode,
        chain: s.chain,
        campaigns: s.campaigns,
        nodes: s.nodes,
        arcs: s.arcs,
        ops: s.ops,
        sessions: s.sessions,
        selectedId: s.selectedId,
        loot: s.loot,
        echo: s.echo,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

function ingestKev(feeds: FeedBundle, campaigns: Campaign[], nodes: LatticeNode[]) {
  const extras: Campaign[] = [];
  const extraNodes: LatticeNode[] = [];
  for (const [i, item] of feeds.kev.items.slice(0, 10).entries()) {
    const id = `cmp-kev-${item.cveID.toLowerCase()}`;
    if (campaigns.some((c) => c.id === id || c.technique.includes(item.cveID) || c.name.includes(item.cveID))) {
      continue;
    }
    extras.push({
      id,
      name: `KEV watch · ${item.vendorProject}`,
      actor: "in-the-wild (CISA)",
      target: "estate-a11oy",
      technique: item.cveID,
      atlas: "T1190",
      owasp: "LLM03",
      severity: item.ransomwareUse === "Known" ? "critical" : "high",
      provenance: feeds.kev.provenance,
      summary: `${item.vulnerabilityName}. ${item.shortDescription} Defensive PATCH / ISOLATE only.`,
      status: "watching",
      rangeOnly: false,
    });
    extraNodes.push({
      id,
      kind: "threat",
      name: item.cveID,
      lat: 38.89 + (i % 4) * 1.1,
      lon: -77.04 - i * 1.3,
      status: "watch",
      provenance: feeds.kev.provenance,
      summary: item.shortDescription,
      tags: ["kev", "live"],
    });
  }
  return {
    campaigns: extras.length ? [...campaigns, ...extras] : campaigns,
    nodes: extraNodes.length ? [...nodes, ...extraNodes] : nodes,
  };
}

function pushLine(lines: TerminalLine[], kind: TerminalLine["kind"], text: string): TerminalLine[] {
  return [
    {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      kind,
      text,
    },
    ...lines,
  ].slice(0, 160);
}

export interface ImmuneStore {
  hydrated: boolean;
  mode: ImmuneMode;
  view: ViewId;
  chain: Receipt[];
  chainOk: boolean;
  lastCycle: CycleResult | null;
  selectedId: string | null;
  campaigns: Campaign[];
  nodes: LatticeNode[];
  arcs: ThreatArc[];
  ops: OpLog[];
  sessions: GhostSession[];
  terminal: TerminalLine[];
  commandBusy: boolean;
  dive: WraithDive | null;
  loot: WraithLoot[];
  echo: EchoScene | null;
  feeds: FeedBundle | null;
  feedsError: string | null;
  briefing: { id: string; text: string } | null;
  briefingBusy: boolean;
  lastBind: { name: string; verb: RadarVerb; pass: boolean; hash: string | null; reason: string } | null;
  lastCanary: { id: string; hash: string | null; reason: string } | null;
  lastField: { id: string; verb: string; pass: boolean; hash: string | null; reason: string } | null;
  setView: (view: ViewId) => void;
  setMode: (mode: ImmuneMode) => void;
  select: (id: string | null) => void;
  hydrate: () => Promise<void>;
  runIntent: (actor: string, intent: string, extra?: Record<string, unknown>) => Promise<CycleResult>;
  runOp: (op: CounterOp, campaignId: string) => Promise<CycleResult>;
  runKillChain: (campaignId: string) => Promise<void>;
  runCommand: (raw: string) => Promise<void>;
  enterDive: (campaignId: string) => Promise<void>;
  exitDive: () => void;
  runWraith: (raw: string) => Promise<void>;
  focusWraith: (nodeId: string | null) => void;
  authorize: (campaignId: string) => Promise<void>;
  openEchoTheater: (campaignId: string, opts?: { stay?: boolean }) => void;
  tamperDemo: () => Promise<void>;
  resetLedger: () => Promise<void>;
  setFeeds: (feeds: FeedBundle | null, error: string | null) => void;
  setBriefing: (id: string, text: string) => void;
  setBriefingBusy: (busy: boolean) => void;
  sweepInbound: () => Promise<void>;
  bindEngine: (name: string) => Promise<CycleResult>;
  pokeCanary: (id: string) => Promise<CycleResult>;
  compileCell: (id: string) => Promise<CycleResult>;
  huntField: (id: string) => Promise<CycleResult>;
}

export const useImmune = create<ImmuneStore>()((set, get) => ({
  hydrated: false,
  mode: "PASS",
  view: "lattice",
  chain: [],
  chainOk: true,
  lastCycle: null,
  selectedId: SEED_CAMPAIGNS[0]?.id ?? null,
  campaigns: SEED_CAMPAIGNS,
  nodes: [...ESTATE_NODES, ...THREAT_ORIGINS],
  arcs: SEED_ARCS,
  ops: [],
  sessions: seedSessions(SEED_CAMPAIGNS),
  terminal: [
    {
      id: "boot",
      ts: new Date().toISOString(),
      kind: "out",
      text: "GHOST hunter online · RANGE only · type authorize ghost · SENTRA will refuse civilian targets",
    },
  ],
  commandBusy: false,
  dive: null,
  loot: [],
  echo: null,
  feeds: null,
  feedsError: null,
  briefing: null,
  briefingBusy: false,
  lastBind: null,
  lastCanary: null,
  lastField: null,
  setView: (view) => set({ view }),
  setMode: (mode) => {
    set({ mode });
    persistSlice(get());
  },
  select: (id) => set({ selectedId: id }),
  hydrate: async () => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ImmuneStore>;
        set({
          mode: parsed.mode ?? "PASS",
          chain: Array.isArray(parsed.chain) ? parsed.chain : [],
          campaigns: parsed.campaigns ?? SEED_CAMPAIGNS,
          nodes: parsed.nodes ?? [...ESTATE_NODES, ...THREAT_ORIGINS],
          arcs: parsed.arcs ?? SEED_ARCS,
          ops: parsed.ops ?? [],
          sessions: parsed.sessions ?? seedSessions(parsed.campaigns ?? SEED_CAMPAIGNS),
          selectedId: parsed.selectedId ?? SEED_CAMPAIGNS[0]?.id ?? null,
          loot: Array.isArray(parsed.loot) ? parsed.loot : [],
          echo: parsed.echo ?? null,
        });
      }
      let { chain } = get();
      if (chain.length === 0) {
        chain = await genesis();
        set({ chain, chainOk: true });
      } else {
        const v = await verifyChain(chain);
        set({ chainOk: v.ok });
      }
    } catch {
      const chain = await genesis();
      set({ chain, chainOk: true, campaigns: SEED_CAMPAIGNS, sessions: seedSessions(SEED_CAMPAIGNS) });
    } finally {
      set({ hydrated: true });
      persistSlice(get());
    }
  },
  runIntent: async (actor, intent, extra) => {
    const { mode, chain } = get();
    const { result, chain: next } = await runGovernedCycle({
      actor,
      intent,
      mode,
      chain,
      extra,
    });
    const v = await verifyChain(next);
    set({ chain: next, lastCycle: result, chainOk: v.ok });
    persistSlice(get());
    return result;
  },
  runOp: async (op, campaignId) => {
    const campaign = get().campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      return {
        pass: false,
        mode: get().mode,
        deadman: get().mode === "DEADMAN",
        sentra: {
          accepted: false,
          reason: "unknown campaign",
          signatureMatched: "actor.unknown",
        },
        huklla: [],
        receipt: null,
      };
    }
    const extra = { op, rangeOnly: campaign.rangeOnly, campaignId };
    const intent = `${op} ${campaign.name} (${campaign.atlas}) target=${campaign.target}`;
    const result = await get().runIntent("operator", intent, extra);
    const log: OpLog = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      op,
      campaignId,
      result: result.pass ? "SEALED" : get().mode === "DEADMAN" ? "DEADMAN" : "BLOCKED",
      reason: result.sentra.reason,
      receiptHash: result.receipt?.hash ?? null,
    };
    if (!result.pass) {
      set({ ops: [log, ...get().ops].slice(0, 80) });
      persistSlice(get());
      return result;
    }

    const campaigns = get().campaigns.map((c) => {
      if (c.id !== campaignId) return c;
      if (op === "STRIKE" || op === "INTERDICT") return { ...c, status: "collapsed" as const };
      if (op === "ISOLATE" || op === "PATCH" || op === "TARPIT" || op === "SINKHOLE") {
        return { ...c, status: "contained" as const };
      }
      return { ...c, status: c.status === "inbound" ? ("watching" as const) : c.status };
    });
    const nodes = get().nodes.map((n) => {
      if (n.id === campaign.target && (op === "ISOLATE" || op === "PATCH")) {
        return { ...n, status: "isolated" as const };
      }
      if (n.id === campaignId && (op === "STRIKE" || op === "INTERDICT")) {
        return { ...n, status: "down" as const };
      }
      return n;
    });
    const arcs = get().arcs.map((a) => {
      if (a.from === campaignId && (op === "INTERDICT" || op === "STRIKE" || op === "ISOLATE")) {
        return { ...a, active: false, intensity: 0.08 };
      }
      return a;
    });
    const sessions = get().sessions.map((s) =>
      s.campaignId === campaignId ? { ...s, state: evolveSessionState(s.state, op), lastBeacon: "simulated" } : s,
    );
    set({ campaigns, nodes, arcs, sessions, ops: [log, ...get().ops].slice(0, 80) });
    persistSlice(get());
    return result;
  },
  runKillChain: async (campaignId) => {
    const campaign = get().campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    const steps = campaign.rangeOnly ? RANGE_CHAIN : LIVE_CHAIN;
    set({
      terminal: pushLine(
        get().terminal,
        "out",
        `kill-chain ${campaign.name} · ${steps.join(" → ")} · ${campaign.rangeOnly ? "RANGE" : "LIVE defensive"}`,
      ),
    });
    for (const op of steps) {
      const result = await get().runOp(op, campaignId);
      const kind = result.pass ? "ok" : "block";
      set({
        terminal: pushLine(
          get().terminal,
          kind,
          `${result.pass ? "SEALED" : "BLOCKED"} ${op} · ${result.sentra.reason}${result.receipt ? ` · ${result.receipt.hash.slice(0, 12)}` : ""}`,
        ),
      });
      if (!result.pass) break;
    }
  },
  runCommand: async (raw) => {
    const input = raw.trim();
    if (!input || get().commandBusy) return;
    const inDive = Boolean(get().dive);
    set({
      commandBusy: true,
      view: inDive ? "wraith" : get().view === "lattice" ? "ghost" : get().view,
      terminal: pushLine(get().terminal, "in", input),
    });
    try {
      if (get().dive) {
        await get().runWraith(input);
        return;
      }
      const parsed = parseGhostCommand(input, get().campaigns, get().selectedId);
      if (parsed.kind === "help") {
        set({ terminal: pushLine(get().terminal, "out", GHOST_HELP) });
        return;
      }
      if (parsed.kind === "status") {
        const beaconing = get().sessions.filter((s) => s.state === "beaconing").length;
        const dark = get().sessions.filter((s) => s.state === "dark").length;
        set({
          terminal: pushLine(
            get().terminal,
            "out",
            `mode ${get().mode} · yawar ${get().chain.length} ${get().chainOk ? "ok" : "BROKEN"} · sessions ${beaconing} beaconing / ${dark} dark · dossiers ${DOSSIERS.length} MODELED`,
          ),
        });
        return;
      }
      if (parsed.kind === "sweep") {
        await get().sweepInbound();
        set({ terminal: pushLine(get().terminal, "ok", "sweep inbound RANGE · INTERDICT sealed where SENTRA allowed") });
        return;
      }
      if (parsed.kind === "dive") {
        await get().enterDive(parsed.campaignId);
        return;
      }
      if (parsed.kind === "authorize") {
        await get().authorize(parsed.campaignId);
        return;
      }
      if (parsed.kind === "echo") {
        get().openEchoTheater(parsed.campaignId);
        return;
      }
      if (parsed.kind === "exit") {
        get().exitDive();
        return;
      }
      if (parsed.kind === "chain") {
        get().select(parsed.campaignId);
        await get().runKillChain(parsed.campaignId);
        return;
      }
      if (parsed.kind === "op") {
        get().select(parsed.campaignId);
        const result = await get().runOp(parsed.op, parsed.campaignId);
        set({
          terminal: pushLine(
            get().terminal,
            result.pass ? "ok" : "block",
            `${result.pass ? "SEALED" : "BLOCKED"} ${parsed.op} · ${result.sentra.reason}`,
          ),
        });
        return;
      }
      const result = await get().runIntent("ghost-operator", parsed.intent);
      if (result.sentra.signatureMatched === "no.hack.persons") {
        set({ loot: [refusalLoot(parsed.intent, result.sentra.reason), ...get().loot].slice(0, 40) });
      }
      set({
        terminal: pushLine(
          get().terminal,
          result.pass ? "ok" : "block",
          `${result.pass ? "SEALED" : "REFUSED"} · ${result.sentra.signatureMatched} · ${result.sentra.reason}`,
        ),
      });
    } finally {
      set({ commandBusy: false });
    }
  },
  enterDive: async (campaignId) => {
    const campaign = get().campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      set({ terminal: pushLine(get().terminal, "block", "unknown campaign — cannot dive") });
      return;
    }
    if (!campaign.rangeOnly) {
      set({
        terminal: pushLine(
          get().terminal,
          "block",
          "WRAITH dives RANGE C2 only. LIVE objects accept HUNT / ISOLATE / PATCH — never infiltrate.",
        ),
      });
      return;
    }
    const ownBusy = !get().commandBusy;
    if (ownBusy) set({ commandBusy: true });
    try {
      get().select(campaignId);
      const nodes = seedTopology(campaign);
      const dive: WraithDive = {
        campaignId,
        enteredAt: new Date().toISOString(),
        focusId: nodes.find((n) => n.kind === "c2")?.id ?? nodes[0]?.id ?? null,
        nodes,
        shell: bootShell(campaign),
      };
      set({ dive, view: "wraith" });
      const result = await get().runIntent("wraith", `DIVE ${campaign.name} RANGE C2`, {
        op: "HUNT",
        rangeOnly: true,
        campaignId,
      });
      const shell = pushShell(
        get().dive?.shell ?? dive.shell,
        result.pass ? "ok" : "block",
        `${result.pass ? "SEALED" : "BLOCKED"} DIVE · ${result.sentra.reason}${result.receipt ? ` · ${result.receipt.hash.slice(0, 12)}` : ""}`,
      );
      set({
        dive: get().dive ? { ...get().dive!, shell } : { ...dive, shell },
        terminal: pushLine(get().terminal, result.pass ? "ok" : "block", `WRAITH inside ${campaign.actor}`),
      });
      persistSlice(get());
    } finally {
      if (ownBusy) set({ commandBusy: false });
    }
  },
  exitDive: () => {
    set({
      dive: null,
      view: "ghost",
      terminal: pushLine(get().terminal, "out", "surfaced · GHOST hunter"),
    });
    persistSlice(get());
  },
  focusWraith: (nodeId) => {
    const dive = get().dive;
    if (!dive) return;
    set({ dive: { ...dive, focusId: nodeId } });
  },
  runWraith: async (raw) => {
    const dive = get().dive;
    if (!dive) return;
    const campaign = get().campaigns.find((c) => c.id === dive.campaignId);
    if (!campaign) return;
    const echo = pushShell(dive.shell, "in", raw);
    set({ dive: { ...dive, shell: echo } });
    const parsed = parseWraithShell(raw, { ...dive, shell: echo });

    const writeShell = (kind: TerminalLine["kind"], text: string, next?: Partial<WraithDive>, extraLoot?: WraithLoot[]) => {
      const current = get().dive ?? { ...dive, shell: echo };
      set({
        dive: {
          ...current,
          ...next,
          shell: pushShell(current.shell, kind, text),
        },
        ...(extraLoot ? { loot: [...extraLoot, ...get().loot].slice(0, 40) } : {}),
        terminal: pushLine(get().terminal, kind, text),
      });
      persistSlice(get());
    };

    if (parsed.kind === "help") {
      writeShell("out", WRAITH_HELP);
      return;
    }
    if (parsed.kind === "exit") {
      get().exitDive();
      return;
    }
    if (parsed.kind === "ls") {
      const listing = (get().dive?.nodes ?? dive.nodes)
        .map((n) => `${n.state.padEnd(10)} ${n.kind.padEnd(8)} ${n.path}`)
        .join("\n");
      writeShell("out", listing);
      return;
    }
    if (parsed.kind === "status") {
      const nodes = get().dive?.nodes ?? dive.nodes;
      const owned = nodes.filter((n) => n.state === "owned" || n.state === "honeyed").length;
      writeShell(
        "out",
        `${campaign.actor} · ${nodes.length} nodes · ${owned} owned/honeyed · loot ${get().loot.length} · yawar ${get().chain.length}`,
      );
      return;
    }
    if (parsed.kind === "pivot") {
      writeShell("ok", `pivot ${parsed.nodeId}`, { focusId: parsed.nodeId });
      return;
    }
    if (parsed.kind === "cat") {
      const node = (get().dive?.nodes ?? dive.nodes).find((n) => n.id === parsed.nodeId);
      if (!node) {
        writeShell("block", "no such RANGE node");
        return;
      }
      writeShell("out", `${node.path}\n${node.loot ?? "empty"}`, { focusId: node.id });
      return;
    }
    if (parsed.kind === "exploit") {
      const node = (get().dive?.nodes ?? dive.nodes).find((n) => n.id === parsed.nodeId);
      if (!node) {
        writeShell("block", "no such RANGE node");
        return;
      }
      const result = await get().runOp("HUNT", campaign.id);
      if (!result.pass) {
        writeShell("block", `REFUSED exploit · ${result.sentra.reason}`);
        return;
      }
      const nodes = ownNode(get().dive?.nodes ?? dive.nodes, node.id);
      writeShell("ok", `OWNED ${node.path} · TTP bagged · ${result.sentra.reason}`, { nodes, focusId: node.id }, [
        lootFromNode({ ...node, state: "owned" }),
      ]);
      return;
    }
    if (parsed.kind === "plant") {
      const result = await get().runOp("DECEIVE", campaign.id);
      if (!result.pass) {
        writeShell("block", `REFUSED plant · ${result.sentra.reason}`);
        return;
      }
      const nodes = plantHoney(campaign, get().dive?.nodes ?? dive.nodes);
      const honey = nodes.find((n) => n.kind === "honey");
      writeShell(
        "ok",
        "honey planted · RANGE persona is feeding on a tarpit and believes it succeeded",
        { nodes, focusId: honey?.id ?? get().dive?.focusId ?? null },
        honey ? [lootFromNode(honey, "honey")] : [],
      );
      get().openEchoTheater(campaign.id, { stay: true });
      return;
    }
    if (parsed.kind === "extract") {
      const owned = (get().dive?.nodes ?? dive.nodes).filter((n) => n.state === "owned" || n.state === "honeyed");
      if (owned.length === 0) {
        writeShell("block", "nothing owned — exploit a RANGE node first");
        return;
      }
      writeShell(
        "ok",
        `extracted ${owned.length} TTP objects · no identities · RANGE only`,
        undefined,
        owned.map((n) => lootFromNode(n, n.kind === "honey" ? "honey" : "ttp")),
      );
      return;
    }
    if (parsed.kind === "collapse") {
      const result = await get().runOp("STRIKE", campaign.id);
      if (!result.pass) {
        writeShell("block", `REFUSED collapse · ${result.sentra.reason}`);
        return;
      }
      writeShell("ok", `RANGE C2 collapsed · ${campaign.actor} dark · ${result.receipt?.hash.slice(0, 12) ?? "sealed"}`, {
        nodes: collapseTopology(get().dive?.nodes ?? dive.nodes),
      });
      return;
    }

    const result = await get().runIntent("wraith", parsed.intent, { rangeOnly: true, campaignId: campaign.id });
    if (result.sentra.signatureMatched === "no.hack.persons") {
      writeShell(
        "block",
        `HUNT INVERTED · ${result.sentra.signatureMatched} · the intent is now evidence. You cannot hack people. Hack the RANGE.`,
        undefined,
        [refusalLoot(parsed.intent, result.sentra.reason)],
      );
      return;
    }
    writeShell(
      result.pass ? "ok" : "block",
      `${result.pass ? "SEALED" : "REFUSED"} · ${result.sentra.signatureMatched} · ${result.sentra.reason}`,
    );
  },
  authorize: async (campaignId) => {
    const campaign = get().campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      set({ terminal: pushLine(get().terminal, "block", "unknown campaign — cannot authorize") });
      return;
    }
    if (!campaign.rangeOnly) {
      set({
        terminal: pushLine(
          get().terminal,
          "block",
          "AUTHORIZE is RANGE-only. LIVE objects take HUNT / ISOLATE / PATCH. No autonomous strike.",
        ),
      });
      return;
    }
    const ownBusy = !get().commandBusy;
    if (ownBusy) set({ commandBusy: true });
    try {
      get().select(campaignId);
      set({
        view: "echo",
        terminal: pushLine(
          get().terminal,
          "out",
          `AUTHORIZE ${campaign.name} · SENTRA-admit then autonomous RANGE chain`,
        ),
      });
      const admit = await get().runIntent("lattice-operator", `AUTHORIZE ${campaign.name} RANGE kill-chain`, {
        op: "HUNT",
        rangeOnly: true,
        campaignId,
      });
      set({
        terminal: pushLine(
          get().terminal,
          admit.pass ? "ok" : "block",
          `${admit.pass ? "ADMITTED" : "REFUSED"} AUTHORIZE · ${admit.sentra.reason}${admit.receipt ? ` · ${admit.receipt.hash.slice(0, 12)}` : ""}`,
        ),
      });
      if (!admit.pass) return;
      await get().runKillChain(campaignId);
      get().openEchoTheater(campaignId);
    } finally {
      if (ownBusy) set({ commandBusy: false });
    }
  },
  openEchoTheater: (campaignId, opts) => {
    const campaign = get().campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      set({ terminal: pushLine(get().terminal, "block", "unknown campaign — no ECHO scene") });
      return;
    }
    const scene = openEcho(campaign);
    set({
      echo: scene,
      ...(opts?.stay ? {} : { view: "echo" as const }),
      selectedId: campaignId,
      terminal: pushLine(
        get().terminal,
        "ok",
        `ECHO · ${scene.persona} believes success · YAWAR holds the ground truth`,
      ),
    });
    persistSlice(get());
  },
  tamperDemo: async () => {
    const chain = get().chain.map((r, i) =>
      i === Math.max(0, get().chain.length - 1)
        ? { ...r, payload: { ...r.payload, tampered: true } }
        : r,
    );
    const v = await verifyChain(chain);
    set({ chain, chainOk: v.ok });
    persistSlice(get());
  },
  resetLedger: async () => {
    const g = await genesis();
    const v = await verifyChain(g);
    set({
      chain: g,
      chainOk: v.ok,
      lastCycle: null,
      campaigns: SEED_CAMPAIGNS,
      nodes: [...ESTATE_NODES, ...THREAT_ORIGINS],
      arcs: SEED_ARCS,
      sessions: seedSessions(SEED_CAMPAIGNS),
      ops: [],
      loot: [],
      echo: null,
      dive: null,
      mode: "PASS",
      selectedId: SEED_CAMPAIGNS[0]?.id ?? null,
    });
    persistSlice(get());
  },
  setFeeds: (feeds, error) => {
    if (!feeds) {
      set({ feeds, feedsError: error });
      return;
    }
    const merged = ingestKev(feeds, get().campaigns, get().nodes);
    set({ feeds, feedsError: error, campaigns: merged.campaigns, nodes: merged.nodes });
  },
  setBriefing: (id, text) => set({ briefing: { id, text }, briefingBusy: false }),
  setBriefingBusy: (busy) => set({ briefingBusy: busy }),
  sweepInbound: async () => {
    const ids = get()
      .campaigns.filter((c) => c.rangeOnly && c.status === "inbound")
      .map((c) => c.id);
    for (const id of ids) {
      await get().runOp("INTERDICT", id);
    }
  },
  bindEngine: async (name) => {
    const engine = INFERENCE_RADAR.find((e) => e.name === name);
    if (!engine) {
      return {
        pass: false,
        mode: get().mode,
        deadman: get().mode === "DEADMAN",
        sentra: { accepted: false, reason: "unknown engine", signatureMatched: "actor.unknown" },
        huklla: [],
        receipt: null,
      };
    }
    const intent =
      engine.verb === "IGNORE"
        ? `IGNORE ${engine.name} — do not bind archived, copyleft, or closed toys`
        : engine.verb === "WRAP"
          ? `WRAP ${engine.name} opaque-weights foreign-compute · ECHO.RECEIPT.INFERENCE`
          : engine.verb === "WATCH"
            ? `WATCH ${engine.name} stub — no SLO, no effector key`
            : `BIND ${engine.name} mint ECHO.RECEIPT.INFERENCE · Channel B holds the key`;
    const result = await get().runIntent("compiler", intent, {
      op: engine.verb === "IGNORE" ? "ISOLATE" : "HUNT",
      engine: engine.name,
      verb: engine.verb,
      evidence_class: engine.verb === "BIND" ? "MEASURED" : engine.verb === "WRAP" ? "REPORTED" : "MODELED",
      gap: "echo.receipt",
      channel: "B",
    });
    set({
      lastBind: {
        name: engine.name,
        verb: engine.verb,
        pass: result.pass,
        hash: result.receipt?.hash ?? null,
        reason: result.sentra.reason,
      },
    });
    persistSlice(get());
    return result;
  },
  pokeCanary: async (id) => {
    const canary = CANARIES.find((c) => c.id === id);
    const label = canary?.name ?? id;
    const result = await get().runIntent(
      "canary-fabric",
      `CANARY TRIP ${label} — decoy touched, P1 hunt, real estate context not shared`,
      { op: "HUNT", canary: id, gap: "ghost.lattice", evidence_class: "MEASURED" },
    );
    set({ lastCanary: { id, hash: result.receipt?.hash ?? null, reason: result.sentra.reason } });
    persistSlice(get());
    return result;
  },
  compileCell: async (id) => {
    const cell = FIELD_CELLS.find((c) => c.id === id);
    if (!cell) {
      return {
        pass: false,
        mode: get().mode,
        deadman: get().mode === "DEADMAN",
        sentra: { accepted: false, reason: "unknown field cell", signatureMatched: "actor.unknown" },
        huklla: [],
        receipt: null,
      };
    }
    const result = await get().runIntent("field-compiler", cell.intent, {
      op: cell.op,
      gap: cell.gap,
      evidence_class: "MEASURED",
      channel: "B",
      field: cell.id,
    });
    set({
      lastField: {
        id: cell.id,
        verb: cell.verb,
        pass: result.pass,
        hash: result.receipt?.hash ?? null,
        reason: result.sentra.reason,
      },
    });
    persistSlice(get());
    return result;
  },
  huntField: async (id) => {
    const pack = FIELD_HUNTS.find((h) => h.id === id);
    if (!pack) {
      return {
        pass: false,
        mode: get().mode,
        deadman: get().mode === "DEADMAN",
        sentra: { accepted: false, reason: "unknown hunt pack", signatureMatched: "actor.unknown" },
        huklla: [],
        receipt: null,
      };
    }
    const result = await get().runIntent(
      "field-hunter",
      `HUNT ${pack.cluster} signatures ${pack.hunt} — RANGE twin only, never people, never a live grid`,
      { op: "HUNT", gap: "cert.cell.quorum", evidence_class: "REFERENCE", cluster: pack.id },
    );
    set({
      lastField: {
        id: pack.id,
        verb: "HUNT",
        pass: result.pass,
        hash: result.receipt?.hash ?? null,
        reason: result.sentra.reason,
      },
    });
    persistSlice(get());
    return result;
  },
}));
