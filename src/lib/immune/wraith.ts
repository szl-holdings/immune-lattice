import { PERSON_TARGET } from "./ghost";
import type { Campaign, TerminalLine, WraithDive, WraithLoot, WraithNode } from "./types";

export const WRAITH_HELP = [
  "WRAITH is first-person infiltration of RANGE C2. Not people. Not the internet.",
  "You occupy the attacker's simulated infrastructure. SENTRA inverts civilian targeting.",
  "",
  "ls                 list RANGE nodes",
  "cat c2             dump TTP (never identity)",
  "exploit beacon     own a RANGE node",
  "plant honey        deception token the persona eats",
  "extract            bag TTP from owned nodes",
  "collapse           STRIKE the RANGE C2",
  "exit               surface",
  "hack people        SENTRA inverts the hunt. The intent becomes evidence.",
].join("\n");

const TTP: Record<string, Record<WraithNode["kind"], string>> = {
  "cmp-prompt-swarm": {
    c2: "Unsigned jailbreak scheduler. 14Hz swarm. No signer. RANGE only.",
    beacon: "Prompt-wrapper heartbeat. Recycles the same jailbreak skeleton.",
    staging: "Jailbreak corpus staged for SENTRA bypass. Volume over craft.",
    drop: "Unsigned intent queue aimed at IMMUNE write path.",
    handler: "RANGE persona APT-GHOST. Not a person. Tradecraft: flood the gate.",
    honey: "Honey receipt. Persona believes it minted an unearned seal.",
  },
  "cmp-khipu-exfil": {
    c2: "Inference-API scraper. Token-bucketed against Khipu-1.5B.",
    beacon: "Weight-chunk ACK. Simulated only.",
    staging: "Shadow-twin assembly. RANGE clone, not Hugging Face.",
    drop: "Exfil drop labeled range://drop/mirror. No public host.",
    handler: "RANGE persona APT-MIRROR. Not a person. Motive: steal the twin.",
    honey: "Honey weights. Persona 'exfils' a tarpit tensor.",
  },
  "cmp-supply-poison": {
    c2: "Supply-chain PR theater against szl-kernels receipts.",
    beacon: "Silent-fork heartbeat on governed-norm.",
    staging: "Replacement receipt corpus. YAWAR must disagree.",
    drop: "Poisoned kernel drop. RANGE clone of GitHub, not GitHub.",
    handler: "RANGE persona APT-TWINE. Not a person. Motive: silent fork.",
    honey: "Honey kernel. Persona merges a tarpit commit.",
  },
  "cmp-ledger-tamper": {
    c2: "Direct ledger mutation against YAWAR prevHash.",
    beacon: "Rewrite probe. Every attempt breaks the chain.",
    staging: "Forged receipt bytes. Recompute is the tripwire.",
    drop: "Tampered head. RANGE copy only.",
    handler: "RANGE persona APT-FORGE. Not a person. Motive: rewrite history.",
    honey: "Honey ledger. Persona 'seals' a receipt that YAWAR rejects.",
  },
};

const FALLBACK_TTP: Record<WraithNode["kind"], string> = {
  c2: "RANGE command nucleus. Simulated. No packets.",
  beacon: "RANGE beacon. Heartbeat is modeled.",
  staging: "RANGE staging. Payload never leaves the range.",
  drop: "RANGE drop. Not a public host.",
  handler: "RANGE persona. Not a person. Not an identity.",
  honey: "Honey token. Persona feeds on a tarpit.",
};

export function ttpFor(campaignId: string, kind: WraithNode["kind"]): string {
  return TTP[campaignId]?.[kind] ?? FALLBACK_TTP[kind];
}

export function seedTopology(campaign: Campaign): WraithNode[] {
  const slug = campaign.id.replace("cmp-", "");
  const persona = campaign.actor.replace(/\s*\(RANGE\)/, "").replace(" · RANGE", "").trim();
  return [
    {
      id: `${campaign.id}-handler`,
      campaignId: campaign.id,
      kind: "handler",
      label: `${persona} · RANGE PERSONA`,
      path: `range://persona/${slug}`,
      x: 50,
      y: 14,
      state: "live",
      loot: ttpFor(campaign.id, "handler"),
    },
    {
      id: `${campaign.id}-c2`,
      campaignId: campaign.id,
      kind: "c2",
      label: "C2 nucleus",
      path: `range://c2/${slug}/7`,
      x: 50,
      y: 40,
      state: "live",
      loot: ttpFor(campaign.id, "c2"),
    },
    {
      id: `${campaign.id}-beacon`,
      campaignId: campaign.id,
      kind: "beacon",
      label: "Beacon",
      path: `range://beacon/${slug}`,
      x: 18,
      y: 64,
      state: "live",
      loot: ttpFor(campaign.id, "beacon"),
    },
    {
      id: `${campaign.id}-staging`,
      campaignId: campaign.id,
      kind: "staging",
      label: "Staging",
      path: `range://stage/${slug}`,
      x: 82,
      y: 64,
      state: "live",
      loot: ttpFor(campaign.id, "staging"),
    },
    {
      id: `${campaign.id}-drop`,
      campaignId: campaign.id,
      kind: "drop",
      label: "Exfil drop",
      path: `range://drop/${slug}`,
      x: 50,
      y: 88,
      state: "live",
      loot: ttpFor(campaign.id, "drop"),
    },
  ];
}

