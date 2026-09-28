# Project SAHARA — Agent Instructions

## Quick Start

```bash
npm install          # install deps
npm run dev          # dev server (Next.js 15 App Router)
npm run typecheck    # tsc --noEmit (must pass)
npm test             # runs all 136 tests via node:test runner
npm run build        # production build
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests (tests/*.test.ts) |
| `npm run test -- <filter>` | Run subset (e.g., `npm test -- phase3`) |
| `npm run typecheck` | Strict TS check — must pass before commit |
| `npm run lint` | `next lint` (deprecated in Next 15; uses legacy .eslintrc.json) |
| `npm run seed` | Seed Supabase with fixtures (requires env vars) |

## Architecture at a Glance

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5 strict
- **Database**: Supabase (PostgreSQL) — RLS enabled on all tables, zero public policies
- **LLM**: Swappable OpenAI-compatible adapter in `lib/llm/index.ts` (mock by default)
- **Styling**: Tailwind CSS with therapeutic token palette (`designs/DESIGN.md`)
- **Testing**: Native `node:test` runner via `scripts/test-runner.ts`

## The Pipeline (10 Steps)

```
POST /api/checkin
  1. Zod contract validation (types/contract.ts)
  2. Consent Gate → 403 if no active consent (0 DB writes)
  3. Minor Check → divert to caseworker if is_minor_flag (0 scoring rows)
  4. Pass 1 Interlock → deterministic regex lexicon; CRITICAL on hit, LLM bypassed
  5. Boxed LLM call → 1 ack + 1 question, returns S2 (or null on failure)
  6. Pass 2 Interlock → rejects advice/diagnosis/false reassurance; substitutes fallback
  7. Scoring Engine → S1..S5 + missing-signal renormalisation
  8. EWMA baseline & z-score → change-point if z > 2.0 && history ≥ 2
  9. Policy Engine → versioned YAML (policy/v1.yaml) → GREEN/AMBER/RED/CRITICAL
  10. Persist checkins, assessments, alerts (if tier ≥ RED); return response
```

## Critical Invariants (Never Violate)

1. **S5 weight is 0.00** — enforced by Zod `literal(0)` in policy; acoustic displayed only with low-confidence caveat
2. **Missing ≠ calm** — null S1/S2 triggers renormalisation over present signals; never default to 0
3. **Crisis detection = deterministic regex** — Pass 1 runs before LLM; negation still fires (fails safe)
4. **Pass 2 sanitizes LLM output** — bans advice, diagnosis, false reassurance, promises, >320 chars, >1 question mark
5. **Tier movement is one-way up** — model may raise tier, never lower; only human closes CRITICAL
6. **CRITICAL requires deterministic trigger** — policy YAML cannot declare CRITICAL tier rules (Zod rejects)
7. **z-score computed BEFORE baseline update** — order of operations critical for change-point accuracy
8. **S4 monotonically non-decreasing** — missed check-ins +25, abandonment +20; prior floor preserved
9. **Zero PII** — synthetic IDs only (`A-XXXX`); no names, phones, real case numbers in DB/repo/fixtures
10. **Consent before scoring** — enforced at handler top, not in UI; withdrawn = 403
11. **Staff access = passcode + audit** — every person read writes `audit_events`

## Golden Path Test Values (Persona A-4471 Day 0)

| Metric | Value |
|--------|-------|
| S1 (self-report) | 50 |
| S2 (linguistic) | 55 |
| S3 (case context) | 90 |
| S4 (engagement) | 0 |
| Composite | 53.75 |
| Baseline μ | 28.90 |
| Baseline σ² | 2.70 (σ floored to 8) |
| z-score | 3.11 |
| Change Point | true |
| Tier | RED (SLA 30 min, ack required) |

S3 breakdown: bail +20, relief overdue 62d +15, adjournments 4 +10, open 400d +5 = 50 standing; intimidation 1d +25, hearing 6d +15 = 40 time-windowed → 90 total.

## Project Structure Highlights

```
app/
  api/checkin/route.ts      # Core 10-step pipeline
  api/staff/*               # Staff endpoints (queue, detail, alerts, audit)
  checkin/page.tsx          # Text chat UI (multilingual EN/HI)
  call/page.tsx             # Simulated IVRS (Web Speech API)
  staff/page.tsx            # Triage dashboard
  staff/[personId]/page.tsx # Person detail + explainability charts
components/
  staff/ExplainabilityChart.tsx  # S1..S5 additive breakdown
  staff/TrendChart.tsx           # EWMA baseline trajectory
  staff/AckModal.tsx             # Alert acknowledgment
  common/QuickExit.tsx           # ESC → weather.com (instant)
lib/
  scoring/              # s1.ts, s2.ts, s3.ts, s4.ts, s5.ts, composite.ts, baseline.ts
  safety/               # lexicon.ts (regex), interlock.ts (pass1/pass2), replies.ts
  llm/index.ts          # Swappable adapter (mock/groq/openrouter/gemini/ollama)
  policy/index.ts       # YAML evaluation engine
  db/client.ts          # Supabase service-role client (server-only)
  db/repository.ts      # Repository interface + in-memory test impl
policy/v1.yaml          # Versioned tier rules (weights, baseline, tiers, floors)
types/contract.ts       # Frozen Zod schemas for wire + DB models
scripts/
  test-runner.ts        # Auto-discovers tests/*.test.ts, supports filter arg
  fixtures.ts           # Persona A-4471 (golden), A-6218 (minor), controls
  seed.ts               # DB seeding script
tests/
  *.test.ts             # 136 tests across all phases
```

## Environment Variables (`.env.local`)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LLM_PROVIDER=mock|groq|openrouter|gemini|ollama|none
LLM_API_KEY=
LLM_MODEL=
STAFF_PASSCODE=          # Required — no fallback; app refuses staff login without it
SESSION_SECRET=          # HMAC for session tokens (defaults to STAFF_PASSCODE)
PROJECT_TZ=Asia/Kolkata  # Required for policy engine date logic
```

## Testing Notes

- **Run single phase**: `npm test -- phase3` (case-insensitive substring match on file path)
- **Test runner** discovers all `tests/*.test.ts` automatically
- **In-memory repository** used for tests — no Supabase needed
- **136 tests** cover: contracts, fixtures, safety lexicon (40 phrases), scoring math, policy, LLM adapter, pipeline integration, dashboard

## CI Pipeline (`.github/workflows/ci.yml`)

```yaml
1. npm ci
2. npx tsc --noEmit        # typecheck
3. npx tsx scripts/test-runner.ts  # tests
4. npm run build           # Next.js build
```

## Known Quirks

- **ESLint**: Uses legacy `.eslintrc.json` (flat config migration pending); `next lint` shows deprecation warning but works
- **README.md** — comprehensive project documentation and quickstart guide (see also `docs/PROJECT_BRIEF.md` and `ARCHITECTURE.md`)
- **Supabase not required for tests** — in-memory repo used; `npm run seed` needs real credentials
- **Mock LLM** is default — set `LLM_PROVIDER` for real providers
- **Timezone matters** — `PROJECT_TZ` affects S3 time-windowed calculations

## References

- `ARCHITECTURE.md` — Full technical architecture, pipeline diagram, math specs
- `docs/PROJECT_BRIEF.md` — Problem statement, governing principle, demo script
- `IMPLEMENTATION_PLAN.md` — Phase-by-phase roadmap with acceptance criteria
- `policy/v1.yaml` — Current policy config (v1.1.0)
- `designs/DESIGN.md` — Design tokens, color palette, typography

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
