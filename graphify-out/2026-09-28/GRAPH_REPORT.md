# Graph Report - Sahara-Re  (2026-09-28)

## Corpus Check
- 81 files · ~460,642 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 518 nodes · 1120 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e0edb199`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- InMemoryRepository
- llm/index.ts
- AGENTS.md - Project SAHARA Agent Instructions
- fixtures.ts
- useLanguage
- contract.ts
- dependencies
- compilerOptions
- devDependencies
- checkin/route.ts
- middleware.ts
- rules
- schema.sql
- auth/route.ts
- test-runner.ts
- CI workflow
- CLAUDE.md - Graphify Integration Rules
- next.config.ts
- postcss.config.mjs
- tailwind.config.ts
- persons/route.ts

## God Nodes (most connected - your core abstractions)
1. `AGENTS.md - Project SAHARA Agent Instructions` - 36 edges
2. `SAHARA LogicBase - Complete Project Documentation` - 32 edges
3. `getRepository()` - 29 edges
4. `InMemoryRepository` - 28 edges
5. `IRepository` - 24 edges
6. `IMPLEMENTATION_PLAN.md - Phase-by-Phase Roadmap` - 23 edges
7. `PROJECT_BRIEF.md - Project Brief SIH 26094` - 21 edges
8. `AlertRecord` - 20 edges
9. `POST()` - 19 edges
10. `useLanguage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `getRepository()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/db/repository.ts
- `POST()` --calls--> `analyzeTranscript()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/llm/index.ts
- `POST()` --calls--> `scrubPII()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/safety/pii.ts
- `POST()` --calls--> `computeS3()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/scoring/s3.ts
- `POST()` --calls--> `getRepository()`  [EXTRACTED]
  app/api/persons/route.ts → lib/db/repository.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Complete Scoring Pipeline** — concept_s1_self_report, concept_s2_linguistic, concept_s3_case_context, concept_s4_engagement, concept_s5_acoustic, concept_scoring_engine, concept_ewma_baseline, concept_policy_engine [EXTRACTED 0.85]
- **6-Phase Implementation Plan** — concept_phase1_contracts, concept_phase2_safety, concept_phase3_scoring, concept_phase4_pipeline, concept_phase5_ui, concept_phase6_dashboard [EXTRACTED 0.90]
- **Safety Interlock System (Two-Pass)** — concept_pass1_interlock, concept_pass2_interlock, concept_lexicon_v1, concept_boxed_llm_call [EXTRACTED 0.90]

## Communities (24 total, 4 thin omitted)

### Community 0 - "InMemoryRepository"
Cohesion: 0.06
Nodes (20): StaffTriageQueuePage(), PersonDetailScreen(), AckModal(), AckModalProps, StaffAuthGate(), StaffAuthGateProps, TrendChart(), TrendChartProps (+12 more)

### Community 1 - "llm/index.ts"
Cohesion: 0.16
Nodes (18): analyzeTranscript(), cleanJsonText(), generateDeterministicMock(), LLMAnalysisResult, LLMProvider, LLMRequestOptions, PROVIDER_CONFIGS, buildUserPrompt() (+10 more)

### Community 2 - "AGENTS.md - Project SAHARA Agent Instructions"
Cohesion: 0.12
Nodes (58): AGENTS.md - Project SAHARA Agent Instructions, ARCHITECTURE.md - Technical Architecture, 10-Step Pipeline, Audit Logging (Every Staff Read), Box Breathing Widget (4-4-4), Boxed LLM Call, Change Point Detection (z > 2.0), CI Pipeline (Typecheck, Test, Build) (+50 more)

### Community 3 - "fixtures.ts"
Cohesion: 0.07
Nodes (48): GET(), POST(), CasePatchSchema, GET(), PATCH(), DELETE(), GET(), POST() (+40 more)

### Community 4 - "useLanguage"
Cohesion: 0.09
Nodes (30): CallPage(), ChatMessage, CheckinPage(), metadata, plusJakartaSans, HomePage(), BreathingWidget(), CrisisHelplinesModal() (+22 more)

### Community 5 - "contract.ts"
Cohesion: 0.07
Nodes (33): ExplainabilityChart(), ExplainabilityChartProps, BASE_WEIGHTS, CompositeDistressResult, RawScores, ScoringWeights, S1Result, S5_CAVEAT (+25 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (30): clsx, lucide-react, next, dependencies, clsx, lucide-react, next, react (+22 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.09
Nodes (23): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+15 more)

### Community 9 - "checkin/route.ts"
Cohesion: 0.06
Nodes (49): POST(), TriageQueueItem, ConditionSchema, DeterministicTriggerInput, EscalationConfigSchema, evaluatePolicy(), EvaluatePolicyInput, EvaluatePolicyResult (+41 more)

### Community 10 - "middleware.ts"
Cohesion: 0.27
Nodes (9): base64urlDecode(), getKey(), getSessionSecret(), verifySessionTokenEdge(), config, enforceAuth(), extractToken(), middleware() (+1 more)

### Community 11 - "rules"
Cohesion: 0.29
Nodes (7): extends, rules, no-console, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, next/core-web-vitals, warn

### Community 12 - "schema.sql"
Cohesion: 0.54
Nodes (7): alerts, assessments, audit_events, cases, checkins, consents, persons

### Community 13 - "auth/route.ts"
Cohesion: 0.44
Nodes (7): DELETE(), POST(), generateSessionToken(), getSessionSecret(), timingSafeEqual(), verifyPasscode(), verifySessionToken()

### Community 14 - "test-runner.ts"
Cohesion: 0.50
Nodes (3): filterArg, testFiles, testsDir

### Community 15 - "CI workflow"
Cohesion: 0.67
Nodes (3): CI workflow, CI environment variables (STAFF_PASSCODE, SESSION_SECRET), CI pipeline (npm ci, typecheck, tests, build)

### Community 22 - "persons/route.ts"
Cohesion: 0.21
Nodes (11): GET(), POST(), containsPII(), PII_PATTERNS, scrubPII(), ScrubResult, computeS3(), S3ConditionBreakdown (+3 more)

## Knowledge Gaps
- **152 isolated node(s):** `extends`, `next/core-web-vitals`, `react/no-unescaped-entities`, `CasePatchSchema`, `AuditEventCreateSchema` (+147 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PersonRecord` connect `InMemoryRepository` to `checkin/route.ts`, `fixtures.ts`, `contract.ts`, `persons/route.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `AlertRecord` connect `InMemoryRepository` to `checkin/route.ts`, `fixtures.ts`, `contract.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `react/no-unescaped-entities` to the rest of the system?**
  _152 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `InMemoryRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.06189640035118525 - nodes in this community are weakly interconnected._
- **Should `AGENTS.md - Project SAHARA Agent Instructions` be split into smaller, more focused modules?**
  _Cohesion score 0.1161524500907441 - nodes in this community are weakly interconnected._
- **Should `fixtures.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07451923076923077 - nodes in this community are weakly interconnected._
- **Should `useLanguage` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._