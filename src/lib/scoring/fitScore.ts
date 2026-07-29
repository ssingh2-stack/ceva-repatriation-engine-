import type { FuneralHome, Signal, FitResult, Tier } from "@/lib/types";
import { INTENT_KEYS } from "@/lib/signals/detectors";
import { STRATEGIC_MIN_FREIGHT_CAD, AVG_FREIGHT_CAD } from "@/lib/config";

// Hard gates run first — a fail short-circuits to excluded with a reason
// (logged upstream, never silently dropped). Survivors get a weighted 0-100
// fit base, an intent multiplier, an A/B/C tier, and a strategic flag.

// Full GTA footprint (gate). High-immigrant subset lives in detectors.ts.
const GTA = [
  "Brampton",
  "Mississauga",
  "Scarborough",
  "North York",
  "Markham",
  "Etobicoke",
  "Richmond Hill",
  "Vaughan",
  "Ajax",
  "Pickering",
  "Toronto",
  "Oakville",
  "Burlington",
  "Milton",
  "Oshawa",
  "Whitby",
  "Newmarket",
  "Aurora",
  "Caledon",
  "King City",
  "Georgetown",
  "Stouffville",
];

// High-immigrant subset — used as a volume-estimate bonus (mirrors detectors).
const HIGH_IMMIGRANT = new Set([
  "Brampton",
  "Mississauga",
  "Scarborough",
  "North York",
  "Markham",
  "Etobicoke",
  "Richmond Hill",
  "Vaughan",
  "Ajax",
  "Pickering",
  "Toronto",
]);

// Sum of non-intent weights an excellent-but-realistic home hits. Scores cap at 100.
const SCORE_CEILING = 78;

export function gateReason(h: FuneralHome): string | null {
  if (!GTA.includes(h.municipality)) return `Outside GTA (${h.municipality})`;
  const handlesRemains =
    h.hasRepatriationPage ||
    h.worldwideShipping ||
    h.embalmingForTransport ||
    h.consularCoordination ||
    h.repatriationDestinations.length > 0 ||
    h.communities.length > 0;
  if (!handlesRemains) return "No repatriation/remains-handling signal (cemetery-only or out of scope)";
  return null;
}

export function tierFor(score: number): Tier {
  return score >= 70 ? "A" : score >= 45 ? "B" : "C";
}

export function fitScore(home: FuneralHome, signals: Signal[]): FitResult {
  const reason = gateReason(home);
  if (reason) {
    return {
      passedGates: false,
      gateReason: reason,
      fitBase: 0,
      intentMultiplier: 1,
      score: 0,
      tier: "C",
      estMonthlyCases: 0,
      estAnnualFreightCad: 0,
      strategicAccount: false,
      signals,
    };
  }

  const base = signals
    .filter((s) => s.present && !INTENT_KEYS.has(s.key))
    .reduce((a, s) => a + s.weight, 0);
  const fitBase = Math.min(100, Math.round((base / SCORE_CEILING) * 100));

  const intentCount = signals.filter((s) => s.present && INTENT_KEYS.has(s.key)).length;
  const intentMultiplier = Math.min(1.2, 1 + 0.06 * intentCount);

  const score = Math.min(100, Math.round(fitBase * intentMultiplier));

  // Volume proxy → deal size → strategic flag. Deterministic heuristic.
  const estMonthlyCases = Math.max(
    1,
    Math.round(
      home.communities.length * 1.5 +
        (home.locationsCount - 1) * 2 +
        home.repatriationDestinations.length * 0.5 +
        (HIGH_IMMIGRANT.has(home.municipality) ? 3 : 0),
    ),
  );
  const estAnnualFreightCad = estMonthlyCases * 12 * AVG_FREIGHT_CAD;
  const strategicAccount = estAnnualFreightCad >= STRATEGIC_MIN_FREIGHT_CAD;

  return {
    passedGates: true,
    fitBase,
    intentMultiplier,
    score,
    tier: tierFor(score),
    estMonthlyCases,
    estAnnualFreightCad,
    strategicAccount,
    signals,
  };
}
