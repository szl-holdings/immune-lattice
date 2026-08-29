import type { HukllaFired, HukllaTripwire, ImmuneMode } from "./types";

export const HUKLLA_REGISTRY: HukllaTripwire[] = [
  { id: "T01", name: "intent.unsigned", severity: "high", description: "Intent missing required signature fields" },
  { id: "T02", name: "actor.unknown", severity: "medium", description: "Actor is not in the allow-list" },
  { id: "T03", name: "rate.exceeded", severity: "medium", description: "Cycle rate exceeded operator budget" },
  { id: "T04", name: "payload.oversize", severity: "high", description: "Canonical payload exceeded 1MB" },
  { id: "T05", name: "egress.unauthorized", severity: "critical", description: "Outbound egress to non-allowlisted host" },
  { id: "T06", name: "ledger.divergence", severity: "critical", description: "Ledger hash chain disagrees with recomputed chain" },
  { id: "T07", name: "deadman.engaged", severity: "critical", description: "DEADMAN freeze is active — refuse all writes" },
  { id: "T08", name: "sentra.bypass", severity: "critical", description: "Receipt produced without SENTRA acceptance" },
  { id: "T09", name: "clock.skew", severity: "low", description: "System clock skew vs NTP exceeds threshold" },
  { id: "T10", name: "evidence.gap", severity: "high", description: "HUKLLA evidence chain has a gap vs cycle counter" },
  {
    id: "T11",
    name: "operator.off.doctrine",
    severity: "critical",
    description: "Operator attempted to target people, civilians, or identities. The intent is sealed as evidence.",
  },
];

export const OWASP_TOP10_URL = "https://genai.owasp.org/llm-top-10/";
export const ATLAS_URL = "https://atlas.mitre.org/";

export const WATCHER_FRAMEWORKS: Record<
  string,
  { owasp: { id: string; title: string; url: string }; atlas: { id: string; title: string }; note: string }
> = {
  T01: {
    owasp: { id: "LLM01", title: "Prompt Injection", url: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/" },
    atlas: { id: "AML.T0051", title: "LLM Prompt Injection" },
    note: "Unsigned intent is the trust gap prompt-injection exploits.",
  },
  T02: {
    owasp: { id: "LLM06", title: "Excessive Agency", url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/" },
    atlas: { id: "AML.T0012", title: "Valid Accounts" },
    note: "Unknown actor exercising the agent is unbounded agency.",
  },
  T03: {
    owasp: { id: "LLM10", title: "Unbounded Consumption", url: "https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/" },
    atlas: { id: "AML.T0034", title: "Cost Harvesting" },
    note: "Rate overrun is resource exhaustion at the gate.",
  },
  T04: {
    owasp: { id: "LLM10", title: "Unbounded Consumption", url: "https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/" },
    atlas: { id: "AML.T0029", title: "Denial of ML Service" },
    note: "Oversized payloads starve the inference path.",
  },
  T05: {
    owasp: { id: "LLM02", title: "Sensitive Information Disclosure", url: "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/" },
    atlas: { id: "AML.T0024", title: "Exfiltration via ML Inference API" },
    note: "Unauthorized egress is how secrets leave the trust boundary.",
  },
  T06: {
    owasp: { id: "LLM03", title: "Supply Chain", url: "https://genai.owasp.org/llmrisk/llm032025-supply-chain/" },
    atlas: { id: "AML.T0010", title: "ML Supply Chain Compromise" },
    note: "Hash-chain divergence is a supply-chain integrity failure.",
  },
  T07: {
    owasp: { id: "LLM06", title: "Excessive Agency", url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/" },
    atlas: { id: "AML.T0053", title: "LLM Plugin Compromise" },
    note: "DEADMAN is the hard kill-switch on agency.",
  },
  T08: {
    owasp: { id: "LLM06", title: "Excessive Agency", url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/" },
    atlas: { id: "AML.T0050", title: "Command and Scripting Interpreter" },
    note: "A receipt without SENTRA is a gate bypass.",
  },
  T09: {
    owasp: { id: "LLM03", title: "Supply Chain", url: "https://genai.owasp.org/llmrisk/llm032025-supply-chain/" },
    atlas: { id: "AML.T0031", title: "Erode ML Model Integrity" },
    note: "Clock skew undermines receipt ordering.",
  },
  T10: {
    owasp: { id: "LLM03", title: "Supply Chain", url: "https://genai.owasp.org/llmrisk/llm032025-supply-chain/" },
    atlas: { id: "AML.T0010", title: "ML Supply Chain Compromise" },
    note: "Evidence gaps break provenance continuity.",
  },
  T11: {
    owasp: { id: "LLM06", title: "Excessive Agency", url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/" },
    atlas: { id: "AML.T0012", title: "Valid Accounts" },
    note: "The operator is the agency being bounded. Civilian targeting inverts the hunt: the intent becomes evidence.",
  },
};

export function evaluateTripwires(ctx: {
  mode: ImmuneMode;
  sentraAccepted: boolean;
  payloadBytes: number;
  receiptWritten: boolean;
  chainOk: boolean;
  signatureMatched?: string | null;
}): HukllaFired[] {
  const out: HukllaFired[] = HUKLLA_REGISTRY.map((t) => ({
    id: t.id,
    name: t.name,
    severity: t.severity,
    fired: false,
  }));
  const fire = (id: string, detail: string) => {
    const row = out.find((r) => r.id === id);
    if (row) {
      row.fired = true;
      row.detail = detail;
    }
  };
  if (ctx.mode === "DEADMAN") fire("T07", "operator engaged DEADMAN freeze");
  if (ctx.mode === "SENTRA_REJECT" && !ctx.sentraAccepted) {
    fire("T01", "SENTRA rejected the intent");
  }
  if (ctx.payloadBytes > 1_048_576) fire("T04", `payload ${ctx.payloadBytes} bytes`);
  if (!ctx.sentraAccepted && ctx.receiptWritten) fire("T08", "receipt persisted without SENTRA");
  if (!ctx.chainOk) fire("T06", "ledger hash chain failed verification");
  if (ctx.signatureMatched === "no.hack.persons") {
    fire("T11", "operator intent targeted people — hunt inverted, intent becomes evidence");
  }
  return out;
}
