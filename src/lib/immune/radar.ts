import type { LeaderCategory } from "./types";

export type RadarVerb = "BIND" | "WRAP" | "WATCH" | "IGNORE";

export interface InferenceEngine {
  name: string;
  line: string;
  license: string;
  verb: RadarVerb;
  note: string;
  url: string;
}

export interface ActorCluster {
  id: string;
  aliases: string;
  category: string;
  techniques: string;
  hunt: string;
}

export interface UniqueGap {
  id: string;
  name: string;
  take: string;
  tweak: string;
}

export const INFERENCE_RADAR: InferenceEngine[] = [
  {
    name: "vLLM",
    line: "Production GPU server · PagedAttention",
    license: "Apache-2.0",
    verb: "BIND",
    note: "Default serving. Receipt: engine_ver, model_digest, dtype, fa_ver, cuda_ver. Fail-closed if digest unpinned.",
    url: "https://docs.vllm.ai/",
  },
  {
    name: "llama.cpp / llama-server",
    line: "Portable GGUF runtime",
    license: "MIT",
    verb: "BIND",
    note: "Airgap / edge / CPU. Pin every GGUF digest. The only honestly portable runtime.",
    url: "https://github.com/ggml-org/llama.cpp",
  },
  {
    name: "SGLang",
    line: "RadixAttention structured serving",
    license: "Apache-2.0",
    verb: "BIND",
    note: "Agents / RAG / prefix reuse. Same OpenAI surface as vLLM. Prefer when prefix-hit-rate is the SLO.",
    url: "https://github.com/sgl-project/sglang",
  },
  {
    name: "TensorRT-LLM",
    line: "NVIDIA compiled max-perf",
    license: "Apache-2.0",
    verb: "BIND",
    note: "NVIDIA on-prem only. Receipt must include engine_build_hash + TRT version.",
    url: "https://github.com/NVIDIA/TensorRT-LLM",
  },
  {
    name: "Ollama",
    line: "DX wrapper on llama.cpp",
    license: "MIT",
    verb: "BIND",
    note: "Facade, not a second engine. Always pin the underlying GGUF, never a tag like qwen2.5:14b.",
    url: "https://ollama.com/",
  },
  {
    name: "MLX",
    line: "Apple Metal arrays",
    license: "MIT",
    verb: "BIND",
    note: "Governed Mac nodes. Same receipt model as llama.cpp (weight hash + backend).",
    url: "https://github.com/ml-explore/mlx",
  },
  {
    name: "TEI",
    line: "HF embeddings / rerank server",
    license: "Apache-2.0",
    verb: "BIND",
    note: "Embeddings only. Not an LLM.",
    url: "https://github.com/huggingface/text-embeddings-inference",
  },
  {
    name: "mistral.rs",
    line: "Rust GGUF/GGML runtime",
    license: "MIT",
    verb: "BIND",
    note: "Airgap sibling of llama.cpp. Pin the GGUF digest. Receipt backend=mistralrs.",
    url: "https://github.com/EricLBuehler/mistral.rs",
  },
  {
    name: "CTranslate2",
    line: "Fast encoder + Whisper runtime",
    license: "MIT",
    verb: "BIND",
    note: "Not a chat LLM. Bind for ASR/embed. Same digest rule.",
    url: "https://github.com/OpenNMT/CTranslate2",
  },
  {
    name: "NVIDIA Dynamo",
    line: "Multi-node inference fabric",
    license: "Apache-2.0",
    verb: "WATCH",
    note: "Schedules engines. a11oy stays the policy plane above it.",
    url: "https://github.com/ai-dynamo/dynamo",
  },
  {
    name: "llm-d",
    line: "CNCF K8s distributed inference",
    license: "Apache-2.0",
    verb: "WATCH",
    note: "Closest open analog to governed inference on K8s. Align CRDs, do not fork.",
    url: "https://llm-d.ai/",
  },
  {
    name: "TGI",
    line: "HF server · archived 2026-03-21",
    license: "Apache-2.0",
    verb: "IGNORE",
    note: "Do not new-deploy. Recreate remaining endpoints on vLLM or SGLang.",
    url: "https://github.com/huggingface/text-generation-inference",
  },
  {
    name: "Aphrodite",
    line: "vLLM fork + EXL2 samplers",
    license: "AGPL-3.0",
    verb: "IGNORE",
    note: "Copyleft infects the orchestrator.",
    url: "https://github.com/dphnAI/aphrodite-engine",
  },
  {
    name: "LM Studio",
    line: "Closed desktop GUI",
    license: "Closed",
    verb: "IGNORE",
    note: "Human toy. Never on the governed path.",
    url: "https://lmstudio.ai/",
  },
  {
    name: "OpenAI / Anthropic / xAI",
    line: "Frontier closed APIs",
    license: "Closed",
    verb: "WRAP",
    note: "Stamp weights=opaque. Foreign compute only if policy says allow.",
    url: "https://platform.openai.com/",
  },
  {
    name: "Groq / Cerebras / SambaNova",
    line: "Specialty inference silicon",
    license: "Closed HW",
    verb: "WRAP",
    note: "Overflow hoses. Cannot airgap. Same opaque-weight stamp.",
    url: "https://artificialanalysis.ai/",
  },
  {
    name: "HF Inference Providers",
    line: "Multi-provider router",
    license: "SaaS",
    verb: "WRAP",
    note: "A router, not an engine. Stamp via=hf-router + downstream provider.",
    url: "https://huggingface.co/docs/inference-providers",
  },
];

