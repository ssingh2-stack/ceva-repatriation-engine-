# CEVA Repatriation Signal Engine

Signal-based outbound GTM engine for **CEVA Logistics** repatriation services. It scores real Greater Toronto Area funeral homes as prospects for international repatriation of remains (air-cargo freight forwarding + customs brokerage), and generates outreach sequences tailored to each home's signals.

Built on the same pattern as the Venn signal engine: deterministic, explainable scoring → tiering → pain bucket → pain × persona sequences → routing board. Runs at $0 with no runtime external calls (all account data is pre-fetched into `src/data`).

## What it does

- **Discovers** real GTA funeral homes (53 seeded, each field cited to a source URL in `src/data/funeral-homes.ts`).
- **Detects signals** on each home: proven repatriation activity, diaspora-community focus, geography, scale, operational maturity, and intent.
- **Scores** deterministically: hard gates → 0–100 fit base → intent multiplier → A/B/C tier → strategic-account flag. Corporate-owned homes (Arbor, SCI/Dignity, Park Lawn, Mount Pleasant) are **kept and flagged**, not filtered.
- **Buckets pain** into a CEVA value prop (route gaps, airline dependency, documentation burden, volume scaling, cost pressure).
- **Generates** a 5-touch sequence per home, personalized by pain × persona, exportable to CSV for manual send.

## Dashboard

| Route | Purpose |
|-------|---------|
| `/` | Accounts table — score, tier, pain, filters (municipality/community/tier/ownership) |
| `/account/[id]` | Signal breakdown with provenance + rendered sequence |
| `/funnel` | A/B/C routing board, strategic accounts pinned |
| `/sequence` | Pain × persona sequence variants + CSV download |
| `/activity` | Run log + excluded accounts with reasons |
| `/sequence/export` | CSV download of every account's sequence |

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # deterministic scoring tests
npm run pipeline       # print the scored pipeline to the console
```

With no `DASHBOARD_PASSWORD` set, the dashboard is open (local dev).

## Deploy (Railway)

1. Push to GitHub (private — this is real prospect data).
2. Railway → **New Project → Deploy from GitHub repo** → select this repo. Next.js is auto-detected; no build config needed.
3. Settings → Networking → **Generate Domain**.
4. Set **Variables**:
   - `DASHBOARD_PASSWORD` — gates the whole dashboard via HTTP Basic Auth (`middleware.ts`). Without it the site is open.
   - `DASHBOARD_USER` — optional, defaults to `ceva`.
   - `SENDER_NAME` — optional, used in generated sequences.

Railway builds with `NODE_ENV=production`, so all build dependencies live in `dependencies` (not `devDependencies`), and `next` is pinned `^14.2.35` for the CVE scanner. Every push to `main` auto-deploys.

## Refreshing the account list

`src/data/funeral-homes.ts` is the seam where real data lives. To refresh, re-run the research pass (see `docs/superpowers/plans/2026-07-29-ceva-repatriation-signal-engine.md`, Appendix: Research protocol) and regenerate the file. This is where a paid scraper/API drops in later, behind the same `getFuneralHomes()` interface.

## Not in v1 (deferred behind stable interfaces)

Paid enrichment (Apollo/Clay), automated sending (Lemlist/Instantly), contact-level person data, CRM sync, and persistence. The scoring, detection, and sequence modules don't change when these are added.
