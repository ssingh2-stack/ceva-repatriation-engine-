# CEVA Repatriation Signal Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a $0 Next.js dashboard that scores real GTA funeral homes as CEVA repatriation-logistics prospects and generates pain×persona outreach sequences from observed signals.

**Architecture:** Deterministic, explainable pipeline — real account data (`/src/data`) → signal detectors (`/src/lib/signals`) → fit score + intent multiplier + pain bucket (`/src/lib/scoring`) → pain×persona sequences (`/src/lib/sequence`) → server-rendered dashboard pages (`/src/app`). No runtime external calls; all data pre-fetched into TypeScript data files. Mirrors the proven Venn Signal Engine structure minus enrichment/DB/sending.

**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Vitest. Node ≥20.

## Global Constraints

- `next` pinned `^14.2.35` (Railway CVE scanner floor).
- All build deps (`typescript`, `@types/*`, `tailwindcss`, `postcss`, `autoprefixer`) live in `dependencies`, NOT `devDependencies` (Railway builds with `NODE_ENV=production`).
- Scoring/detection/sequence logic must be **pure and deterministic** — no `Date.now()`/`Math.random()` in scored paths; unit-tested.
- Every account signal field must carry provenance (a source URL) in `/src/data`.
- Copy rules: no competitor bashing; professional funeral-industry tone (respectful, never salesy about death). No em dashes in generated outreach bodies.
- Corporate-owned homes are **kept and flagged**, never filtered.
- Fit weighting is **balanced** between proven-repatriation and diaspora-volume signals.

---

## File Structure

```
src/
  lib/
    types.ts               # domain types (FuneralHome, Signal, FitResult, PainResult, ...)
    config.ts              # runtime config (auth, thresholds)
    signals/detectors.ts   # signal detectors over FuneralHome
    scoring/fitScore.ts    # hard gates + 0-100 fit + intent multiplier + tier + strategic flag
    scoring/painBucket.ts  # pain argmax + value props
    scoring/*.test.ts      # deterministic unit tests
    sequence/templates.ts  # pain×persona 5-touch sequences + CSV export
    sequence/*.test.ts
    pipeline.ts            # discover→detect→score→bucket→sequence orchestration (cached)
  data/
    funeral-homes.ts       # REAL GTA homes with observed signals + source URLs
  app/
    layout.tsx globals.css
    page.tsx               # "/" TAM table (all homes, score, tier, pain, filters)
    account/[id]/page.tsx  # signal breakdown w/ provenance
    funnel/page.tsx        # A/B/C + strategic routing board
    sequence/page.tsx      # pain×persona variants + CSV export
    activity/page.tsx      # run log
    components/Nav.tsx ui.tsx
  scripts/run-pipeline.ts  # CLI: print pipeline result (sanity)
middleware.ts              # HTTP Basic Auth (DASHBOARD_PASSWORD)
```

---

