import type { FuneralHome, Signal, PainResult, PainKey } from "@/lib/types";

// Each pain maps to a set of signal keys. We sum the weight of PRESENT
// contributing signals per pain and take the argmax as primary (deterministic
// tie-break by PAIN_ORDER). Second-highest with non-zero weight is secondary.

export const PAIN_ORDER: PainKey[] = [
  "route_gaps",
  "airline_dependency",
  "volume_scaling",
  "documentation_burden",
  "cost_pressure",
];

// Which signal keys feed which pain. A signal can feed more than one.
export const PAIN_SIGNALS: Record<PainKey, string[]> = {
  route_gaps: ["diaspora_focus", "multi_community", "repatriation_destinations"],
  airline_dependency: ["intent_incumbent", "repatriation_page"],
  volume_scaling: ["multi_location", "high_immigrant_municipality", "multilingual_site"],
  documentation_burden: ["operational_maturity", "worldwide_shipping"],
  cost_pressure: ["established", "repatriation_page"],
};

export const PAIN_LABEL: Record<PainKey, string> = {
  route_gaps: "Hard-destination route gaps",
  airline_dependency: "Single-airline dependency",
  volume_scaling: "Volume without scale support",
  documentation_burden: "Documentation & customs burden",
  cost_pressure: "Retail airline cost pressure",
};

// Short noun phrase used inline in sequence copy ("help with {{painShort}}").
export const PAIN_SHORT: Record<PainKey, string> = {
  route_gaps: "hard-to-reach destinations",
  airline_dependency: "airline capacity",
  volume_scaling: "repatriation volume",
  documentation_burden: "export documentation",
  cost_pressure: "shipping costs",
};

export const PAIN_VALUE_PROP: Record<PainKey, string> = {
  route_gaps:
    "a multi-carrier network that reaches the hard destinations your families need, not just where one airline flies",
  airline_dependency:
    "capacity and routing that does not depend on a single airline's compassion desk",
  volume_scaling:
    "a dedicated account with priority capacity and one point of contact as your case volume grows",
  documentation_burden:
    "customs brokerage and export documentation handled end to end, so your team is not chasing permits",
  cost_pressure: "consolidated freight pricing instead of retail airline rates on every case",
};

export function painBucket(_home: FuneralHome, signals: Signal[]): PainResult {
  const present = new Set(signals.filter((s) => s.present).map((s) => s.key));
  const weightByKey = new Map(signals.map((s) => [s.key, s.weight]));

  const byPain = {} as Record<PainKey, number>;
  for (const pain of PAIN_ORDER) {
    byPain[pain] = PAIN_SIGNALS[pain]
      .filter((k) => present.has(k))
      .reduce((sum, k) => sum + (weightByKey.get(k) ?? 0), 0);
  }

  const ranked = [...PAIN_ORDER].sort((a, b) => {
    if (byPain[b] !== byPain[a]) return byPain[b] - byPain[a];
    return PAIN_ORDER.indexOf(a) - PAIN_ORDER.indexOf(b); // stable tie-break
  });

  const primary = ranked[0];
  const secondary = byPain[ranked[1]] > 0 ? ranked[1] : undefined;
  return { primary, secondary, byPain };
}
