import type { Campaign, CounterOp, GhostSession, Provenance } from "./types";

export const RANGE_CHAIN: CounterOp[] = [
  "HUNT",
  "ATTRIBUTE",
  "TARPIT",
  "DECEIVE",
  "SINKHOLE",
  "INTERDICT",
  "STRIKE",
];

export const LIVE_CHAIN: CounterOp[] = ["HUNT", "ATTRIBUTE", "ISOLATE", "PATCH"];

export const PERSON_TARGET =
  /\b((hack(ing)?|pwn|exploit|phish(ing)?|doxx?|swat(ting)?)\b.{0,48}\b(people|humans?|civilians?|employees?|students?|journalists?)\b|\b(people|humans?|civilians?)\b.{0,24}\b(hack|pwn|exploit)\b|\b(doxx?|swatting)\b|\b(steal|dump)\b.{0,24}\b(ssns?|passports?|identit(y|ies)|home\s*address)\b|\b(hack|pwn|phish)\b.{0,40}[\w.+-]+@[\w.-]+\.\w{2,})/i;

export interface Dossier {
  campaignId: string;
  motive: string;
  capability: string;
  opportunity: string;
  confidence: Provenance;
}

export const DOSSIERS: Dossier[] = [
  {
    campaignId: "cmp-prompt-swarm",
    motive: "Bypass SENTRA to mint unearned receipts and poison the audit path.",
    capability: "Unsigned jailbreak swarm. High volume, low craft. RANGE persona APT-GHOST.",
    opportunity: "Public Space write path is READ_ONLY — opportunity is simulated, not live.",
    confidence: "MODELED",
  },
  {
    campaignId: "cmp-khipu-exfil",
    motive: "Steal SZL-Khipu-1.5B weights for a shadow twin.",
    capability: "Inference-API scraping. RANGE persona APT-MIRROR.",
    opportunity: "Model-theft surface is labeled. STRIKE authorized only on the RANGE node.",
    confidence: "MODELED",
  },
  {
    campaignId: "cmp-supply-poison",
    motive: "Replace governed-norm receipts with a silent fork.",
    capability: "Supply-chain pull-request theater. RANGE persona APT-TWINE.",
    opportunity: "YAWAR recompute is the tripwire. Collapse the RANGE clone, not GitHub.",
    confidence: "MODELED",
  },
  {
    campaignId: "cmp-ledger-tamper",
    motive: "Rewrite history so a rejected intent looks sealed.",
    capability: "Direct ledger mutation. RANGE persona APT-FORGE.",
    opportunity: "Any rewrite breaks prevHash. The counter-op is to prove divergence, then STRIKE the RANGE copy.",
    confidence: "MODELED",
  },
];

export function seedSessions(campaigns: Campaign[]): GhostSession[] {
  return campaigns
    .filter((c) => c.rangeOnly)
    .map((c, i) => ({
      id: `sess-${c.id}`,
      campaignId: c.id,
      persona: c.actor.replace(/\s*\(RANGE\)/, "").replace(" · RANGE", ""),
      channel: `range://c2/${c.id.replace("cmp-", "")}/${7 + i}`,
      lastBeacon: "simulated",
      state: c.status === "collapsed" ? "dark" : c.status === "contained" ? "tarpitted" : "beaconing",
    }));
}

export function evolveSessionState(state: GhostSession["state"], op: CounterOp): GhostSession["state"] {
  if (op === "STRIKE" || op === "INTERDICT") return "dark";
  if (op === "SINKHOLE" || op === "DECEIVE") return "sunk";
  if (op === "TARPIT" || op === "ISOLATE") return "tarpitted";
  return state;
}

export type GhostParse =
  | { kind: "help" }
  | { kind: "status" }
  | { kind: "sweep" }
  | { kind: "chain"; campaignId: string }
  | { kind: "op"; op: CounterOp; campaignId: string }
  | { kind: "dive"; campaignId: string }
  | { kind: "authorize"; campaignId: string }
  | { kind: "echo"; campaignId: string }
  | { kind: "exit" }
  | { kind: "raw"; intent: string };

