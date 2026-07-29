import type {
  FuneralHome,
  PipelineResult,
  ScoredHome,
  ExcludedHome,
} from "@/lib/types";
import { getFuneralHomes } from "@/data/funeral-homes";
import { detectSignals } from "@/lib/signals/detectors";
import { fitScore } from "@/lib/scoring/fitScore";
import { painBucket } from "@/lib/scoring/painBucket";

// Orchestrates: discover → detect → score+bucket. Pure and deterministic, so
// server components can call it directly. Every gated home is logged, never
// silently dropped.

export function runPipeline(homes: FuneralHome[] = getFuneralHomes()): PipelineResult {
  const qualified: ScoredHome[] = [];
  const excluded: ExcludedHome[] = [];

  for (const home of homes) {
    const signals = detectSignals(home);
    const fit = fitScore(home, signals);
    if (!fit.passedGates) {
      excluded.push({ id: home.id, name: home.name, reason: fit.gateReason ?? "gated" });
      continue;
    }
    qualified.push({ home, fit, pain: painBucket(home, signals) });
  }

  // Prioritize by fit score, then estimated freight as a revenue proxy.
  qualified.sort(
    (a, b) => b.fit.score - a.fit.score || b.fit.estAnnualFreightCad - a.fit.estAnnualFreightCad,
  );

  const stats = {
    seeded: homes.length,
    qualified: qualified.length,
    excluded: excluded.length,
    tierA: qualified.filter((q) => q.fit.tier === "A").length,
    tierB: qualified.filter((q) => q.fit.tier === "B").length,
    tierC: qualified.filter((q) => q.fit.tier === "C").length,
    strategic: qualified.filter((q) => q.fit.strategicAccount).length,
    corporate: qualified.filter((q) => q.home.ownership === "corporate").length,
    estPipelineFreightCad: qualified.reduce((a, q) => a + q.fit.estAnnualFreightCad, 0),
  };

  return { homes: qualified, excluded, stats };
}

// Cache one run per server process so dashboard pages share results.
let cached: PipelineResult | null = null;
export function getPipeline(): PipelineResult {
  if (!cached) cached = runPipeline();
  return cached;
}