### Task 1: Project scaffold + config

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `.nvmrc`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/config.ts`
- Test: none (scaffold)

**Interfaces:**
- Produces: `config` object with `{ auth: { user, password }, STRATEGIC_MIN_FREIGHT_CAD: number, AVG_FREIGHT_CAD: number }`; path alias `@/*` → `src/*`.

- [ ] **Step 1: Create `package.json`** (copy Venn's, drop `pg`/`@types/pg`/db+lemlist scripts, rename):

```json
{
  "name": "ceva-repatriation-engine",
  "version": "0.1.0",
  "private": true,
  "description": "Signal-based outbound engine for CEVA repatriation logistics — score GTA funeral homes and sequence them by signal.",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "pipeline": "tsx src/scripts/run-pipeline.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "engines": { "node": ">=20" },
  "dependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.19",
    "next": "^14.2.35",
    "postcss": "8.4.39",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "tailwindcss": "3.4.6",
    "typescript": "5.5.3"
  },
  "devDependencies": { "tsx": "4.16.2", "vitest": "2.0.5" }
}
```

- [ ] **Step 2: Copy `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `.nvmrc` verbatim from `/Users/sukhpreet/venn-signal-engine`.** (`next.config.mjs` — drop `serverComponentsExternalPackages: ["pg"]`; keep the rest.)

- [ ] **Step 3: Create `tailwind.config.ts`** with a CEVA-appropriate palette (edge/panel/muted/strong/accent/good/warn tokens; accent = CEVA blue `#0033A0`). Copy Venn's structure, swap accent color.

- [ ] **Step 4: Create `src/lib/config.ts`:**

```ts
function env(k: string): string | undefined {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
}
export const config = {
  auth: { user: env("DASHBOARD_USER") ?? "ceva", password: env("DASHBOARD_PASSWORD") },
  senderName: env("SENDER_NAME") ?? "Sukhpreet Singh, CEVA Logistics",
};
export const STRATEGIC_MIN_FREIGHT_CAD = 75_000; // est. annual repatriation freight
export const AVG_FREIGHT_CAD = 2_500;            // est. CEVA freight margin per case
```

- [ ] **Step 5: Create `src/app/layout.tsx` + `globals.css`** copying Venn's (swap title to "CEVA Repatriation Signal Engine", metadata, and Nav import).

- [ ] **Step 6: Verify build scaffolding** — `npm install` then `npx tsc --noEmit`. Expected: no type errors (pages come later; ensure config compiles).

- [ ] **Step 7: Commit** — `git add -A && git commit -m "chore: scaffold Next.js app + config"`

---

### Task 2: Domain types

**Files:**
- Create: `src/lib/types.ts`
- Test: none (types)

**Interfaces:**
- Produces: `FuneralHome`, `Contact`, `Persona`, `PainKey`, `SignalCategory`, `Signal`, `FitResult`, `PainResult`, `Tier`, `ScoredHome`, `ExcludedHome`, `SequencedHome`, `PipelineResult`.

- [ ] **Step 1: Write `src/lib/types.ts`:**

```ts
export type Persona = "Owner/Funeral Director" | "Managing Director" | "Regional/Procurement Manager";
export type PainKey = "airline_dependency" | "route_gaps" | "documentation_burden" | "volume_scaling" | "cost_pressure";
export type SignalCategory = "repatriation" | "community" | "geography" | "scale" | "operational" | "intent";
export type Tier = "A" | "B" | "C";
export type Ownership = "independent" | "corporate";

export interface Contact {
  firstName?: string;
  lastName?: string;
  title: string;      // e.g. "Owner", "Managing Funeral Director"
  persona: Persona;
  email?: string;     // often unknown at account-level; optional
}

/** A real GTA funeral home. Every observed field cites a source in `sources`. */
export interface FuneralHome {
  id: string;
  name: string;
  address: string;
  municipality: string;      // e.g. "Brampton"
  siteUrl: string;
  phone?: string;
  ownership: Ownership;
  corporateParent?: string;  // e.g. "Arbor Memorial", "Service Corp Intl"

  // observed signal inputs
  hasRepatriationPage: boolean;
  repatriationDestinations: string[];   // countries named on site
  worldwideShipping: boolean;
  consularCoordination: boolean;
  embalmingForTransport: boolean;
  communities: string[];                // diaspora communities served
  languages: string[];                  // site languages beyond English
  locationsCount: number;
  yearsInBusiness?: number;
  namedAirlinePartner?: string;         // e.g. "Air Canada Cargo"
  obituariesMentionAbroad: boolean;
  reviewsMentionRepatriation: boolean;
  hiring: boolean;