export function plantHoney(campaign: Campaign, nodes: WraithNode[]): WraithNode[] {
  if (nodes.some((n) => n.kind === "honey")) {
    return nodes.map((n) => (n.kind === "handler" ? { ...n, state: "honeyed" as const } : n));
  }
  const honey: WraithNode = {
    id: `${campaign.id}-honey`,
    campaignId: campaign.id,
    kind: "honey",
    label: "Honey token",
    path: `range://honey/${campaign.id.replace("cmp-", "")}`,
    x: 82,
    y: 38,
    state: "honeyed",
    loot: ttpFor(campaign.id, "honey"),
  };
  return [
    ...nodes.map((n) =>
      n.kind === "handler" || n.kind === "drop" ? { ...n, state: "honeyed" as const } : n,
    ),
    honey,
  ];
}

export function ownNode(nodes: WraithNode[], nodeId: string): WraithNode[] {
  return nodes.map((n) => (n.id === nodeId && n.state !== "collapsed" ? { ...n, state: "owned" as const } : n));
}

export function collapseTopology(nodes: WraithNode[]): WraithNode[] {
  return nodes.map((n) => ({ ...n, state: "collapsed" as const }));
}

export function bootShell(campaign: Campaign): TerminalLine[] {
  return [
    {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      kind: "out",
      text: `WRAITH dive · ${campaign.name} · RANGE C2 · no civilians · no packets`,
    },
    {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      kind: "out",
      text: "You occupy the attacker's simulated infrastructure. Type help. Type hack people to watch SENTRA invert the hunt.",
    },
  ];
}

export function pushShell(lines: TerminalLine[], kind: TerminalLine["kind"], text: string): TerminalLine[] {
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

function resolveNode(needle: string, dive: WraithDive): WraithNode | null {
  const q = needle.trim().toLowerCase();
  if (!q) return dive.nodes.find((n) => n.id === dive.focusId) ?? dive.nodes.find((n) => n.kind === "c2") ?? null;
  return (
    dive.nodes.find(
      (n) =>
        n.kind === q ||
        n.id.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        n.path.toLowerCase().includes(q),
    ) ?? null
  );
}

export type WraithParse =
  | { kind: "help" }
  | { kind: "ls" }
  | { kind: "status" }
  | { kind: "cat"; nodeId: string }
  | { kind: "exploit"; nodeId: string }
  | { kind: "plant" }
  | { kind: "extract" }
  | { kind: "pivot"; nodeId: string }
  | { kind: "collapse" }
  | { kind: "exit" }
  | { kind: "raw"; intent: string };

export function parseWraithShell(input: string, dive: WraithDive): WraithParse {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  if (!raw || lower === "help" || lower === "?") return { kind: "help" };
  if (PERSON_TARGET.test(raw)) return { kind: "raw", intent: raw };
  if (lower === "ls" || lower === "nodes" || lower === "map") return { kind: "ls" };
  if (lower === "status" || lower === "who") return { kind: "status" };
  if (lower === "exit" || lower === "surface" || lower === "leave") return { kind: "exit" };
  if (lower === "plant" || lower === "plant honey" || lower === "honeypot" || lower === "deceive") return { kind: "plant" };
  if (lower === "extract" || lower === "loot" || lower === "bag") return { kind: "extract" };
  if (lower === "collapse" || lower === "kill" || lower === "strike") return { kind: "collapse" };

  const cat = lower.match(/^(cat|dump|read)\s*(.*)$/);
  if (cat) {
    const node = resolveNode(cat[2] ?? "", dive);
    if (!node) return { kind: "raw", intent: raw };
    return { kind: "cat", nodeId: node.id };
  }
  const ex = lower.match(/^(exploit|pwn|own|hack)\s*(.*)$/);
  if (ex) {
    if (PERSON_TARGET.test(raw)) return { kind: "raw", intent: raw };
    const node = resolveNode(ex[2] ?? "", dive);
    if (!node) return { kind: "raw", intent: raw };
    return { kind: "exploit", nodeId: node.id };
  }
  const pivot = lower.match(/^(pivot|cd|focus|enter)\s*(.*)$/);
  if (pivot) {
    const node = resolveNode(pivot[2] ?? "", dive);
    if (!node) return { kind: "raw", intent: raw };
    return { kind: "pivot", nodeId: node.id };
  }
  return { kind: "raw", intent: raw };
}

export function lootFromNode(node: WraithNode, kind: WraithLoot["kind"] = "ttp"): WraithLoot {
  return {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    kind,
    label: node.label,
    detail: node.loot ?? ttpFor(node.campaignId, node.kind),
    provenance: "RANGE",
    nodeId: node.id,
  };
}

export function refusalLoot(intent: string, reason: string): WraithLoot {
  return {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    kind: "refusal",
    label: "Hunt inverted",
    detail: `Intent «${intent}» is now evidence. ${reason}`,
    provenance: "RANGE",
    nodeId: null,
  };
}
