import { createServerFn } from "@tanstack/react-start";
import type { EstateArtifact, FeedBundle, KevItem, Provenance } from "./types";

const UA = "Mozilla/5.0 IMMUNE-Lattice/1.0 (SZL Holdings; +https://a-11-oy.com)";
const TTL_MS = 5 * 60 * 1000;

let cache: { at: number; value: FeedBundle } | null = null;

const KEV_FALLBACK: KevItem[] = [
  {
    cveID: "CVE-2023-49105",
    vendorProject: "ownCloud",
    product: "ownCloud",
    vulnerabilityName: "ownCloud Improper Authentication Vulnerability",
    dateAdded: "2026-08-27",
    shortDescription: "Improper authentication allows file access if the username is known and no signing-key is configured.",
    ransomwareUse: "Unknown",
  },
  {
    cveID: "CVE-2026-53362",
    vendorProject: "Linux",
    product: "Kernel",
    vulnerabilityName: "Linux Kernel Unspecified Vulnerability",
    dateAdded: "2026-08-27",
    shortDescription: "Privilege escalation via the IPv6 networking subsystem.",
    ransomwareUse: "Unknown",
  },
  {
    cveID: "CVE-2026-8452",
    vendorProject: "Citrix",
    product: "NetScaler ADC and NetScaler Gateway",
    vulnerabilityName: "Citrix NetScaler Memory Buffer Vulnerability",
    dateAdded: "2026-08-26",
    shortDescription: "Improper restriction of operations within a memory buffer; denial of service.",
    ransomwareUse: "Unknown",
  },
  {
    cveID: "CVE-2025-55182",
    vendorProject: "Meta",
    product: "React Server Components",
    vulnerabilityName: "Meta React Server Components Remote Code Execution Vulnerability",
    dateAdded: "2025-12-05",
    shortDescription: "Unauthenticated RCE via crafted payloads to React Server Function endpoints.",
    ransomwareUse: "Known",
  },
  {
    cveID: "CVE-2026-60004",
    vendorProject: "Gitea",
    product: "Gitea",
    vulnerabilityName: "Gitea Code Injection Vulnerability",
    dateAdded: "2026-08-25",
    shortDescription: "Malicious patch to the diffpatch API can plant a Git hook as the service account.",
    ransomwareUse: "Unknown",
  },
];

async function pullJson<T>(url: string, timeoutMs = 12000): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch failed" };
  } finally {
    clearTimeout(timer);
  }
}

function mapModels(raw: unknown[]): EstateArtifact[] {
  return raw.slice(0, 40).map((item) => {
    const r = item as Record<string, unknown>;
    return {
      id: String(r.id ?? r.modelId ?? "unknown"),
      kind: "model",
      downloads: Number(r.downloads ?? 0),
      likes: Number(r.likes ?? 0),
      lastModified: String(r.lastModified ?? ""),
      pipeline: (r.pipeline_tag as string | null) ?? null,
    };
  });
}

function mapSpaces(raw: unknown[]): EstateArtifact[] {
  return raw.slice(0, 40).map((item) => {
    const r = item as Record<string, unknown>;
    const runtime = r.runtime as Record<string, unknown> | undefined;
    return {
      id: String(r.id ?? "unknown"),
      kind: "space",
      likes: Number(r.likes ?? 0),
      lastModified: String(r.lastModified ?? r.createdAt ?? ""),
      sdk: (r.sdk as string | null) ?? null,
      stage: (runtime?.stage as string | null) ?? null,
    };
  });
}

function mapDatasets(raw: unknown[]): EstateArtifact[] {
  return raw.slice(0, 30).map((item) => {
    const r = item as Record<string, unknown>;
    return {
      id: String(r.id ?? "unknown"),
      kind: "dataset",
      downloads: Number(r.downloads ?? 0),
      likes: Number(r.likes ?? 0),
      lastModified: String(r.lastModified ?? ""),
    };
  });
}

function mapRepos(raw: unknown[]): EstateArtifact[] {
  return raw.slice(0, 40).map((item) => {
    const r = item as Record<string, unknown>;
    return {
      id: String(r.full_name ?? r.name ?? "unknown"),
      kind: "repo",
      lastModified: String(r.pushed_at ?? r.updated_at ?? ""),
      language: (r.language as string | null) ?? null,
      description: (r.description as string | null) ?? null,
    };
  });
}

