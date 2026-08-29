import { evaluateTripwires } from "./huklla";
import { appendReceipt, verifyChain } from "./ledger";
import { sentraInspect } from "./sentra";
import type { CounterOp, CycleResult, ImmuneMode, Receipt } from "./types";

export async function runGovernedCycle(args: {
  actor: string;
  intent: string;
  mode: ImmuneMode;
  chain: Receipt[];
  extra?: Record<string, unknown>;
}): Promise<{ result: CycleResult; chain: Receipt[] }> {
  const inspected = { actor: args.actor, intent: args.intent, ...(args.extra ?? {}) };
  const sentra = sentraInspect(inspected, args.mode);
  const chainOk = (await verifyChain(args.chain)).ok;

  let receipt: Receipt | null = null;
  let next = args.chain;
  let pass = false;

  if (args.mode !== "DEADMAN" && sentra.accepted) {
    const rec = await appendReceipt(args.chain, {
      actor: args.actor,
      intent: args.intent,
      mode: args.mode,
      sentra: { accepted: true, signatureMatched: sentra.signatureMatched },
      extra: args.extra ?? null,
    });
    next = [...args.chain, rec];
    receipt = rec;
    pass = true;
  }

  const huklla = evaluateTripwires({
    mode: args.mode,
    sentraAccepted: sentra.accepted,
    payloadBytes: JSON.stringify(inspected).length,
    receiptWritten: receipt !== null,
    chainOk,
    signatureMatched: sentra.signatureMatched,
  });

  return {
    result: {
      pass,
      mode: args.mode,
      deadman: args.mode === "DEADMAN",
      sentra,
      huklla,
      receipt,
    },
    chain: next,
  };
}

export function describeOp(op: CounterOp, campaignName: string) {
  return `${op} against ${campaignName}`;
}
