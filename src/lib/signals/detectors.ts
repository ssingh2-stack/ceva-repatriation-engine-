import type { FuneralHome, Signal, SignalCategory } from "@/lib/types";

// Each detector inspects a FuneralHome and emits a Signal. Non-intent weights
// feed the fit-score base; intent signals (INTENT_KEYS) feed the intent
// multiplier instead. Categories feed the pain-bucket argmax. Keep pure.

type Detector = {
  key: string;
  label: string;
  category: SignalCategory;
  weight: number;
  detect: (h: FuneralHome) => { present: boolean; evidence: string };
};

// GTA municipalities with the highest immigrant/diaspora density — the
// strongest geographic proxy for repatriation volume.
const HIGH_IMMIGRANT = [
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
];

export const detectors: Detector[] = [
  // — proven repatriation activity —
  {
    key: "repatriation_page",
    label: "Dedicated repatriation / shipping page",
    category: "repatriation",
    weight: 18,
    detect: (h) => ({
      present: h.hasRepatriationPage,
      evidence: h.hasRepatriationPage ? "Site advertises repatriation / international shipping" : "—",
    }),
  },
  {
    key: "repatriation_destinations",
    label: "Names repatriation destinations",
    category: "repatriation",
    weight: 10,
    detect: (h) => ({
      present: h.repatriationDestinations.length > 0,
      evidence: h.repatriationDestinations.join(", ") || "—",
    }),
  },
  {
    key: "worldwide_shipping",
    label: "Worldwide / international service claim",
    category: "operational",
    weight: 6,
    detect: (h) => ({
      present: h.worldwideShipping,
      evidence: h.worldwideShipping ? "Advertises worldwide shipping" : "—",
    }),
  },
  {
    key: "operational_maturity",
    label: "Embalming-for-transport / consular coordination",
    category: "operational",
    weight: 8,
    detect: (h) => ({
      present: h.embalmingForTransport || h.consularCoordination,
      evidence:
        [h.embalmingForTransport && "transport embalming", h.consularCoordination && "consular coordination"]
          .filter(Boolean)
          .join(", ") || "—",
    }),
  },
  // — diaspora volume potential —
  {
    key: "diaspora_focus",
    label: "Serves diaspora community",
    category: "community",
    weight: 14,
    detect: (h) => ({ present: h.communities.length > 0, evidence: h.communities.join(", ") || "—" }),
  },
  {
    key: "multilingual_site",
    label: "Multilingual website",
    category: "community",
    weight: 10,
    detect: (h) => ({ present: h.languages.length > 0, evidence: h.languages.join(", ") || "—" }),
  },
  {
    key: "multi_community",
    label: "Serves multiple diaspora communities",
    category: "community",
    weight: 6,
    detect: (h) => ({ present: h.communities.length >= 2, evidence: `${h.communities.length} communities` }),
  },
  // — geography —
  {
    key: "high_immigrant_municipality",
    label: "High-immigrant GTA municipality",
    category: "geography",
    weight: 8,
    detect: (h) => ({ present: HIGH_IMMIGRANT.includes(h.municipality), evidence: h.municipality }),
  },
  // — scale —
  {
    key: "multi_location",
    label: "Multiple locations",
    category: "scale",
    weight: 8,
    detect: (h) => ({ present: h.locationsCount >= 2, evidence: `${h.locationsCount} locations` }),
  },
  {
    key: "established",
    label: "Established 15+ years",
    category: "scale",
    weight: 4,
    detect: (h) => ({
      present: (h.yearsInBusiness ?? 0) >= 15,
      evidence: h.yearsInBusiness ? `${h.yearsInBusiness} years` : "—",
    }),
  },
  // — intent (feed the multiplier; weight used only for ordering/top-signal) —
  {
    key: "intent_incumbent",
    label: "Names a single airline cargo partner (displaceable)",
    category: "intent",
    weight: 5,
    detect: (h) => ({ present: !!h.namedAirlinePartner, evidence: h.namedAirlinePartner ?? "—" }),
  },
  {
    key: "intent_obituaries",
    label: "Recent obituaries name interment abroad",
    category: "intent",
    weight: 5,
    detect: (h) => ({
      present: h.obituariesMentionAbroad,
      evidence: h.obituariesMentionAbroad ? "Obituaries cite burial abroad" : "—",
    }),
  },
  {
    key: "intent_reviews",
    label: "Reviews mention repatriation",
    category: "intent",
    weight: 4,
    detect: (h) => ({
      present: h.reviewsMentionRepatriation,
      evidence: h.reviewsMentionRepatriation ? "Reviews reference repatriation" : "—",
    }),
  },
  {
    key: "intent_hiring",
    label: "Hiring / growth signal",
    category: "intent",
    weight: 3,
    detect: (h) => ({ present: h.hiring, evidence: h.hiring ? "Active hiring" : "—" }),
  },
];

export const INTENT_KEYS = new Set([
  "intent_incumbent",
  "intent_obituaries",
  "intent_reviews",
  "intent_hiring",
]);

export function detectSignals(home: FuneralHome): Signal[] {
  return detectors.map((d) => {
    const { present, evidence } = d.detect(home);
    return { key: d.key, label: d.label, category: d.category, present, weight: d.weight, evidence };
  });
}

// The single strongest present signal — what every sequence leads with.
// Deterministic: weight desc, then key asc.
export function topSignal(signals: Signal[]): Signal | undefined {
  return signals
    .filter((s) => s.present)
    .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))[0];
}
