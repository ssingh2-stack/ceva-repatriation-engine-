import { getPipeline } from "@/lib/pipeline";
import { PageHeader, Stat, money } from "../components/ui";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  const r = getPipeline();

  return (
    <div className="space-y-7">
      <PageHeader
        title="Signals & run log"
        subtitle="What the last pipeline run produced. Discovery is deterministic: same data in, same scores out."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Seeded" value={r.stats.seeded} />
        <Stat label="Qualified" value={r.stats.qualified} accent />
        <Stat label="Excluded" value={r.stats.excluded} />
        <Stat label="Corporate (flagged)" value={r.stats.corporate} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="A-tier" value={r.stats.tierA} />
        <Stat label="B-tier" value={r.stats.tierB} />
        <Stat label="C-tier" value={r.stats.tierC} />
        <Stat label="Est. pipeline freight/yr" value={money(r.stats.estPipelineFreightCad)} />
      </div>

      {r.excluded.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2.5">Excluded ({r.excluded.length})</h2>
          <div className="rounded-xl border border-edge overflow-hidden divide-y divide-edge">
            {r.excluded.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-3.5 py-2 text-sm">
                <span className="font-medium">{e.name}</span>
                <span className="ml-auto text-xs text-muted">{e.reason}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
