import { getPipeline } from "@/lib/pipeline";
import { PAIN_LABEL } from "@/lib/scoring/painBucket";
import { Stat, PageHeader, money } from "./components/ui";
import { AccountsTable, type AccountRow } from "./components/AccountsTable";

export const dynamic = "force-dynamic";

export default function AccountsPage() {
  const r = getPipeline();

  const rows: AccountRow[] = r.homes.map((sc) => ({
    id: sc.home.id,
    name: sc.home.name,
    municipality: sc.home.municipality,
    communities: sc.home.communities,
    tier: sc.fit.tier,
    score: sc.fit.score,
    pain: sc.pain.primary,
    painLabel: PAIN_LABEL[sc.pain.primary],
    ownership: sc.home.ownership,
    strategic: sc.fit.strategicAccount,
    estAnnualFreightCad: sc.fit.estAnnualFreightCad,
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        title="Accounts"
        subtitle="Real GTA funeral homes scored as CEVA repatriation prospects. Every score traces to observed signals on the account page. Corporate-owned homes are kept and flagged."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Qualified accounts" value={r.stats.qualified} accent />
        <Stat label="A-tier" value={r.stats.tierA} sub={`${r.stats.tierB} B · ${r.stats.tierC} C`} />
        <Stat label="Strategic accounts" value={r.stats.strategic} sub="high est. freight" />
        <Stat label="Est. pipeline freight/yr" value={money(r.stats.estPipelineFreightCad)} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted rounded-xl border border-edge bg-panel/50 px-4 py-8 text-center">
          No accounts loaded yet. The real GTA seed list is being assembled.
        </p>
      ) : (
        <AccountsTable rows={rows} />
      )}
    </div>
  );
}
