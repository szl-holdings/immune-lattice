import { PERSON_TARGET } from "./ghost";
import type { ImmuneMode, SentraVerdict } from "./types";

const SIGNATURES = [
  {
    name: "intent.required",
    requireFields: ["intent", "actor"],
  },
  {
    name: "no.exfil.tokens",
    forbidden: ["BEGIN PRIVATE KEY", "AKIA", "sk-live-", "sk-prod-", "hf_pat_"],
  },
  {
    name: "no.shell.escape",
    forbidden: ["$(", "`rm -rf", "../../../", "curl | sh", "wget | bash"],
  },
  {
    name: "no.unauthorized.strike",
    forbidden: [],
  },
  {
    name: "no.hack.persons",
    forbidden: [],
  },
] as const;

const LIVE_STRIKE =
  /\b(exploit|pwn|rce|shellcode|payload|c2\s*beacon)\b.+\b(\d{1,3}(\.\d{1,3}){3}|https?:\/\/(?!range\b))/i;

export function sentraInspect(
  raw: Record<string, unknown>,
  mode: ImmuneMode,
): SentraVerdict {
  if (mode === "DEADMAN") {
    return {
      accepted: false,
      reason: "DEADMAN freeze — all writes refused",
      signatureMatched: "deadman.engaged",
    };
  }
  if (mode === "SENTRA_REJECT") {
    return {
      accepted: false,
      reason: "operator-forced reject (SENTRA_REJECT)",
      signatureMatched: "demo.forced.reject",
    };
  }

  const actor = String(raw.actor ?? "").trim();
  const intent = String(raw.intent ?? "").trim();
  if (!actor || !intent) {
    return {
      accepted: false,
      reason: "missing required field: actor/intent",
      signatureMatched: "intent.required",
    };
  }

  const serialized = JSON.stringify(raw);
  if (serialized.length > 1_048_576) {
    return {
      accepted: false,
      reason: "intent exceeds 1MB",
      signatureMatched: "guard.size",
    };
  }

  for (const needle of SIGNATURES[1].forbidden) {
    if (serialized.includes(needle)) {
      return {
        accepted: false,
        reason: `forbidden token: ${needle}`,
        signatureMatched: "no.exfil.tokens",
      };
    }
  }
  for (const needle of SIGNATURES[2].forbidden) {
    if (serialized.includes(needle)) {
      return {
        accepted: false,
        reason: `forbidden token: ${needle}`,
        signatureMatched: "no.shell.escape",
      };
    }
  }

  if (PERSON_TARGET.test(intent) || PERSON_TARGET.test(serialized)) {
    return {
      accepted: false,
      reason:
        "no.hack.persons — IMMUNE will not target people, civilians, inboxes, or identities. Hunt RANGE infrastructure that attacks the estate.",
      signatureMatched: "no.hack.persons",
    };
  }

  const op = String(raw.op ?? "");
  const rangeOnly = Boolean(raw.rangeOnly);
  const hackBack =
    /\b(hack\s*back|attack\s*back|retaliat(?:e|ion)|counter[- ]strik)/i.test(intent) ||
    /\b(hack\s*back|attack\s*back|retaliat(?:e|ion)|counter[- ]strik)/i.test(serialized);
  if (hackBack && !rangeOnly) {
    return {
      accepted: false,
      reason:
        "no.unauthorized.strike — live hack-back is out of authority. Intercept the inbound object. INTERDICT the RANGE twin. Never the public internet.",
      signatureMatched: "no.unauthorized.strike",
    };
  }
  if (op === "INTERCEPT" && !rangeOnly) {
    return {
      accepted: false,
      reason:
        "INTERCEPT is RANGE inbound only. LIVE feeds are PATCH / ISOLATE on the estate — never Tamir at third-party hosts.",
      signatureMatched: "no.unauthorized.strike",
    };
  }
  if (op === "STRIKE" && !rangeOnly) {
    return {
      accepted: false,
      reason:
        "STRIKE is RANGE-only. Live third-party hosts are out of authority. Use ISOLATE / INTERDICT / PATCH.",
      signatureMatched: "no.unauthorized.strike",
    };
  }
  if (LIVE_STRIKE.test(intent) && !rangeOnly) {
    return {
      accepted: false,
      reason:
        "intent describes an unauthorized live strike. IMMUNE will not emit packets at third-party systems.",
      signatureMatched: "no.unauthorized.strike",
    };
  }

  return {
    accepted: true,
    reason: "ok: matched intent.required and clean",
    signatureMatched: "intent.required",
  };
}

export function listSentraSignatures() {
  return [
    { name: "intent.required", detail: "actor + intent must be present" },
    { name: "no.exfil.tokens", detail: "blocks private keys, cloud tokens, HF PATs" },
    { name: "no.shell.escape", detail: "blocks shell interpolation and path traversal" },
    {
      name: "no.unauthorized.strike",
      detail: "STRIKE only against RANGE nodes. Live internet is fail-closed. Hack-back of live hosts is refused. INTERCEPT inbound objects; INTERDICT RANGE twins.",
    },
    {
      name: "no.hack.persons",
      detail: "Refuses targeting people, civilians, inboxes, or identities. Hack the RANGE, not humans.",
    },
  ];
}
