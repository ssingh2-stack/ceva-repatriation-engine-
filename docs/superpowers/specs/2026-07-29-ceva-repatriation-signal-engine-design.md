# CEVA Repatriation Signal Engine — Design

**Date:** 2026-07-29
**Owner:** Sukhpreet Singh (building for a friend at CEVA Logistics, funeral-home vertical)
**Status:** Approved design → implementation planning

## 1. Purpose

A signal-based outbound GTM engine that finds **real GTA funeral homes that repatriate remains**, scores their fit and intent as a **CEVA Logistics** freight/customs prospect, and generates personalized outreach sequences from those signals.

CEVA's offer to the funeral home: act as the **multi-carrier freight forwarder + customs broker** for international repatriation of human remains (IATA "HUM" cargo) — displacing single-airline dependency (e.g., Air Canada Cargo / AC Compassion) and one-off specialist mortuary shippers, with better route coverage to hard destinations, consolidated pricing, and end-to-end documentation handling.

Modeled on the proven Venn Signal Engine (`/Users/sukhpreet/venn-signal-engine`): deterministic, explainable scoring → tiering → pain bucket → pain×persona sequences → routing board, in a $0 Next.js dashboard.

**v1 scope:** real discovery + real deterministic scoring + generated/exportable sequences. **Manual send** (no paid enrichment/sending tools yet — those slot in later behind the same interfaces).

## 2. Vertical grounding (verified)

- GTA homes publish repatriation signals on their own sites — e.g., Chapel Ridge has per-destination pages ("Repatriation to China," "Repatriation to Italy"). Signals are scrapeable.
- Only **"known shippers"** (funeral homes / repatriation specialists) can book airline cargo directly; today they rely on **Air Canada Cargo (AC Compassion)** + one-off specialist mortuary shippers → the incumbent CEVA displaces.
- International repatriation runs ~$6k+ per case retail; high-volume diaspora homes do many/month → meaningful, recurring freight spend.

## 3. Account model

**Account = one GTA funeral home.** (Not a contact — a business.) Each account carries: identity (name, address, municipality, site URL, phone), ownership (independent vs corporate-flagged), observed signals (each with a source URL), computed score/tier/pain bucket, and a generated sequence.

## 4. Scoring model (deterministic, explainable)

Every point traces to an observed signal so the score is defensible.

### 4.1 Hard gates (fail → disqualified, no score)
- Is an actual funeral home / transfer service (not cemetery-only, monument seller, or pet services)
- Serves the GTA (physical location in target municipalities)
- Handles body/remains (full-service or transfer) — not ashes-scattering-only novelty shops

### 4.2 Fit score (0–100) — "how much repatriation does this home likely do?"

**Balanced weighting** between proven activity and diaspora-volume potential.

| Signal | Rationale | Weight band |
|---|---|---|
| Explicit repatriation / shipping / international / "worldwide" pages | Direct proof of activity | High |
| Diaspora-community focus (multilingual site, country/religion-specific service pages, ethnic branding) | #1 predictor of repatriation *volume* | High |
| High-immigrant municipality (Brampton, Mississauga, Scarborough, North York, Markham, Etobicoke, ...) | Volume proxy | Med |
| Scale (multiple locations, chapels, years in business, staff count) | More cases → more freight | Med |
| Operational maturity (embalming-for-transport, consular coordination, hermetically sealed containers, "worldwide") | Shipping capability | Med |

Points sum to a 0–100 fit score. Exact per-signal point values defined in the implementation plan; must be pure/deterministic and unit-tested.

### 4.3 Intent layer — "winnable now?" (multiplier on fit, not base points)
- Recent obituaries naming interment abroad ("buried in [country]")
- Reviews mentioning repatriation (esp. complaints = displacement opening)
- Site names a specific airline cargo partner (displaceable incumbent)
- Hiring / new-location / growth signals

### 4.4 Reachability & deal size
- **Independent family-owned** → direct decision-maker access (easier motion)
- **Corporate (SCI / Arbor / Service Corp-owned)** → **kept but flagged** "central procurement" (different motion)
- Estimated case volume → deal-size proxy → **strategic-account flag** (Venn "wildcard" equivalent) above a volume threshold

### 4.5 Tiering
Tier **A / B / C** from fit × intent. Strategic-account flag rides on top independent of tier. Corporate flag is orthogonal metadata.

### 4.6 Pain bucket → CEVA value prop (drives sequence copy)
- `airline_dependency` → multi-carrier network; capacity when AC Compassion can't
- `route_gaps` (serves communities with poor direct air links — West Africa, Caribbean, parts of S. Asia) → CEVA reaches hard destinations
- `documentation_burden` → CEVA customs brokerage + door-to-door handling
- `volume_scaling` → dedicated account, priority capacity, negotiated rates
- `cost_pressure` → consolidated freight vs retail airline compassion rates

## 5. Real account sourcing (no paid tools)

1. **Seed the real list now** (~40–60 real GTA homes) via research: compile from public directories (Google Maps/Places listings, canadianfunerals.com, Yellow Pages, funeral associations) + fetch each home's own site to record *observed* signals with source URLs. Committed to `/src/data/funeral-homes.ts`. Every signal field cites where it came from.
2. **Refresh script** — documented `npm run discover` that re-fetches sites and re-scores, keeping the list live. This is the seam where a paid scraper/API later drops in behind the same interface.
3. Corporate-owned homes are **kept and flagged**, not filtered.

## 6. Personas

- **Independent home:** owner / managing funeral director (primary)
- **Corporate-flagged home:** regional / procurement lead

Sequences are generated per **pain bucket × persona**.

## 7. Sequences

- 5-touch cadence: email + call script + optional LinkedIn touch
- Copy varies by pain bucket × persona
- Editable in `/src/lib/sequence/templates.ts`
- **Exportable to CSV** for manual send in whatever tool the friend uses

## 8. Dashboard (mirrors Venn)

- `/` — TAM table: all homes, fit score, tier, pain bucket; sort/filter by municipality, community, corporate flag, tier
- `/account/[id]` — signal breakdown: each signal, its source, points contributed, scoring rationale
- `/funnel` — routing board: A/B/C tiers + strategic accounts, next action per home
- `/sequence` — pain×persona sequence variants (editable)
- `/activity` — run log

## 9. Architecture & repo

- **New clean repo:** `/Users/sukhpreet/ceva-repatriation-engine` (Next.js + TS + Tailwind), borrowing Venn's patterns without fintech baggage.
- Deterministic scoring lives in `/src/lib/scoring`; signal detection in `/src/lib/signals`; sequence templates in `/src/lib/sequence`; real data in `/src/data`; pages in `/src/app`.
- Runs at $0 (no external calls at runtime; data is pre-fetched into `/src/data`).
- **Isolation:** scoring, signal detection, sequence generation, and discovery are independent units with typed interfaces so each is testable alone and a paid data source can replace discovery later without touching scoring.

## 10. Testing

Deterministic unit tests on scoring (fit, intent, tier, pain bucket) and pain×persona sequence selection — reproducible, defensible scores.

## 11. Non-goals (v1)

- No paid enrichment (Apollo/FullEnrich/Clay) or automated sending (Lemlist/Instantly) — deferred behind stable interfaces
- No CRM sync, no Postgres persistence (Venn added these later; not needed for v1)
- No contact-level (person) enrichment — account-level only for v1

## 12. Open seams for later

- Paid scraper/API behind `discover`
- Contact enrichment + automated multi-touch sending
- Obituary/review intent feeds automated
- CRM sync queue (as in Venn)
