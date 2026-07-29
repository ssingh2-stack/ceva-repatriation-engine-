// ── Shared domain types ────────────────────────────────────────────

export type Persona =
  | "Owner/Funeral Director"
  | "Managing Director"
  | "Regional/Procurement Manager";

export type PainKey =
  | "airline_dependency"
  | "route_gaps"
  | "documentation_burden"
  | "volume_scaling"
  | "cost_pressure";

export type SignalCategory =
  | "repatriation"
  | "community"
  | "geography"
  | "scale"
  | "operational"
  | "intent";

export type Tier = "A" | "B" | "C";
export type Ownership = "independent" | "corporate";

export interface Contact {
  firstName?: string;
  lastName?: string;
  title: string; // e.g. "Owner", "Managing Funeral Director"
  persona: Persona;
  email?: string; // often unknown at account level; optional
}

/** A real GTA funeral home. Every observed field cites a source in `sources`. */
export interface FuneralHome {
  id: string;
  name: string;
  address: string;
  municipality: string; // e.g. "Brampton"
  siteUrl: string;
  phone?: string;
  ownership: Ownership;
  corporateParent?: string; // e.g. "Arbor Memorial", "Service Corporation International"

  // observed signal inputs
  hasRepatriationPage: boolean;
  repatriationDestinations: string[]; // countries named on the site
  worldwideShipping: boolean;
  consularCoordination: boolean;
  embalmingForTransport: boolean;
  communities: string[]; // diaspora communities served
  languages: string[]; // site languages beyond English
  locationsCount: number;
  yearsInBusiness?: number;
  namedAirlinePartner?: string; // e.g. "Air Canada Cargo"
  obituariesMentionAbroad: boolean;
  reviewsMentionRepatriation: boolean;
  hiring: boolean;

  contact: Contact;
  sources: string[]; // provenance URLs
}

export interface Signal {
  key: string;
  label: string;
  category: SignalCategory;
  present: boolean;
  weight: number;
  evidence: string;
}

export interface FitResult {
  passedGates: boolean;
  gateReason?: string;
  fitBase: number; // 0-100 from weighted (non-intent) signals
  intentMultiplier: number; // 1.0 - 1.2
  score: number; // min(100, round(fitBase * intentMultiplier))
  tier: Tier;
  estMonthlyCases: number;
  estAnnualFreightCad: number;
  strategicAccount: boolean;
  signals: Signal[];
}

export interface PainResult {
  primary: PainKey;
  secondary?: PainKey;
  byPain: Record<PainKey, number>;
}

export interface ScoredHome {
  home: FuneralHome;
  fit: FitResult;
  pain: PainResult;
}

export interface ExcludedHome {
  id: string;
  name: string;
  reason: string;
}

export interface PipelineResult {
  homes: ScoredHome[]; // passed gates, sorted by score desc
  excluded: ExcludedHome[];
  stats: {
    seeded: number;
    qualified: number;
    excluded: number;
    tierA: number;
    tierB: number;
    tierC: number;
    strategic: number;
    corporate: number;
    estPipelineFreightCad: number;
  };
}