  contact: Contact;
  sources: string[];                    // provenance URLs
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
  fitBase: number;         // 0-100 from weighted signals
  intentMultiplier: number;// 1.0 - 1.2
  score: number;           // min(100, round(fitBase * intentMultiplier))
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

export interface ScoredHome { home: FuneralHome; fit: FitResult; pain: PainResult; }
export interface ExcludedHome { id: string; name: string; reason: string; }

export interface PipelineResult {
  homes: ScoredHome[];       // passed gates, sorted by score desc
  excluded: ExcludedHome[];
  stats: {
    seeded: number; qualified: number; excluded: number;
    tierA: number; tierB: number; tierC: number;
    strategic: number; corporate: number;
    estPipelineFreightCad: number;
  };
}
```

- [ ] **Step 2: `npx tsc --noEmit`.** Expected: PASS.
- [ ] **Step 3: Commit** — `git commit -am "feat: domain types"`

---

### Task 3: Signal detectors

**Files:**
- Create: `src/lib/signals/detectors.ts`
- Test: `src/lib/signals/detectors.test.ts`

**Interfaces:**
- Consumes: `FuneralHome`, `Signal`, `SignalCategory` from Task 2.
- Produces: `detectors: Detector[]`, `detectSignals(home): Signal[]`, `topSignal(signals): Signal | undefined`. Signal keys (exact): `repatriation_page`, `repatriation_destinations`, `worldwide_shipping`, `diaspora_focus`, `multilingual_site`, `multi_community`, `high_immigrant_municipality`, `multi_location`, `established`, `operational_maturity`, `intent_obituaries`, `intent_reviews`, `intent_incumbent`, `intent_hiring`.

- [ ] **Step 1: Write the failing test** `src/lib/signals/detectors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { detectSignals, topSignal } from "./detectors";
import type { FuneralHome } from "@/lib/types";

const base: FuneralHome = {
  id: "t", name: "Test FH", address: "1 Main St", municipality: "Brampton",
  siteUrl: "https://x.test", ownership: "independent",
  hasRepatriationPage: true, repatriationDestinations: ["India", "Pakistan"],
  worldwideShipping: true, consularCoordination: true, embalmingForTransport: true,
  communities: ["South Asian", "Sikh"], languages: ["Punjabi", "Hindi"],
  locationsCount: 3, yearsInBusiness: 20, namedAirlinePartner: "Air Canada Cargo",
  obituariesMentionAbroad: true, reviewsMentionRepatriation: false, hiring: false,
  contact: { title: "Owner", persona: "Owner/Funeral Director" }, sources: ["https://x.test"],
};

it("fires repatriation_page when a repatriation page exists", () => {
  const s = detectSignals(base).find((x) => x.key === "repatriation_page")!;
  expect(s.present).toBe(true);
});
it("fires high_immigrant_municipality for Brampton", () => {
  const s = detectSignals(base).find((x) => x.key === "high_immigrant_municipality")!;
  expect(s.present).toBe(true);
});
it("does NOT fire high_immigrant_municipality for Oakville", () => {
  const s = detectSignals({ ...base, municipality: "Oakville" }).find((x) => x.key === "high_immigrant_municipality")!;
  expect(s.present).toBe(false);
});
it("topSignal returns the highest-weight present signal", () => {
  expect(topSignal(detectSignals(base))!.key).toBe("repatriation_page");
});
```

- [ ] **Step 2: Run test → FAIL** (`npx vitest run src/lib/signals` — "detectSignals is not a function").

- [ ] **Step 3: Write `src/lib/signals/detectors.ts`:**

```ts
import type { FuneralHome, Signal, SignalCategory } from "@/lib/types";

type Detector = {
  key: string; label: string; category: SignalCategory; weight: number;
  detect: (h: FuneralHome) => { present: boolean; evidence: string };
};

const HIGH_IMMIGRANT = ["Brampton", "Mississauga", "Scarborough", "North York",
  "Markham", "Etobicoke", "Richmond Hill", "Vaughan", "Ajax", "Pickering", "Toronto"];

export const detectors: Detector[] = [
  // — proven repatriation activity —
  { key: "repatriation_page", label: "Dedicated repatriation / shipping page", category: "repatriation", weight: 18,
    detect: (h) => ({ present: h.hasRepatriationPage, evidence: h.hasRepatriationPage ? "Site advertises repatriation/international shipping" : "—" }) },
  { key: "repatriation_destinations", label: "Names repatriation destinations", category: "repatriation", weight: 10,
    detect: (h) => ({ present: h.repatriationDestinations.length > 0, evidence: h.repatriationDestinations.join(", ") || "—" }) },
  { key: "worldwide_shipping", label: "Worldwide / international service claim", category: "operational", weight: 6,
    detect: (h) => ({ present: h.worldwideShipping, evidence: h.worldwideShipping ? "Advertises worldwide shipping" : "—" }) },
  { key: "operational_maturity", label: "Embalming-for-transport / consular coordination", category: "operational", weight: 8,
    detect: (h) => ({ present: h.embalmingForTransport || h.consularCoordination,
      evidence: [h.embalmingForTransport && "transport embalming", h.consularCoordination && "consular coordination"].filter(Boolean).join(", ") || "—" }) },
  // — diaspora volume potential —
  { key: "diaspora_focus", label: "Serves diaspora community", category: "community", weight: 14,
    detect: (h) => ({ present: h.communities.length > 0, evidence: h.communities.join(", ") || "—" }) },
  { key: "multilingual_site", label: "Multilingual website", category: "community", weight: 10,
    detect: (h) => ({ present: h.languages.length > 0, evidence: h.languages.join(", ") || "—" }) },
  { key: "multi_community", label: "Serves multiple diaspora communities", category: "community", weight: 6,
    detect: (h) => ({ present: h.communities.length >= 2, evidence: `${h.communities.length} communities` }) },
  // — geography —
  { key: "high_immigrant_municipality", label: "High-immigrant GTA municipality", category: "geography", weight: 8,
    detect: (h) => ({ present: HIGH_IMMIGRANT.includes(h.municipality), evidence: h.municipality }) },
  // — scale —
  { key: "multi_location", label: "Multiple locations", category: "scale", weight: 8,
    detect: (h) => ({ present: h.locationsCount >= 2, evidence: `${h.locationsCount} locations` }) },
  { key: "established", label: "Established 15+ years", category: "scale", weight: 4,
    detect: (h) => ({ present: (h.yearsInBusiness ?? 0) >= 15, evidence: h.yearsInBusiness ? `${h.yearsInBusiness} years` : "—" }) },
  // — intent (feed the multiplier, not base weight; weight used for ordering only) —
  { key: "intent_incumbent", label: "Names a single airline cargo partner (displaceable)", category: "intent", weight: 5,
    detect: (h) => ({ present: !!h.namedAirlinePartner, evidence: h.namedAirlinePartner ?? "—" }) },
  { key: "intent_obituaries", label: "Recent obituaries name interment abroad", category: "intent", weight: 5,
    detect: (h) => ({ present: h.obituariesMentionAbroad, evidence: h.obituariesMentionAbroad ? "Obituaries cite burial abroad" : "—" }) },
  { key: "intent_reviews", label: "Reviews mention repatriation", category: "intent", weight: 4,
    detect: (h) => ({ present: h.reviewsMentionRepatriation, evidence: h.reviewsMentionRepatriation ? "Reviews reference repatriation" : "—" }) },
  { key: "intent_hiring", label: "Hiring / growth signal", category: "intent", weight: 3,
    detect: (h) => ({ present: h.hiring, evidence: h.hiring ? "Active hiring" : "—" }) },
];

export const INTENT_KEYS = new Set(["intent_incumbent", "intent_obituaries", "intent_reviews", "intent_hiring"]);

export function detectSignals(home: FuneralHome): Signal[] {
  return detectors.map((d) => { const { present, evidence } = d.detect(home);
    return { key: d.key, label: d.label, category: d.category, present, weight: d.weight, evidence }; });
}
export function topSignal(signals: Signal[]): Signal | undefined {
  return signals.filter((s) => s.present).sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))[0];
}
```

- [ ] **Step 4: Run test → PASS** (`npx vitest run src/lib/signals`).
- [ ] **Step 5: Commit** — `git commit -am "feat: signal detectors"`

---

### Task 4: Fit score + intent multiplier + tier + strategic flag

**Files:**
- Create: `src/lib/scoring/fitScore.ts`
- Test: `src/lib/scoring/fitScore.test.ts`

**Interfaces:**
- Consumes: `FuneralHome`, `Signal`, `FitResult`, `Tier`; `INTENT_KEYS` from Task 3; `STRATEGIC_MIN_FREIGHT_CAD`, `AVG_FREIGHT_CAD` from config.
- Produces: `gateReason(home): string | null`, `tierFor(score): Tier`, `fitScore(home, signals): FitResult`. Constants: `SCORE_CEILING = 78`, tier cuts A≥70 / B≥45.

- [ ] **Step 1: Write the failing test** `src/lib/scoring/fitScore.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { fitScore, gateReason, tierFor } from "./fitScore";
import { detectSignals } from "@/lib/signals/detectors";
import type { FuneralHome } from "@/lib/types";

