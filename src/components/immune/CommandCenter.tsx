import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Globe2, Radio, Shield, Fingerprint, Boxes, Swords, Lock, Activity, Network, Share2, Ghost, ScanEye, Split, Cpu, Map } from "lucide-react";
import { LatticeGlobe } from "./LatticeGlobe";
import {
  CommandDock,
  DoctrineView,
  EstateView,
  GhostView,
  GraphView,
  HukllaView,
  Inspector,
  IntelView,
  MeshView,
  RadarView,
  FieldView,
  RangeView,
  SentraView,
  StatusBar,
  ThreatRail,
  YawarView,
} from "./panels";
import { WraithView } from "./WraithView";
import { EchoView } from "./EchoView";
import { getLiveFeeds } from "@/lib/immune/feeds";
import { useImmune } from "@/lib/immune/store";
import type { ViewId } from "@/lib/immune/types";
import { cn } from "@/lib/utils";

const VIEWS: { id: ViewId; label: string; icon: typeof Globe2 }[] = [
  { id: "lattice", label: "Lattice", icon: Globe2 },
  { id: "sentra", label: "Sentra", icon: Shield },
  { id: "yawar", label: "Yawar", icon: Lock },
  { id: "huklla", label: "Huklla", icon: Radio },
  { id: "intel", label: "Intel", icon: Activity },
  { id: "estate", label: "Estate", icon: Boxes },
  { id: "radar", label: "Radar", icon: Cpu },
  { id: "field", label: "Field", icon: Map },
  { id: "range", label: "Range", icon: Swords },
  { id: "ghost", label: "Ghost", icon: Ghost },
  { id: "wraith", label: "Wraith", icon: ScanEye },
  { id: "echo", label: "Echo", icon: Split },
  { id: "mesh", label: "Mesh", icon: Network },
  { id: "graph", label: "Graph", icon: Share2 },
  { id: "doctrine", label: "Doctrine", icon: Fingerprint },
];

export function CommandCenter() {
  const view = useImmune((s) => s.view);
  const setView = useImmune((s) => s.setView);
  const mode = useImmune((s) => s.mode);
  const hydrate = useImmune((s) => s.hydrate);
  const setFeeds = useImmune((s) => s.setFeeds);

  const feedsQuery = useQuery({
    queryKey: ["immune", "feeds"],
    queryFn: () => getLiveFeeds(),
    refetchInterval: 5 * 60_000,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (feedsQuery.data) setFeeds(feedsQuery.data, null);
    else if (feedsQuery.error) setFeeds(null, feedsQuery.error.message);
  }, [feedsQuery.data, feedsQuery.error, setFeeds]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg text-fg">
      <div className="hologrid pointer-events-none absolute inset-0 opacity-60" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
      <div className="vignette pointer-events-none absolute inset-0" />

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-bg focus:px-4 focus:py-2">
        Skip to command
      </a>

      <header className="relative z-20 flex flex-wrap items-center gap-3 border-b border-border bg-bg/80 px-3 py-3 backdrop-blur-sm sm:px-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-md border",
              mode === "DEADMAN" ? "border-danger text-danger" : "border-primary text-primary",
            )}
          >
            <Globe2 className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-[0.18em] sm:text-lg">IMMUNE</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Lattice · verifiable AI defense
            </p>
          </div>
        </div>
        <nav className="flex w-full gap-1 overflow-x-auto pb-1 sm:ml-auto sm:w-auto sm:pb-0" aria-label="Surfaces">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const active = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium",
                  active ? "bg-primary text-primary-fg" : "text-muted hover:bg-bg-subtle hover:text-fg",
                )}
              >
                <Icon className="size-3.5" />
                {v.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main id="main-content" className="relative z-10 grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(260px,320px)]">
        <div className="order-2 min-h-0 max-h-[42vh] border-b border-border p-3 lg:order-1 lg:max-h-none lg:border-b-0 lg:border-r lg:p-4">
          <ThreatRail />
        </div>

        <section className="relative order-1 h-[46vh] min-h-[280px] overflow-hidden lg:order-2 lg:h-auto lg:min-h-0">
          {(view === "lattice" || view === "mesh" || view === "graph" || view === "ghost" || view === "wraith" || view === "echo") && (
            <>
              <LatticeGlobe />
              {view === "lattice" && (
                <div className="pointer-events-none absolute left-4 top-4 rounded-sm border border-border bg-bg/70 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                  Drag to orbit · click a node
                </div>
              )}
            </>
          )}
          {view !== "lattice" && (
            <div
              className={cn(
                "absolute inset-0 overflow-y-auto p-3 sm:p-4",
                (view === "mesh" || view === "graph" || view === "ghost" || view === "wraith" || view === "echo") && "bg-bg/55 backdrop-blur-[2px]",
              )}
            >
              {view === "sentra" && <SentraView />}
              {view === "yawar" && <YawarView />}
              {view === "huklla" && <HukllaView />}
              {view === "intel" && <IntelView />}
              {view === "estate" && <EstateView />}
              {view === "radar" && <RadarView />}
              {view === "field" && <FieldView />}
              {view === "range" && <RangeView />}
              {view === "ghost" && <GhostView />}
              {view === "wraith" && <WraithView />}
              {view === "echo" && <EchoView />}
              {view === "mesh" && <MeshView />}
              {view === "graph" && <GraphView />}
              {view === "doctrine" && <DoctrineView />}
            </div>
          )}
        </section>

        <div className="order-3 min-h-0 max-h-[48vh] border-t border-border p-3 lg:max-h-none lg:border-l lg:border-t-0 lg:p-4">
          <Inspector />
        </div>
      </main>

      <div className="relative z-20">
        <CommandDock />
        <StatusBar />
      </div>
    </div>
  );
}