export const ACTOR_CLUSTERS: ActorCluster[] = [
  {
    id: "G0016",
    aliases: "APT29 · Cozy Bear · Midnight Blizzard · NOBELIUM",
    category: "State-nexus espionage",
    techniques: "T1195 supply chain · T1078 valid accounts · OAuth token theft",
    hunt: "signed_update_hash_mismatch · ci_oidc_token_reuse",
  },
  {
    id: "G0007",
    aliases: "APT28 · Fancy Bear · Forest Blizzard",
    category: "State-nexus espionage",
    techniques: "T1566 phishing · LOTL · C0051 Nearest Neighbor",
    hunt: "proc_creation_win_lolbin_* · dual-homed Wi-Fi adjacency",
  },
  {
    id: "G0034",
    aliases: "Sandworm · APT44 · ELECTRUM · Seashell Blizzard",
    category: "State-nexus OT destruction",
    techniques: "C0028 / C0025 / C0034 Ukraine power · Industroyer · CaddyWiper",
    hunt: "caddywiper_mass_delete · industroyer_iec104_unauth · scada_iso_autorun",
  },
  {
    id: "G1017",
    aliases: "Volt Typhoon · Bronze Silhouette",
    category: "State-nexus · LOTL",
    techniques: "Living-off-the-land · T1078 as persistence on edge devices",
    hunt: "unusual native-binary chains — not malware hashes",
  },
  {
    id: "G1015",
    aliases: "Scattered Spider · UNC3944 · Octo Tempest · Storm-0875",
    category: "Identity / helpdesk social engineering",
    techniques: "MFA fatigue · SIM swap · help-desk impersonation",
    hunt: "mfa_fatigue_burst · helpdesk_reset_then_new_session",
  },
  {
    id: "G0102",
    aliases: "Wizard Spider lineage · Conti/Ryuk-era",
    category: "Ransomware-as-a-service",
    techniques: "T1486 encrypt · T1490 inhibit recovery · T1003 dump",
    hunt: "ransomware_shadow_copy_delete · vssadmin_resize",
  },
  {
    id: "C0024",
    aliases: "SolarWinds Compromise · StellarParticle",
    category: "Supply chain",
    techniques: "T1195 compromise the build, not the victim fleet",
    hunt: "slsa_valid_but_builder_identity_stolen (Shai-Hulud class)",
  },
  {
    id: "G0032",
    aliases: "Lazarus Group · Hidden Cobra · APT38",
    category: "State-nexus · financially motivated",
    techniques: "T1190 exploit public-facing · T1078 valid accounts · crypto-heist playbooks",
    hunt: "unsigned_ci_runner · anomalous_wallet_tooling_on_build_host",
  },
  {
    id: "G0096",
    aliases: "APT41 · Wicked Panda · Brass Typhoon",
    category: "State-nexus dual-use",
    techniques: "T1195 supply chain · T1053 scheduled task · dual espionage + crime",
    hunt: "night_shift_build_outside_change_window · stolen_codesign_cert",
  },
  {
    id: "G1004",
    aliases: "LAPSUS$ · DEV-0537",
    category: "Extortion / identity",
    techniques: "SIM swap · helpdesk · T1539 steal session cookie",
    hunt: "session_cookie_reuse_new_asn · helpdesk_reset_then_exfil",
  },
];