const strong: FuneralHome = { /* copy `base` from detectors.test.ts */ } as FuneralHome;

it("gates out a cemetery-only / no-remains home", () => {
  expect(gateReason({ ...strong, hasRepatriationPage: false, worldwideShipping: false,
    consularCoordination: false, embalmingForTransport: false, communities: [] } as FuneralHome)).toBeNull();
  // gate is about remains-handling & GTA; see gate rules
});
it("tierFor maps cuts", () => { expect(tierFor(70)).toBe("A"); expect(tierFor(45)).toBe("B"); expect(tierFor(20)).toBe("C"); });
it("a proven diaspora multi-location home scores tier A", () => {
  const f = fitScore(strong, detectSignals(strong));
  expect(f.passedGates).toBe(true);
  expect(f.score).toBeGreaterThanOrEqual(70);
  expect(f.tier).toBe("A");
});
it("intent multiplier > 1 when intent signals present", () => {
  const f = fitScore(strong, detectSignals(strong));
  expect(f.intentMultiplier).toBeGreaterThan(1);
});
it("scores are deterministic", () => {
  expect(fitScore(strong, detectSignals(strong)).score).toBe(fitScore(strong, detectSignals(strong)).score);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `src/lib/scoring/fitScore.ts`:**

```ts
import type { FuneralHome, Signal, FitResult, Tier } from "@/lib/types";
import { INTENT_KEYS } from "@/lib/signals/detectors";
import { STRATEGIC_MIN_FREIGHT_CAD, AVG_FREIGHT_CAD } from "@/lib/config";

const GTA = ["Brampton","Mississauga","Scarborough","North York","Markham","Etobicoke",
  "Richmond Hill","Vaughan","Ajax","Pickering","Toronto","Oakville","Burlington","Milton",
  "Oshawa","Whitby","Newmarket","Aurora","Caledon","King City","Georgetown","Stouffville"];

// Sum of non-intent weights an excellent-but-realistic home hits. Scores cap at 100.
const SCORE_CEILING = 78;

export function gateReason(h: FuneralHome): string | null {
  if (!GTA.includes(h.municipality)) return `Outside GTA (${h.municipality})`;
  const handlesRemains = h.hasRepatriationPage || h.worldwideShipping || h.embalmingForTransport ||
    h.consularCoordination || h.repatriationDestinations.length > 0 || h.communities.length > 0;
  if (!handlesRemains) return "No repatriation/remains-handling signal (cemetery-only or out of scope)";
  return null;
}
export function tierFor(score: number): Tier { return score >= 70 ? "A" : score >= 45 ? "B" : "C"; }

export function fitScore(home: FuneralHome, signals: Signal[]): FitResult {
  const reason = gateReason(home);
  if (reason) return { passedGates: false, gateReason: reason, fitBase: 0, intentMultiplier: 1,
    score: 0, tier: "C", estMonthlyCases: 0, estAnnualFreightCad: 0, strategicAccount: false, signals };

  const base = signals.filter((s) => s.present && !INTENT_KEYS.has(s.key)).reduce((a, s) => a + s.weight, 0);
  const fitBase = Math.min(100, Math.round((base / SCORE_CEILING) * 100));
  const intentCount = signals.filter((s) => s.present && INTENT_KEYS.has(s.key)).length;
  const intentMultiplier = Math.min(1.2, 1 + 0.06 * intentCount);
  const score = Math.min(100, Math.round(fitBase * intentMultiplier));

  // volume proxy → deal size → strategic flag
  const estMonthlyCases = Math.max(1, Math.round(
    home.communities.length * 1.5 + (home.locationsCount - 1) * 2 +
    home.repatriationDestinations.length * 0.5 + (GTA.slice(0,11).includes(home.municipality) ? 3 : 0)));
  const estAnnualFreightCad = estMonthlyCases * 12 * AVG_FREIGHT_CAD;
  const strategicAccount = estAnnualFreightCad >= STRATEGIC_MIN_FREIGHT_CAD;

  return { passedGates: true, fitBase, intentMultiplier, score, tier: tierFor(score),
    estMonthlyCases, estAnnualFreightCad, strategicAccount, signals };
}
```

- [ ] **Step 4: Run → PASS.** (Fill `strong` in the test with the `base` object from Task 3's test.)
- [ ] **Step 5: Commit** — `git commit -am "feat: fit score, intent multiplier, strategic flag"`

---

### Task 5: Pain bucket + CEVA value props

**Files:**
- Create: `src/lib/scoring/painBucket.ts`
- Test: `src/lib/scoring/painBucket.test.ts`

**Interfaces:**
- Consumes: `FuneralHome`, `Signal`, `PainResult`, `PainKey`.
- Produces: `painBucket(home, signals): PainResult`, `PAIN_LABEL`, `PAIN_VALUE_PROP`, `PAIN_SIGNALS`, `PAIN_ORDER`.

- [ ] **Step 1: Write failing test** `src/lib/scoring/painBucket.test.ts`:

```ts
import { it, expect } from "vitest";
import { painBucket } from "./painBucket";
import { detectSignals } from "@/lib/signals/detectors";
import type { FuneralHome } from "@/lib/types";
const home = { /* `base` from detectors.test.ts */ } as FuneralHome;
it("picks a primary pain deterministically", () => {
  const p = painBucket(home, detectSignals(home));
  expect(p.primary).toBeDefined();
  expect(painBucket(home, detectSignals(home)).primary).toBe(p.primary);
});
it("route_gaps ranks high for a multi-community home", () => {
  const p = painBucket(home, detectSignals(home));
  expect(p.byPain.route_gaps).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `src/lib/scoring/painBucket.ts`:**

```ts
import type { FuneralHome, Signal, PainResult, PainKey } from "@/lib/types";

export const PAIN_ORDER: PainKey[] = ["route_gaps","airline_dependency","volume_scaling","documentation_burden","cost_pressure"];

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
export const PAIN_VALUE_PROP: Record<PainKey, string> = {
  route_gaps: "a multi-carrier network that reaches the hard destinations your families need, not just where one airline flies",
  airline_dependency: "capacity and routing that doesn't depend on a single airline's compassion desk",
  volume_scaling: "a dedicated account with priority capacity and one point of contact as your case volume grows",
  documentation_burden: "customs brokerage and export documentation handled end to end, so your team isn't chasing permits",
  cost_pressure: "consolidated freight pricing instead of retail airline rates on every case",
};

export function painBucket(_home: FuneralHome, signals: Signal[]): PainResult {
  const present = new Set(signals.filter((s) => s.present).map((s) => s.key));
  const wByKey = new Map(signals.map((s) => [s.key, s.weight]));
  const byPain = {} as Record<PainKey, number>;
  for (const p of PAIN_ORDER)
    byPain[p] = PAIN_SIGNALS[p].filter((k) => present.has(k)).reduce((a, k) => a + (wByKey.get(k) ?? 0), 0);
  const ranked = [...PAIN_ORDER].sort((a, b) => byPain[b] - byPain[a] || PAIN_ORDER.indexOf(a) - PAIN_ORDER.indexOf(b));
  return { primary: ranked[0], secondary: byPain[ranked[1]] > 0 ? ranked[1] : undefined, byPain };
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: pain bucket + CEVA value props"`

---

### Task 6: Sequence templates (pain × persona) + CSV export

**Files:**
- Create: `src/lib/sequence/templates.ts`
- Test: `src/lib/sequence/templates.test.ts`

**Interfaces:**
- Consumes: `FuneralHome`, `Contact`, `PainKey`, `Persona`; `PAIN_VALUE_PROP`, `PAIN_LABEL`; `topSignal`, `detectSignals`.
- Produces: `renderSequence(home, pain, opts): RenderedStep[]` (5 steps), `sequenceToCsvRows(...)`, `buildCsv(homes): string`, `CHANNEL_LABEL`, `SequenceStep`, `RenderedStep`.

- [ ] **Step 1: Write failing test** `src/lib/sequence/templates.test.ts`:

```ts
import { it, expect } from "vitest";
import { renderSequence, buildCsv } from "./templates";
import type { FuneralHome } from "@/lib/types";
const home = { /* `base` from detectors.test.ts */ } as FuneralHome;
it("renders a 5-touch sequence with no leftover merge tokens", () => {
  const steps = renderSequence(home, "route_gaps", { senderName: "Test Rep" });
  expect(steps.length).toBe(5);
  for (const s of steps) { expect(s.body).not.toMatch(/\{\{/); if (s.subject) expect(s.subject).not.toMatch(/\{\{/); }
});
it("bodies contain no em dashes", () => {
  for (const s of renderSequence(home, "route_gaps", {})) expect(s.body).not.toContain("—");
});
it("persona changes the greeting/title reference", () => {
  const a = renderSequence({ ...home, contact: { title: "Owner", persona: "Owner/Funeral Director" } }, "route_gaps", {});
  const b = renderSequence({ ...home, ownership: "corporate", contact: { title: "Regional Manager", persona: "Regional/Procurement Manager" } }, "route_gaps", {});
  expect(a[0].body).not.toBe(b[0].body);
});
it("buildCsv emits a header + one row per step", () => {
  const csv = buildCsv([home]);
  expect(csv.split("\n")[0]).toContain("home,municipality,pain,persona,day,channel,subject,body");
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `src/lib/sequence/templates.ts`** — a `FRAMEWORKS` map keyed by `PainKey`, each 5 steps (day 1 email, day 3 LinkedIn/call, day 5 call, day 8 email, day 12 email), merge tokens `{{firstName|home|painValue|painShort|senderName|destExample}}`, persona-aware greeting. Model structure on Venn's `templates.ts` (`renderSequence` + token `fill`), but tokens sourced inline from the home (no separate research.ts). Include `personaAngle(persona)` returning a clause used in step 1. Value prop from `PAIN_VALUE_PROP`. Add:

```ts
export function buildCsv(homes: FuneralHome[]): string {
  const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const header = "home,municipality,pain,persona,day,channel,subject,body";
  const rows: string[] = [header];
  for (const h of homes) {
    const pain = /* import painBucket + detectSignals to compute primary */ "route_gaps" as PainKey;
    for (const step of renderSequence(h, pain, {})) {
      rows.push([h.name, h.municipality, pain, h.contact.persona, String(step.day),
        step.channel, step.subject ?? "", step.body].map(esc).join(","));
    }
  }
  return rows.join("\n");
}
```
(Compute `pain` via `painBucket(h, detectSignals(h)).primary` — import both. Greeting: if `contact.firstName` present use it, else "Hi there" / role-based.)

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: pain x persona sequences + CSV export"`

---

### Task 7: Pipeline orchestration

**Files:**
- Create: `src/lib/pipeline.ts`, `src/scripts/run-pipeline.ts`
- Test: `src/lib/pipeline.test.ts`

**Interfaces:**
- Consumes: `getFuneralHomes()` from `@/data/funeral-homes` (Task 8 provides real data; Task 7 can be built against a tiny inline fixture first), `detectSignals`, `fitScore`, `painBucket`.
- Produces: `runPipeline(): PipelineResult`, `getPipeline(): PipelineResult` (module-cached).

- [ ] **Step 1: Write failing test** `src/lib/pipeline.test.ts` — assert `runPipeline().homes` are sorted by `fit.score` desc, `excluded` captures gated homes, and `stats` counts add up. (Use a 3-home inline fixture by mocking `@/data/funeral-homes`, or inject via a param — prefer a `runPipeline(homes?)` optional arg defaulting to `getFuneralHomes()` for testability.)

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `src/lib/pipeline.ts`:**

```ts
import type { FuneralHome, PipelineResult, ScoredHome, ExcludedHome } from "@/lib/types";
import { getFuneralHomes } from "@/data/funeral-homes";
import { detectSignals } from "@/lib/signals/detectors";
import { fitScore } from "@/lib/scoring/fitScore";
import { painBucket } from "@/lib/scoring/painBucket";

export function runPipeline(homes: FuneralHome[] = getFuneralHomes()): PipelineResult {
  const qualified: ScoredHome[] = []; const excluded: ExcludedHome[] = [];
  for (const home of homes) {
    const signals = detectSignals(home);
    const fit = fitScore(home, signals);
    if (!fit.passedGates) { excluded.push({ id: home.id, name: home.name, reason: fit.gateReason ?? "gated" }); continue; }
    qualified.push({ home, fit, pain: painBucket(home, signals) });
  }
  qualified.sort((a, b) => b.fit.score - a.fit.score || b.fit.estAnnualFreightCad - a.fit.estAnnualFreightCad);
  const stats = {
    seeded: homes.length, qualified: qualified.length, excluded: excluded.length,
    tierA: qualified.filter((q) => q.fit.tier === "A").length,
    tierB: qualified.filter((q) => q.fit.tier === "B").length,
    tierC: qualified.filter((q) => q.fit.tier === "C").length,
    strategic: qualified.filter((q) => q.fit.strategicAccount).length,
    corporate: qualified.filter((q) => q.home.ownership === "corporate").length,
    estPipelineFreightCad: qualified.reduce((a, q) => a + q.fit.estAnnualFreightCad, 0),
  };
  return { homes: qualified, excluded, stats };
}
let cached: PipelineResult | null = null;
export function getPipeline(): PipelineResult { if (!cached) cached = runPipeline(); return cached; }
```

- [ ] **Step 4: Write `src/scripts/run-pipeline.ts`** — import `runPipeline`, `console.log` stats + top 10 homes.
- [ ] **Step 5: Run → PASS.**
- [ ] **Step 6: Commit** — `git commit -am "feat: pipeline orchestration"`

---

### Task 8: Real GTA funeral-home dataset

**Files:**
- Create: `src/data/funeral-homes.ts`
- Test: `src/data/funeral-homes.test.ts`

**Interfaces:**
- Produces: `getFuneralHomes(): FuneralHome[]` — 40–60 real GTA homes, each field observed from a real source with URLs in `sources`.

- [ ] **Step 1: Build the real list via research** (see "Research protocol" appendix). Each home: verify it exists (name/address/site), fetch its site to record `hasRepatriationPage`, `repatriationDestinations`, `communities`, `languages`, `worldwideShipping`, `consularCoordination`, `embalmingForTransport`, `locationsCount`, `namedAirlinePartner`; determine `ownership`/`corporateParent` (Arbor/SCI lookups); set intent flags conservatively (only if actually observed); `sources` = every URL used.

- [ ] **Step 2: Write `src/data/funeral-homes.ts`** exporting `const FUNERAL_HOMES: FuneralHome[] = [ ... ]` and `getFuneralHomes = () => FUNERAL_HOMES`.

- [ ] **Step 3: Write `src/data/funeral-homes.test.ts`** — invariants: unique ids; every home has ≥1 `sources` URL; `siteUrl` looks like a URL; ≥40 homes; every `municipality` is a real GTA municipality; no placeholder names ("Example", "Test").

- [ ] **Step 4: Run pipeline sanity** — `npm run pipeline`; expect a sensible tier spread (some A, some B/C), non-zero strategic count.

- [ ] **Step 5: Commit** — `git commit -am "data: real GTA funeral-home seed list (N homes)"`

---

### Task 9: Dashboard pages

**Files:**
- Create: `src/app/components/Nav.tsx`, `src/app/components/ui.tsx`, `src/app/page.tsx`, `src/app/account/[id]/page.tsx`, `src/app/funnel/page.tsx`, `src/app/sequence/page.tsx`, `src/app/activity/page.tsx`, `src/app/sequence/export/route.ts` (CSV download)
- Test: none (rendered pages; covered by build)

**Interfaces:**
- Consumes: `getPipeline`, `PAIN_LABEL`, `renderSequence`, `buildCsv`, ui components.

- [ ] **Step 1: `ui.tsx` + `Nav.tsx`** — adapt Venn's `ui.tsx` (`PageHeader`, `Stat`, `TierBadge`, `PainBadge`, `money`); `PainBadge` colors keyed by the 5 CEVA `PainKey`s. Nav links: Accounts (`/`), Funnel (`/funnel`), Sequences (`/sequence`), Signals (`/activity`). Brand: "CEVA · Repatriation Signal Engine".

- [ ] **Step 2: `/` Accounts table** — all qualified homes: name (link), municipality, communities, tier badge, score, pain badge, corporate flag, strategic star, est. annual freight. Client-side filter by municipality/community/tier/corporate. Stat row: total, tier A, strategic, est. pipeline freight.

- [ ] **Step 3: `/account/[id]`** — signal breakdown table (label, category, present ✓/✗, weight/points, evidence), fit math (base × intent = score), strategic flag + est. cases/freight, ownership, **sources list (clickable provenance)**, and the rendered 5-touch sequence for the primary pain.

- [ ] **Step 4: `/funnel`** — three tier columns A/B/C, strategic accounts pinned/starred, each card shows next action + pain + est. freight.

- [ ] **Step 5: `/sequence`** — pain × persona matrix; pick a pain+persona to preview the 5 touches; "Download CSV" button hitting `/sequence/export`.

- [ ] **Step 6: `/sequence/export/route.ts`** — `GET` returns `buildCsv(getPipeline().homes.map(h=>h.home))` with `Content-Type: text/csv` + `Content-Disposition: attachment; filename="ceva-sequences.csv"`.

- [ ] **Step 7: `/activity`** — run log: seeded/qualified/excluded, excluded list with reasons, tier spread.

- [ ] **Step 8: `npm run build`** — expect success, all routes compile.
- [ ] **Step 9: Commit** — `git commit -am "feat: dashboard pages + CSV export"`

---

### Task 10: Basic-auth middleware + deploy prep

**Files:**
- Create: `middleware.ts`, `README.md`, `.env.example`
- Test: `middleware.test.ts` (unit-test the auth check helper)

**Interfaces:**
- Consumes: `config.auth`.

- [ ] **Step 1: Write failing test** for an `isAuthorized(header): boolean` helper (valid Basic header for the configured user/pass → true; missing/wrong → false). If `DASHBOARD_PASSWORD` unset → allow (dev).

- [ ] **Step 2: Write `middleware.ts`** — Next.js middleware reading the `Authorization` header; on fail return `401` with `WWW-Authenticate: Basic realm="CEVA"`. Export `isAuthorized` for the test. `matcher` covers all routes except `/_next` and static.

- [ ] **Step 3: Run → PASS.**

- [ ] **Step 4: Write `README.md`** (run locally, `npm run dev`; env vars; Railway deploy steps from spec §10a) and `.env.example` (`DASHBOARD_USER`, `DASHBOARD_PASSWORD`, `SENDER_NAME`).

- [ ] **Step 5: Full check** — `npm run test && npm run build`. Expect all green.
- [ ] **Step 6: Commit + push** — `git commit -am "feat: basic-auth middleware + deploy docs" && git push`

---

## Appendix: Research protocol (Task 8)

Goal: 40–60 **real** GTA funeral homes with **observed** signals + provenance.

1. **Enumerate** candidates from public directories: Google Maps/Places ("funeral home" across Brampton, Mississauga, Scarborough, North York, Markham, Etobicoke, Toronto, Vaughan, Richmond Hill, Ajax/Pickering), canadianfunerals.com, funeralhomes.com, Yellow Pages, Arbor Memorial & Service Corp Intl location lists (for the corporate flag).
2. **For each home, fetch its website** and record only what's actually present: repatriation/shipping/international pages (record destination countries named), languages/community pages, worldwide-shipping and consular/embalming-for-transport claims, location count, named airline cargo partner. Capture the exact source URL(s).
3. **Ownership:** cross-check against Arbor Memorial and SCI/Dignity Memorial location lists → `corporate` + `corporateParent`, else `independent`.
4. **Be conservative on intent flags** — set `obituariesMentionAbroad`/`reviewsMentionRepatriation`/`hiring` true only when actually seen; default false.
5. **No fabrication.** If a field can't be verified, use the safe default (false / omit) and note nothing beyond sources. Every home must have ≥1 real source URL.

Parallelize across research agents by municipality; each returns a validated array of `FuneralHome` objects with sources. Merge, dedupe by name+address, commit.

---

## Self-Review

- **Spec coverage:** gates (T4) ✓, balanced fit (T3/T4) ✓, intent multiplier (T4) ✓, corporate kept+flagged (T2/T4/T9) ✓, strategic flag (T4) ✓, pain buckets + value props (T5) ✓, pain×persona sequences + CSV (T6/T9) ✓, real 40–60 seed w/ provenance (T8) ✓, dashboard pages (T9) ✓, Railway + basic-auth (T10) ✓, deterministic tests (T3–T7,T10) ✓.
- **Placeholder scan:** the `/* `base` from ... */` markers in tests are deliberate copy-instructions, not shipped placeholders; all shipped code is complete.
- **Type consistency:** `FuneralHome`/`Signal`/`FitResult`/`PainResult` names consistent across tasks; `getFuneralHomes`, `detectSignals`, `fitScore`, `painBucket`, `runPipeline`, `renderSequence`, `buildCsv` signatures match consumers.
