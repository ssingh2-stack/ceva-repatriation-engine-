import Link from "next/link";
import { notFound } from "next/navigation";
import { getPipeline } from "@/lib/pipeline";
import { PAIN_LABEL, PAIN_VALUE_PROP } from "@/lib/scoring/painBucket";
import { renderSequence } from "@/lib/sequence/templates";
import { CHANNEL_LABEL } from "@/lib/sequence/templates";
import { PageHeader, Stat, TierBadge, PainBadge, OwnershipBadge, StrategicStar, money } from "../../components/ui";

export const dynamic = "force-dynamic";

export default function AccountPage({ params }: { params: { id: string } }) {
  const r = getPipeline();
  const sc = r.homes.find((h) => h.home.id === params.id);
  if (!sc) notFound();

  const { home, fit, pain } = sc;
  const present = fit.signals.filter((s) => s.present);
  const absent = fit.signals.filter((s) => !s.present);
  const steps = renderSequence(home, pain.primary);

  return (
    <div className="space-y-7">
      <div>
        <Link href="/" className="text-xs text-accent hover:underline">← Accounts</Link>
      </div>

      <PageHeader
        title={home.name}
        subtitle={`${home.address}, ${home.municipality}`}
        right={
          <div className="flex items-center gap-2">
            <StrategicStar on={fit.strategicAccount} />
            <TierBadge tier={fit.tier} />
            <OwnershipBadge ownership={home.ownership} parent={home.corporateParent} />
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Fit score" value={fit.score} accent sub={`base ${fit.fitBase} × intent ${fit.intentMultiplier.toFixed(2)}`} />
        <Stat label="Primary pain" value={PAIN_LABEL[pain.primary]} />
        <Stat label="Est. cases / mo" value={fit.estMonthlyCases} />
        <Stat label="Est. freight / yr" value={money(fit.estAnnualFreightCad)} sub={fit.strategicAccount ? "strategic" : undefined} />
      </div>

      {/* Signal breakdown */}
      <section>
        <h2 className="text-sm font-semibold mb-2.5">Signal breakdown</h2>
        <div className="rounded-xl border border-edge overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-panel/70 text-muted text-xs">
              <tr>
                <th className="text-left font-medium px-3 py-2">Signal</th>
                <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Category</th>
                <th className="text-center font-medium px-3 py-2">Present</th>
                <th className="text-right font-medium px-3 py-2">Pts</th>
                <th className="text-left font-medium px-3 py-2">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {[...present, ...absent].map((s) => (
                <tr key={s.key} className={s.present ? "" : "opacity-45"}>
                  <td className="px-3 py-2 font-medium">{s.label}</td>
                  <td className="px-3 py-2 text-muted text-xs hidden sm:table-cell">{s.category}</td>
                  <td className="px-3 py-2 text-center">{s.present ? "✓" : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted">{s.present ? s.weight : 0}</td>
                  <td className="px-3 py-2 text-xs text-muted">{s.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sequence preview */}
      <section>
        <div className="flex items-center gap-2 mb-2.5">
          <h2 className="text-sm font-semibold">Outreach sequence</h2>
          <PainBadge pain={pain.primary} label={PAIN_LABEL[pain.primary]} />
          <span className="text-xs text-muted">→ {PAIN_VALUE_PROP[pain.primary]}</span>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="rounded-xl border border-edge bg-panel/40 px-4 py-3">
              <div className="text-xs text-muted mb-1.5">
                Day {step.day} · {CHANNEL_LABEL[step.channel]}
                {step.subject && <span className="text-strong font-medium"> · {step.subject}</span>}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-strong/90">{step.body}</pre>
            </div>
          ))}
        </div>
      </section>

      {/* Provenance */}
      <section>
        <h2 className="text-sm font-semibold mb-2.5">Sources</h2>
        <ul className="text-xs text-muted space-y-1">
          {home.sources.map((u) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noreferrer" className="text-accent hover:underline break-all">
                {u}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
