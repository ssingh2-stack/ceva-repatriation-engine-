import Link from "next/link";
import { getPipeline } from "@/lib/pipeline";
import { PAIN_LABEL } from "@/lib/scoring/painBucket";
import type { Tier } from "@/lib/types";
import { PageHeader, Stat, PainBadge, StrategicStar, money } from "../components/ui";

export const dynamic = "force-dynamic";

const TIER_META: Record<Tier, { title: string; action: string }> = {
  A: { title: "A · Work now", action: "Priority outreach. Strongest fit and intent." },
  B: { title: "B · Nurture", action: "Sequence and monitor for new signals." },
  C: { title: "C · Watch", action: "Low priority. Revisit if signals strengthen." },
};

export default function FunnelPage() {
  const r = getPipeline();
  const byTier = (t: Tier) => r.homes.filter((h) => h.fit.tier === t);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Funnel"
        subtitle="Routing board by tier. Strategic accounts (★) are pinned to the top of each column — high estimated freight regardless of tier."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="A-tier" value={r.stats.tierA} accent />
        <Stat label="B-tier" value={r.stats.tierB} />
        <Stat label="C-tier" value={r.stats.tierC} />
        <Stat label="Strategic" value={r.stats.strategic} sub={money(r.stats.estPipelineFreightCad) + " pipeline"} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {(["A", "B", "C"] as Tier[]).map((t) => {
          const homes = byTier(t).sort(
            (a, b) => Number(b.fit.strategicAccount) - Number(a.fit.strategicAccount) || b.fit.score - a.fit.score,
          );
          return (
            <div key={t} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">{TIER_META[t].title}</h2>
                <span className="text-xs text-muted">{homes.length}</span>
              </div>
              <p className="text-[11px] text-muted">{TIER_META[t].action}</p>
              <div className="space-y-1.5">
                {homes.map((sc) => (
                  <Link
                    key={sc.home.id}
                    href={`/account/${sc.home.id}`}
                    className="block rounded-xl border border-edge bg-panel/40 px-3 py-2.5 hover:border-accent/40 hover:bg-panel"
                  >
                    <div className="flex items-center gap-1.5">
                      <StrategicStar on={sc.fit.strategicAccount} />
                      <span className="font-medium text-sm">{sc.home.name}</span>
                      <span className="ml-auto text-xs tabular-nums text-muted">{sc.fit.score}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <PainBadge pain={sc.pain.primary} label={PAIN_LABEL[sc.pain.primary]} />
                      <span className="text-[11px] text-muted">{sc.home.municipality}</span>
                      <span className="ml-auto text-[11px] text-muted tabular-nums">{money(sc.fit.estAnnualFreightCad)}/yr</span>
                    </div>
                  </Link>
                ))}
                {homes.length === 0 && <p className="text-xs text-muted py-4 text-center">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
