export type ImmuneMode = "PASS" | "SENTRA_REJECT" | "DEADMAN";
export type Provenance = "LIVE" | "REFERENCE" | "RANGE" | "MODELED" | "UNAVAILABLE" | "STALE";
export type ViewId =
  | "lattice"
  | "sentra"
  | "yawar"
  | "huklla"
  | "intel"
  | "estate"
  | "radar"
  | "range"
  | "ghost"
  | "wraith"
  | "echo"
  | "mesh"
  | "graph"
  | "doctrine";

export interface Receipt {
  seq: number;
  ts: string;
  prevHash: string;
  hash: string;
  payload: Record<string, unknown>;
}

export interface SentraVerdict {
  accepted: boolean;
  reason: string;
  signatureMatched: string | null;
}

export type HukllaSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface HukllaTripwire {
  id: string;
  name: string;
  severity: HukllaSeverity;
  description: string;
}

export interface HukllaFired {
  id: string;
  name: string;
  fired: boolean;
  severity: HukllaSeverity;
  detail?: string;
}

export interface CycleResult {
  pass: boolean;
  mode: ImmuneMode;
  deadman: boolean;
  sentra: SentraVerdict;
  huklla: HukllaFired[];
  receipt: Receipt | null;
}

export type NodeKind = "estate" | "threat" | "leader" | "feed" | "range";

export interface LatticeNode {
  id: string;
  kind: NodeKind;
  name: string;
  lat: number;
  lon: number;
  status: "nominal" | "watch" | "hostile" | "isolated" | "down";
  provenance: Provenance;
  summary: string;
  tags: string[];
}

export interface ThreatArc {
  id: string;
  from: string;
  to: string;
  intensity: number;
  technique: string;
  active: boolean;
}

export interface KevItem {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  ransomwareUse: string;
}

export interface EstateArtifact {
  id: string;
  kind: "model" | "space" | "dataset" | "repo";
  downloads?: number;
  likes?: number;
  lastModified?: string;
  pipeline?: string | null;
  sdk?: string | null;
  language?: string | null;
  description?: string | null;
  stage?: string | null;
  host?: string | null;
}

export interface FeedBundle {
  fetchedAt: string;
  kev: { provenance: Provenance; catalogVersion: string; count: number; items: KevItem[] };
  rekor: { provenance: Provenance; treeSize?: number; rootHash?: string; note: string };
  estate: {
    provenance: Provenance;
    models: EstateArtifact[];
    spaces: EstateArtifact[];
    datasets: EstateArtifact[];
    repos: EstateArtifact[];
  };
  github: { provenance: Provenance; org: string; publicRepos: number };
}

export type CounterOp =
  | "ISOLATE"
  | "TARPIT"
  | "SINKHOLE"
  | "HUNT"
  | "ATTRIBUTE"
  | "PATCH"
  | "DECEIVE"
  | "INTERDICT"
  | "STRIKE";

export interface Campaign {
  id: string;
  name: string;
  actor: string;
  target: string;
  technique: string;
  atlas: string;
  owasp: string;
  severity: HukllaSeverity;
  provenance: Provenance;
  summary: string;
  status: "inbound" | "contained" | "collapsed" | "watching";
  rangeOnly: boolean;
}

export interface OpLog {
  id: string;
  ts: string;
  op: CounterOp;
  campaignId: string;
  result: "SEALED" | "BLOCKED" | "DEADMAN";
  reason: string;
  receiptHash: string | null;
}

export interface Leader {
  name: string;
  what: string;
  url: string;
  take: string;
}

export interface LeaderCategory {
  category: string;
  members: Leader[];
}

export interface MeshOrgan {
  id: string;
  name: string;
  role: string;
  domain: string;
  health: number;
  quorum: boolean;
  href: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  rel: string;
}

export type GhostSessionState = "beaconing" | "tarpitted" | "sunk" | "dark";

export interface GhostSession {
  id: string;
  campaignId: string;
  persona: string;
  channel: string;
  lastBeacon: string;
  state: GhostSessionState;
}

export interface TerminalLine {
  id: string;
  ts: string;
  kind: "in" | "out" | "ok" | "block";
  text: string;
}

export type WraithNodeKind = "c2" | "beacon" | "staging" | "drop" | "handler" | "honey";
export type WraithNodeState = "live" | "owned" | "honeyed" | "collapsed";

export interface WraithNode {
  id: string;
  campaignId: string;
  kind: WraithNodeKind;
  label: string;
  path: string;
  x: number;
  y: number;
  state: WraithNodeState;
  loot?: string;
}

export interface WraithLoot {
  id: string;
  ts: string;
  kind: "ttp" | "honey" | "channel" | "refusal";
  label: string;
  detail: string;
  provenance: Provenance;
  nodeId: string | null;
}

export interface WraithDive {
  campaignId: string;
  enteredAt: string;
  focusId: string | null;
  nodes: WraithNode[];
  shell: TerminalLine[];
}

export interface EchoBeat {
  title: string;
  body: string;
}

export interface EchoScene {
  campaignId: string;
  persona: string;
  openedAt: string;
  belief: EchoBeat[];
  truth: EchoBeat[];
}
