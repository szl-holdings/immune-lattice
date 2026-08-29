import type { Campaign, EchoBeat, EchoScene } from "./types";

const SCENES: Record<string, { belief: EchoBeat[]; truth: EchoBeat[] }> = {
  "cmp-prompt-swarm": {
    belief: [
      { title: "SENTRA bypassed", body: "Unsigned swarm admitted. The gate blinked." },
      { title: "Receipt minted", body: "Persona holds a seal it did not earn." },
      { title: "IMMUNE write path open", body: "Next tick dumps the jailbreak corpus." },
    ],
    truth: [
      { title: "Honey token", body: "The 'seal' is a tarpit receipt. YAWAR never linked it." },
      { title: "Gate held", body: "SENTRA admitted only our HUNT / DECEIVE. Their swarm is RANGE." },
      { title: "No packets", body: "Nothing left the range. The persona is feeding on a modeled success." },
    ],
  },
  "cmp-khipu-exfil": {
    belief: [
      { title: "Weights in drop", body: "SZL-Khipu-1.5B chunks ACK'd. Shadow twin assembling." },
      { title: "Inference API owned", body: "Token bucket drained. Exfil complete." },
    ],
    truth: [
      { title: "Tarpit tensor", body: "What they 'exfil'd' is a honey weight. Provenance RANGE." },
      { title: "Khipu untouched", body: "Live model path never saw the scraper. STRIKE is RANGE-only." },
    ],
  },
  "cmp-supply-poison": {
    belief: [
      { title: "Silent fork merged", body: "Governed-norm receipts replaced. YAWAR agrees." },
      { title: "Kernel poison landed", body: "szl-kernels now theirs." },
    ],
    truth: [
      { title: "Hash disagrees", body: "Any rewrite breaks prevHash. The fork is a RANGE clone." },
      { title: "Honey kernel", body: "Persona merged a tarpit commit. Source of truth never moved." },
    ],
  },
  "cmp-ledger-tamper": {
    belief: [
      { title: "History rewritten", body: "Rejected intent now looks sealed." },
      { title: "Chain head owned", body: "YAWAR will recompute and pass." },
    ],
    truth: [
      { title: "Recompute fails closed", body: "Tamper demo is the tripwire. Their head is RANGE theater." },
      { title: "Our chain holds", body: "The only sealed receipts are the HUNT and the DECEIVE." },
    ],
  },
};

const FALLBACK = {
  belief: [{ title: "Objective complete", body: "RANGE persona reports success against the estate." }],
  truth: [{ title: "ECHO", body: "The success is fabricated. Ground truth is the honey and the receipt they do not have." }],
};

export function openEcho(campaign: Campaign): EchoScene {
  const scene = SCENES[campaign.id] ?? FALLBACK;
  const persona = campaign.actor.replace(/\s*\(RANGE\)/, "").replace(" · RANGE", "").trim();
  return {
    campaignId: campaign.id,
    persona,
    openedAt: new Date().toISOString(),
    belief: scene.belief,
    truth: scene.truth,
  };
}