async function attachSpaceRuntimes(spaces: EstateArtifact[]): Promise<EstateArtifact[]> {
  const out: EstateArtifact[] = [];
  const stride = 6;
  for (let i = 0; i < spaces.length; i += stride) {
    const slice = spaces.slice(i, i + stride);
    const batch = await Promise.all(
      slice.map(async (space) => {
        if (space.stage) return space;
        const res = await pullJson<{
          runtime?: { stage?: string };
          host?: string;
          sdk?: string;
        }>(`https://huggingface.co/api/spaces/${encodeURIComponent(space.id)}`, 8000);
        if (!res.ok) return { ...space, stage: space.stage ?? "UNKNOWN" };
        return {
          ...space,
          stage: res.data.runtime?.stage ?? space.stage ?? "UNKNOWN",
          host: res.data.host ?? space.host ?? null,
          sdk: space.sdk ?? res.data.sdk ?? null,
        };
      }),
    );
    out.push(...batch);
  }
  return out;
}

export const getLiveFeeds = createServerFn({ method: "GET" }).handler(async (): Promise<FeedBundle> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const [kevRes, rekorRes, modelsRes, spacesRes, datasetsRes, reposRes, orgRes] = await Promise.all([
    pullJson<{ catalogVersion?: string; count?: number; vulnerabilities?: KevItem[] }>(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      20000,
    ),
    pullJson<{ treeSize?: number; rootHash?: string }>("https://rekor.sigstore.dev/api/v1/log"),
    pullJson<unknown[]>("https://huggingface.co/api/models?author=SZLHOLDINGS&limit=50&sort=lastModified"),
    pullJson<unknown[]>("https://huggingface.co/api/spaces?author=SZLHOLDINGS&limit=50"),
    pullJson<unknown[]>("https://huggingface.co/api/datasets?author=SZLHOLDINGS&limit=30"),
    pullJson<unknown[]>("https://api.github.com/orgs/szl-holdings/repos?per_page=100&sort=updated"),
    pullJson<{ public_repos?: number }>("https://api.github.com/orgs/szl-holdings"),
  ]);

  const kevItems = kevRes.ok
    ? [...(kevRes.data.vulnerabilities ?? [])]
        .sort((a, b) => String(b.dateAdded).localeCompare(String(a.dateAdded)))
        .slice(0, 16)
    : KEV_FALLBACK;

  const bundle: FeedBundle = {
    fetchedAt: new Date().toISOString(),
    kev: {
      provenance: kevRes.ok ? "LIVE" : "REFERENCE",
      catalogVersion: kevRes.ok ? String(kevRes.data.catalogVersion ?? "unknown") : "reference-seed",
      count: kevRes.ok ? Number(kevRes.data.count ?? kevItems.length) : KEV_FALLBACK.length,
      items: kevItems,
    },
    rekor: {
      provenance: rekorRes.ok ? "LIVE" : "UNAVAILABLE",
      treeSize: rekorRes.ok ? rekorRes.data.treeSize : undefined,
      rootHash: rekorRes.ok ? rekorRes.data.rootHash : undefined,
      note: rekorRes.ok
        ? "Sigstore Rekor is a public append-only transparency log. YAWAR applies the same principle to every AI-agent action."
        : "Rekor unreachable this cycle. YAWAR chain still verifies locally.",
    },
    estate: {
      provenance: modelsRes.ok || spacesRes.ok ? "LIVE" : "UNAVAILABLE",
      models: modelsRes.ok ? mapModels(modelsRes.data) : [],
      spaces: spacesRes.ok ? await attachSpaceRuntimes(mapSpaces(spacesRes.data)) : [],
      datasets: datasetsRes.ok ? mapDatasets(datasetsRes.data) : [],
      repos: reposRes.ok ? mapRepos(reposRes.data) : [],
    },
    github: {
      provenance: orgRes.ok ? "LIVE" : "UNAVAILABLE",
      org: "szl-holdings",
      publicRepos: orgRes.ok ? Number(orgRes.data.public_repos ?? 0) : 0,
    },
  };

  cache = { at: Date.now(), value: bundle };
  return bundle;
});

export const briefThreat = createServerFn({ method: "POST" })
  .validator((input: { title: string; summary: string; technique: string; provenance: Provenance }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI briefing is unavailable in this environment" };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 420,
        messages: [
          {
            role: "system",
            content:
              "You are IMMUNE Lattice, SZL Holdings' governed AI defense officer. Brief the operator. Be precise. Separate LIVE facts from MODELED recommendations. Never provide exploit code, payloads, or instructions to attack third-party systems. White-hat and defensive only. Short paragraphs. End with 3 authorized next actions from: ISOLATE, TARPIT, SINKHOLE, HUNT, ATTRIBUTE, PATCH, DECEIVE, INTERDICT, STRIKE(RANGE-only).",
          },
          {
            role: "user",
            content: `Campaign: ${data.title}\nTechnique: ${data.technique}\nProvenance: ${data.provenance}\nSummary: ${data.summary}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { ok: true as const, text: body.choices?.[0]?.message?.content ?? "" };
  });
