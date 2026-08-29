import type { CounterOp } from "./types";

export type FieldVerb = "EXILE" | "MESH" | "ISOLATE" | "COMPILE" | "HUNT";

export interface FieldCell {
  id: string;
  name: string;
  verb: FieldVerb;
  op: CounterOp;
  gap: string;
  take: string;
  tweak: string;
  intent: string;
}

export interface FieldHunt {
  id: string;
  cluster: string;
  aliases: string;
  campaign: string;
  hunt: string;
  note: string;
}

/** Independently implemented. Public sources only. Never a kill chain. */
export const FIELD_CELLS: FieldCell[] = [
  {
    id: "exile",
    name: "RANGE.CLOUD.EXILE",
    verb: "EXILE",
    op: "ISOLATE",
    gap: "range.cloud.exile",
    take: "Ukraine hosted Delta cloud components abroad (Feb 2023) so missiles and wipers cannot kill the COP.",
    tweak:
      "Channel B and YAWAR live off-estate. GitHub is source of truth. Hugging Face is the running cell. One blast does not unwind receipts.",
    intent: "EXILE Channel B and YAWAR off-estate — blast radius cannot kill the chain",
  },
  {
    id: "mesh",
    name: "RANGE.FALLBACK.MESH",
    verb: "MESH",
    op: "PATCH",
    gap: "range.fallback.mesh",
    take: "Starlink kept Delta alive when fiber and towers died. Dissimilar path, not a second vendor lock.",
    tweak:
      "We do not vendor a constellation. Two transports or SENTRA fails closed. Fiber analog plus satellite analog is RANGE. A single hose is a halt.",
    intent: "MESH dissimilar transport or fail-closed — no single hose",
  },
  {
    id: "quorum",
    name: "CERT.CELL.QUORUM",
    verb: "ISOLATE",
    op: "ISOLATE",
    gap: "cert.cell.quorum",
    take: "CERT-UA plus private sector plus volunteers under fire. Decentralized C2 survived central jamming.",
    tweak:
      "A cell isolates without collapsing the mesh. Volunteer fabric is HUNT only. No DDoS. No hack-and-leak. No people.",
    intent: "ISOLATE one cell — mesh holds — volunteer hunt is hunt-only",
  },
  {
    id: "delta",
    name: "FIELD.LATTICE.DELTA",
    verb: "COMPILE",
    op: "HUNT",
    gap: "field.lattice.delta",
    take: "Delta: bottom-up map (Aerorozvidka 2016 → MoD 2023), sensors as objects, NATO CWIX, 160-requirement cyber assessment.",
    tweak:
      "Objects are Spaces, receipts, kernels, campaigns. Effectors isolate objects. Kill-zone and strike-drone language is SENTRA-blocked.",
    intent: "COMPILE map-first COP of objects not people — Channel B is the only mutate",
  },
];

export const FIELD_HUNTS: FieldHunt[] = [
  {
    id: "G0034",
    cluster: "Sandworm · APT44",
    aliases: "ELECTRUM · Telebots · Voodoo Bear · Seashell Blizzard · IRON VIKING",
    campaign: "C0028 / C0025 / C0034 Ukraine electric power",
    hunt: "caddywiper_mass_delete · industroyer_iec104_unauth · scada_iso_autorun · awfulshred_linux",
    note: "Public CERT-UA / ESET / Mandiant. Hunt OT twins on RANGE. Never a live substation.",
  },
  {
    id: "G0007-C0051",
    cluster: "APT28 Nearest Neighbor",
    aliases: "Fancy Bear · Forest Blizzard · GRU 26165",
    campaign: "C0051 dual-homed Wi-Fi adjacency (2022–2024)",
    hunt: "dual_homed_wifi_adjacency · lolbin_proc_creation · cve_2022_38028",
    note: "Public MITRE campaign against Ukraine-expertise orgs. Isolate the dual-home, do not hunt the person.",
  },
  {
    id: "UAC-WINRAR",
    cluster: "WinRAR CVE-2025-8088",
    aliases: "Russia-aligned campaigns vs Ukrainian orgs (Trend Micro 2026)",
    campaign: "Archive lure · old CVE still live a year later",
    hunt: "winrar_cve_2025_8088 · archive_lure_macro · unsigned_self_extract",
    note: "Patch/isolate the archive path. Do not open the lure to 'see'.",
  },
];
