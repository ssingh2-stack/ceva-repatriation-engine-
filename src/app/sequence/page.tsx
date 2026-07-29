import Link from "next/link";
import { getPipeline } from "@/lib/pipeline";
import { PAIN_ORDER, PAIN_LABEL, PAIN_VALUE_PROP } from "@/lib/scoring/painBucket";
import { renderSequence, CHANNEL_LABEL } from "@/lib/sequence/templates";
import type { PainKey } from "@/lib/types";
import { PageHeader, PainBadge } from "../components/ui";

export const dynamic = "force-dynamic";

export default function SequencePage() {
  const r = getPipeline();

  // For each pain, pick the highest-scoring real home whose primary pain matches,
  // and render its actual 5-touch sequence as the representative variant.
  const byPain = PAIN_ORDER.map((pain: PainKey) => {
    const homes = r.homes.filter((h) => h.pain.primary === pain);
    const rep = homes[0]; // homes are score-sorted
    return { pain, count: homes.length, rep };
  }).filter((x) => x.rep);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Sequences"
        subtitle="Five-touch cadences, one per pain bucket, personalized by pain × persona and filled from each home's real signals. Export all accounts to CSV for manual send."
        right={
          <a
            href="/sequence/export"
            className="rounded-lg border border-accent/40 bg-accent/10 text-accent px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-white"
          >
            ↓ Download CSV
          </a>
        }
      />

      <div className="space-y-6">
        {byPain.map(({ pain, count, rep }) => {
          const steps = renderSequence(rep!.home, pain);
          return (
            <section key={pain} className="rounded-xl border border-edge overflow-hidden">
              <div className="bg-panel/60 px-4 py-3 border-b border-edge">
                <div className="flex items-center gap-2 flex-wrap">
                  <PainBadge pain={pain} label={PAIN_LABEL[pain]} />
                  <span className="text-xs text-muted">{count} account{count === 1 ? "" : "s"}</span>
                  <span className="text-xs text-muted">
                    · sample:{" "}
                    <Link href={`/account/${rep!.home.id}`} className="text-accent hover:underline">
                      {rep!.home.name}
                    </Link>{" "}
                    ({rep!.home.contact.persona})
                  </span>
                </div>
                <p className="text-xs text-muted mt-1.5">→ {PAIN_VALUE_PROP[pain]}</p>
              </div>
              <div className="divide-y divide-edge">
                {steps.map((step, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="text-xs text-muted mb-1.5">
                      Day {step.day} · {CHANNEL_LABEL[step.channel]}
                      {step.subject && <span className="text-strong font-medium"> · {step.subject}</span>}
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-strong/90">{step.body}</pre>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {byPain.length === 0 && (
          <p className="text-sm text-muted rounded-xl border border-edge bg-panel/50 px-4 py-8 text-center">
            No sequences yet. Accounts load first.
          </p>
        )}
      </div>
    </div>
  );
}