export const UNIQUE_GAPS: UniqueGap[] = [
  {
    id: "echo.receipt",
    name: "ECHO.RECEIPT.INFERENCE",
    take: "IETF draft-chueayen reinvented a tiny JSON receipt and avoided DSSE. Sigstore solved model signing. Inference decisions are paper.",
    tweak: "Every completion is an in-toto Statement in a DSSE envelope: model digest + policy-WASM digest + runtime digest + evidence_class. Logged. Offline verifiable. Fail-closed unknown fields.",
  },
  {
    id: "immune.gate",
    name: "IMMUNE.GATE.TOOLCALL",
    take: "Palantir Action Types are the only mutate path. Bedrock/Armor/NeMo filter content. LangGraph pauses for humans.",
    tweak: "Default deny. Tool binary/schema DSSE-signed and pinned. Human gate only for high-impact verbs. Unsigned = no process, no network, no model I/O.",
  },
  {
    id: "ghost.lattice",
    name: "GHOST.LATTICE.CANARY",
    take: "Anduril Lattice is a mesh of sensors. Thinkst Canary is a tripwire. Nobody composed them at AI-control-plane scale.",
    tweak: "A fabric of decoy Spaces / MCP servers / vector indexes. Real Spaces never share context with decoys. Any touch is P1 hunt, not a low-sev log.",
  },
  {
    id: "immune.compiler",
    name: "IMMUNE.COMPILER.SIGNED_KERNEL",
    take: "OPA compiles Rego to WASM. Cedar is analyzable. E2B isolates agent code. DO-178C people say AI cannot be DAL A.",
    tweak: "Doctrine v11 → sealed WASM decision cell with SLSA provenance. Channel A (LLM) is Λ=Conjecture 1 advisory. Channel B holds the only effector keys and can veto A. A cannot veto B.",
  },
  {
    id: "field.lattice.delta",
    name: "FIELD.LATTICE.DELTA",
    take: "Ukraine Delta is a map-first COP that grew bottom-up from a volunteer map into the national picture (CSIS, NATO CWIX, MoD 2023).",
    tweak: "Compile the map. Objects are Spaces, receipts, kernels. Effectors isolate objects. Kill-zone / strike-drone language is SENTRA-blocked.",
  },
  {
    id: "range.cloud.exile",
    name: "RANGE.CLOUD.EXILE",
    take: "Ukraine hosted Delta cloud abroad so missiles cannot kill the COP (gov approval Feb 2023).",
    tweak: "YAWAR + Channel B live off-estate. A cell dying does not unwind the chain. GitHub is canonical. Hugging Face is the running hologram.",
  },
  {
    id: "range.fallback.mesh",
    name: "RANGE.FALLBACK.MESH",
    take: "Starlink kept Ukrainian C2 alive when fiber and towers died. Dissimilar path, not a brand.",
    tweak: "Two transports or fail-closed. We do not vendor a constellation. A single hose is a halt.",
  },
  {
    id: "cert.cell.quorum",
    name: "CERT.CELL.QUORUM",
    take: "CERT-UA plus private sector plus volunteers foiled Industroyer2 in 2022. Decentralized C2 survived jamming.",
    tweak: "Isolate one cell, mesh holds. Volunteer fabric is HUNT only. No DDoS, no hack-and-leak, no people.",
  },
  {
    id: "immune.dome.select",
    name: "IMMUNE.DOME.SELECTIVE",
    take: "Iron Dome fires Tamir only if the rocket will hit a defended area. Open field is let-fall. Selectivity is the cost doctrine.",
    tweak: "BMC discriminates HIT / MISS / WATCH. Intercept inbound objects that will hit estate. LIVE KEV stays PATCH. Do not spend an interceptor on noise.",
  },
  {
    id: "immune.dome.glove",
    name: "IMMUNE.DOME.WHITEGLOVE",
    take: "Private hack-back of live internet is out of authority (CFAA-class). Iron Dome does not bomb the launch crew. INCD defends the edge.",
    tweak: "White glove: operator click + SENTRA + YAWAR + Channel B. After intercept, INTERDICT the RANGE twin. Never people. Never a live third-party host.",
  },
];

export const CANARIES = [
  {
    id: "canary-mcp",
    name: "Decoy MCP server",
    bait: "Unsigned tool schema. Real estate never shares context.",
  },
  {
    id: "canary-space",
    name: "Decoy Space · honey-index",
    bait: "Canary embeddings in a fake vector index. Any retrieve is P1.",
  },
  {
    id: "canary-weights",
    name: "Decoy GGUF tag",
    bait: "Unpinned tag qwen-open. A BIND against a tag (not a digest) trips.",
  },
];

