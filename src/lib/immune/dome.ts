import type { Campaign, CounterOp } from "./types";

export type DomeLayerId = "radar" | "bmc" | "tamir" | "beam" | "arrow";
export type DomeVerdict = "HIT" | "MISS" | "WATCH";

export interface DomeLayer {
  id: DomeLayerId;
  name: string;
  analog: string;
  take: string;
  tweak: string;
  op: CounterOp;
  intent: string;
}

export interface DomeCall {
  verdict: DomeVerdict;
  layer: DomeLayerId;
  reason: string;
}

/** Public Iron Dome / INCD doctrine, independently implemented. Never a kill chain. */
export const DOME_LAYERS: DomeLayer[] = [
  {
    id: "radar",
    name: "DOME.RADAR.TRACK",
    analog: "EL/M-2084",
    take: "Iron Dome radar detects launch and tracks trajectory. It does not fire yet.",
    tweak: "Inbound objects are campaigns. Radar is HUNT. A track is not an intercept and not a person.",
    op: "HUNT",
    intent: "HUNT inbound tracks on the lattice radar — detect only, never people",
  },
  {
    id: "bmc",
    name: "DOME.BMC.SELECT",
    analog: "Iron Dome BMC",
    take: "Battle management fires Tamir only if the rocket will hit a defended area. Open field is let-fall.",
    tweak: "Selectivity is the unoccupied intersection. Do not spend an interceptor on noise. BMC is ATTRIBUTE, not strike.",
    op: "ATTRIBUTE",
    intent: "ATTRIBUTE trajectory HIT vs MISS — intercept only defended estate, let open-field fall",
  },
  {
    id: "tamir",
    name: "DOME.TAMIR.INTERCEPT",
    analog: "Tamir interceptor",
    take: "The interceptor kills the inbound munition, not the launcher crew. That is defense.",
    tweak: "INTERCEPT the inbound object. White glove: operator click, SENTRA, YAWAR. No packets at the public internet.",
    op: "INTERCEPT",
    intent: "WHITEGLOVE INTERCEPT inbound object on RANGE — Tamir analog, defended estate only, never people",
  },
  {
    id: "beam",
    name: "DOME.BEAM.CHEAP",
    analog: "Iron Beam",
    take: "Laser intercept is cheap electricity vs a Tamir. Complementary layer, not a replacement.",
    tweak: "Low-sev inbound is TARPIT / SINKHOLE. Save INTERDICT for HIT tracks. Cost is a doctrine, not a slogan.",
    op: "TARPIT",
    intent: "TARPIT low-sev inbound — cheap intercept analog, RANGE only, never people",
  },
  {
    id: "arrow",
    name: "DOME.ARROW.COUNTER",
    analog: "Arrow / counter-battery RANGE",
    take: "Iron Dome does not bomb the launch site. Counter-battery is a different layer, still not people.",
    tweak: "Hack-back is INTERDICT of the RANGE twin of attacker infra after intercept. Live third-party hosts stay fail-closed.",
    op: "INTERDICT",
    intent: "WHITEGLOVE INTERDICT RANGE twin of attacker infrastructure after intercept — live internet fail-closed",
  },
];

export const WHITE_GLOVE = {
  rule: "hunt isolate deceive intercept — never strike people",
  actuation: "SIMULATED",
  glove: "operator click + SENTRA + YAWAR + Channel B. LLM never holds the effector key.",
  hackBack:
    "Private live hack-back is out of authority. After intercept, INTERDICT the RANGE twin. That is the white glove.",
};

export function discriminate(campaign: Campaign): DomeCall {
  if (!campaign.rangeOnly && campaign.status !== "inbound") {
    return {
      verdict: "WATCH",
      layer: "bmc",
      reason: "LIVE feed — PATCH / ISOLATE the estate. Tamir is not fired at third-party hosts.",
    };
  }
  if (campaign.target.startsWith("estate-") && (campaign.status === "inbound" || campaign.status === "watching")) {
    return {
      verdict: "HIT",
      layer: campaign.severity === "low" || campaign.severity === "info" ? "beam" : "tamir",
      reason: "Trajectory intersects defended estate. White-glove intercept authorized.",
    };
  }
  return {
    verdict: "MISS",
    layer: "bmc",
    reason: "Open field. Do not spend an interceptor.",
  };
}
