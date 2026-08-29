import type { Receipt } from "./types";

function canonical(v: unknown): string {
  if (v === null || v === undefined) return "null";
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (t === "object") {
    const o = v as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  return "null";
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function appendReceipt(
  chain: Receipt[],
  payload: Record<string, unknown>,
): Promise<Receipt> {
  const seq = chain.length;
  const prevHash = seq === 0 ? "0".repeat(64) : chain[seq - 1].hash;
  const ts = new Date().toISOString();
  const view = canonical({ seq, ts, prevHash, payload });
  const hash = await sha256Hex(view);
  return { seq, ts, prevHash, hash, payload };
}

export async function verifyChain(chain: Receipt[]): Promise<{
  ok: boolean;
  count: number;
  firstBadSeq: number | null;
  detail: string;
}> {
  if (chain.length === 0) {
    return { ok: true, count: 0, firstBadSeq: null, detail: "empty chain" };
  }
  for (let i = 0; i < chain.length; i++) {
    const r = chain[i];
    const expectedPrev = i === 0 ? "0".repeat(64) : chain[i - 1].hash;
    if (r.prevHash !== expectedPrev) {
      return {
        ok: false,
        count: chain.length,
        firstBadSeq: r.seq,
        detail: `prevHash mismatch at seq ${r.seq}`,
      };
    }
    const view = canonical({ seq: r.seq, ts: r.ts, prevHash: r.prevHash, payload: r.payload });
    const hash = await sha256Hex(view);
    if (hash !== r.hash) {
      return {
        ok: false,
        count: chain.length,
        firstBadSeq: r.seq,
        detail: `hash mismatch at seq ${r.seq}`,
      };
    }
  }
  return { ok: true, count: chain.length, firstBadSeq: null, detail: "chain recomputed clean" };
}

export { canonical };