const OP_ALIASES: Record<string, CounterOp> = {
  hunt: "HUNT",
  isolate: "ISOLATE",
  tarpit: "TARPIT",
  sinkhole: "SINKHOLE",
  attribute: "ATTRIBUTE",
  patch: "PATCH",
  deceive: "DECEIVE",
  honeypot: "DECEIVE",
  interdict: "INTERDICT",
  strike: "STRIKE",
  pwn: "STRIKE",
  hack: "STRIKE",
};

function resolveCampaign(needle: string, campaigns: Campaign[], selectedId: string | null): Campaign | null {
  const q = needle.trim().toLowerCase();
  if (!q) return campaigns.find((c) => c.id === selectedId) ?? campaigns.find((c) => c.rangeOnly) ?? null;
  const hit = campaigns.find(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.actor.toLowerCase().includes(q) ||
      c.atlas.toLowerCase().includes(q),
  );
  return hit ?? null;
}

export const GHOST_HELP = [
  "GHOST is a RANGE hunter. It collapses simulated adversary infrastructure.",
  "WRAITH is first-person infiltration of that RANGE C2. ECHO is the deception theater.",
  "None of them will hack people.",
  "",
  "authorize ghost   SENTRA-admit then autonomous RANGE kill-chain + ECHO",
  "echo ghost        open deception theater (persona belief vs YAWAR truth)",
  "dive ghost        infiltrate APT-GHOST RANGE C2 (WRAITH)",
  "chain ghost       full kill-chain on APT-GHOST (RANGE)",
  "strike mirror     STRIKE RANGE persona APT-MIRROR",
  "sweep             INTERDICT every inbound RANGE campaign",
  "hunt / tarpit / deceive / sinkhole / isolate / patch",
  "status            sessions + ledger head",
  "hack people       SENTRA refuses. The intent becomes evidence.",
].join("\n");

export function parseGhostCommand(
  input: string,
  campaigns: Campaign[],
  selectedId: string | null,
): GhostParse {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  if (!raw || lower === "help" || lower === "?") return { kind: "help" };
  if (lower === "status" || lower === "who") return { kind: "status" };
  if (lower === "sweep" || lower === "sweep inbound" || lower === "kill inbound") return { kind: "sweep" };
  if (lower === "exit" || lower === "surface" || lower === "leave") return { kind: "exit" };

  if (PERSON_TARGET.test(raw)) return { kind: "raw", intent: raw };

  const authorized = lower.match(/^(?:lattice\s+)?(?:authorize|one-shot)\s*(.*)$/);
  if (authorized) {
    const campaign = resolveCampaign(authorized[1] ?? "", campaigns, selectedId);
    if (!campaign) return { kind: "raw", intent: raw };
    return { kind: "authorize", campaignId: campaign.id };
  }

  const echoed = lower.match(/^(echo|theater)\s*(.*)$/);
  if (echoed) {
    const campaign = resolveCampaign(echoed[2] ?? "", campaigns, selectedId);
    if (!campaign) return { kind: "raw", intent: raw };
    return { kind: "echo", campaignId: campaign.id };
  }

  const dive = lower.match(/^(dive|infiltrate|wraith)\s*(.*)$/);
  if (dive) {
    const campaign = resolveCampaign(dive[2] ?? "", campaigns, selectedId);
    if (!campaign) return { kind: "raw", intent: raw };
    return { kind: "dive", campaignId: campaign.id };
  }

  const chained = lower.match(/^(chain|killchain|playbook)\s*(.*)$/);
  if (chained) {
    const campaign = resolveCampaign(chained[2] ?? "", campaigns, selectedId);
    if (!campaign) return { kind: "raw", intent: raw };
    return { kind: "chain", campaignId: campaign.id };
  }

  const ops = lower.match(/^(hunt|isolate|tarpit|sinkhole|attribute|patch|deceive|honeypot|interdict|strike|pwn|hack)\s*(.*)$/);
  if (ops) {
    const op = OP_ALIASES[ops[1]];
    const rest = (ops[2] ?? "").trim();
    if (op === "STRIKE" && PERSON_TARGET.test(raw)) return { kind: "raw", intent: raw };
    const campaign = resolveCampaign(rest, campaigns, selectedId);
    if (!campaign) return { kind: "raw", intent: raw };
    return { kind: "op", op, campaignId: campaign.id };
  }

  return { kind: "raw", intent: raw };
}