export const FIELD_LEADERS: LeaderCategory[] = [
  {
    category: "Governed orchestrators",
    members: [
      {
        name: "Palantir AIP",
        what: "LLM tethered to Foundry Ontology. Agents call authorized Action Types only.",
        url: "https://www.palantir.com/platforms/aip/",
        take: "Take Action Types as the only mutate path. Tweak: they compile to a WASM cell whose hash is locked in Doctrine v11. The LLM never holds the effector key.",
      },
      {
        name: "Scale Donovan",
        what: "Federal agent factory. First LLM on a classified government network.",
        url: "https://scale.com/donovan",
        take: "Take classified-network deploy. Tweak: side-by-side Defense vs commercial is a HUD comparison, not a second authority.",
      },
      {
        name: "Google Model Armor",
        what: "Model-agnostic semantic firewall with org-wide floor settings.",
        url: "https://cloud.google.com/security/products/model-armor",
        take: "Take floor-settings. Tweak: floor = Doctrine v11 LOCKED. Templates can tighten, never loosen a PROVED check to CONJECTURE.",
      },
      {
        name: "Portkey → Prisma AIRS",
        what: "LLM control plane: 1,600+ models, virtual keys, Agent Gateway RBAC.",
        url: "https://portkey.ai/",
        take: "Closest non-Palantir control plane. Tweak: routing is WRAP. Policy stays in the decision cell.",
      },
    ],
  },
  {
    category: "Verifiable inference",
    members: [
      {
        name: "Sigstore model-transparency",
        what: "Sign/verify ML models of any size. The actual standard for weight signing.",
        url: "https://model-transparency.readthedocs.io/",
        take: "Take directory-tree hashing. Tweak: subject is (model, policy-WASM, runtime) — weight-only signing is how you get valid SLSA and a stolen builder.",
      },
      {
        name: "SLSA + in-toto + DSSE",
        what: "The only production provenance stack. Everyone else wraps this.",
        url: "https://slsa.dev/",
        take: "Take the envelope. Tweak: inference decisions, not just builds, land as Statements.",
      },
      {
        name: "IETF draft-chueayen receipts",
        what: "Compact JSON receipt: ALLOWED/BLOCKED, request_hash, hash-chained. Not a product.",
        url: "https://datatracker.ietf.org/doc/draft-chueayen-attestation-receipts/",
        take: "Take the field set and fail-closed-unknown-fields. Tweak: wrap as DSSE, log in Rekor, require evidence_class.",
      },
    ],
  },
  {
    category: "Fail-closed / dual channel",
    members: [
      {
        name: "DO-178C / IEC 61508",
        what: "Avionics and industrial safety. AI is not recommended above SIL 1. Dissimilar channels.",
        url: "https://www.rtca.org/",
        take: "Take independent envelope computers. Tweak: Channel A = LLM (advisory). Channel B = WASM cell (only effector credentials).",
      },
      {
        name: "Llama Firewall",
        what: "PromptGuard + AlignmentCheck (CoT goal-drift) + CodeShield.",
        url: "https://github.com/meta-llama/PurpleLlama",
        take: "Only OSS stack that audits agent reasoning, not just I/O. Tweak: AlignmentCheck output is evidence, never an allow.",
      },
      {
        name: "OPA / Cedar",
        what: "Compile-to-WASM policy (OPA) and formally analyzable permit/forbid (Cedar).",
        url: "https://www.openpolicyagent.org/",
        take: "Take the compile step as the product. Effector path = Cedar. Estate queries = Rego. One sealed cell.",
      },
    ],
  },
  {
    category: "Command HUD",
    members: [
      {
        name: "Anduril Lattice",
        what: "AI battle-management. Fuse sensors and effectors. Mesh at the edge.",
        url: "https://www.anduril.com/lattice/command-and-control",
        take: "Take click → machine-to-machine tasking. Tweak: effectors isolate objects (host, token, Space, kernel). Never people.",
      },
      {
        name: "Ukraine Delta",
        what: "Map-first COP. Bottom-up from Aerorozvidka. Cloud-exile. NATO CWIX. Independent 160-req cyber assessment.",
        url: "https://www.csis.org/analysis/does-ukraine-already-have-functional-cjadc2-technology",
        take: "Take the map and the exile. Tweak: we compile hunt / isolate / deceive. SENTRA blocks kill-zone language. Never people.",
      },
      {
        name: "CERT-UA",
        what: "Public UAC clusters. Foiled Industroyer2 + CaddyWiper on power (2022) with ESET / Microsoft.",
        url: "https://attack.mitre.org/groups/G0034/",
        take: "Take hunt signatures as objects. Tweak: RANGE twins only. Never a live substation.",
      },
      {
        name: "Palantir Gotham",
        what: "Object-centric intelligence OS. Mixed-reality COP.",
        url: "https://www.palantir.com/platforms/gotham/",
        take: "Take every CVE, Space, receipt, campaign as a first-class object with provenance. Never a blended live soup.",
      },
      {
        name: "CrowdStrike OverWatch",
        what: "24/7 hunting. Hunting leads as objects with fidelity scores.",
        url: "https://www.crowdstrike.com/platform/falcon-overwatch/",
        take: "Take lead-as-object. Tweak: a lead is {entity, evidence_class, doctrine_clause, receipt_id}.",
      },
      {
        name: "ATAK / TAK",
        what: "DoD-funded edge COP. Cursor-on-Target. Phone-as-TOC.",
        url: "https://tak.gov/",
        take: "Take CoT as the tactical grammar. Tweak: every action-implying event carries a receipt CID.",
      },
    ],
  },
];
