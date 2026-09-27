# Graph Report - Sahara-Re  (2026-09-27)

## Corpus Check
- 77 files · ~79,498 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 501 nodes · 1082 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b10c9826`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- InMemoryRepository
- interlock.ts
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

## God Nodes (most connected - your core abstractions)
1. `AGENTS.md - Project SAHARA Agent Instructions` - 36 edges
2. `SAHARA LogicBase - Complete Project Documentation` - 32 edges
3. `getRepository()` - 29 edges
4. `InMemoryRepository` - 28 edges
5. `IRepository` - 24 edges
6. `IMPLEMENTATION_PLAN.md - Phase-by-Phase Roadmap` - 23 edges
7. `PROJECT_BRIEF.md - Project Brief SIH 26094` - 21 edges
8. `AlertRecord` - 20 edges
9. `useLanguage()` - 19 edges
10. `compilerOptions` - 19 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `getRepository()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/db/repository.ts
- `POST()` --calls--> `checkInput()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/safety/interlock.ts
- `POST()` --calls--> `checkOutput()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/safety/interlock.ts
- `POST()` --calls--> `getStaticReply()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/safety/replies.ts
- `POST()` --calls--> `computeS3()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/scoring/s3.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Complete Scoring Pipeline** — concept_s1_self_report, concept_s2_linguistic, concept_s3_case_context, concept_s4_engagement, concept_s5_acoustic, concept_scoring_engine, concept_ewma_baseline, concept_policy_engine [EXTRACTED 0.85]
- **6-Phase Implementation Plan** — concept_phase1_contracts, concept_phase2_safety, concept_phase3_scoring, concept_phase4_pipeline, concept_phase5_ui, concept_phase6_dashboard [EXTRACTED 0.90]
- **Safety Interlock System (Two-Pass)** — concept_pass1_interlock, concept_pass2_interlock, concept_lexicon_v1, concept_boxed_llm_call [EXTRACTED 0.90]

## Communities (22 total, 4 thin omitted)

### Community 0 - "InMemoryRepository"
Cohesion: 0.06
Nodes (17): AckModal(), AckModalProps, StaffAuthGate(), StaffAuthGateProps, TrendChart(), TrendChartProps, InMemoryRepository, IRepository (+9 more)

### Community 1 - "interlock.ts"
Cohesion: 0.15
Nodes (20): BANNED_OUTPUT_RULES, BannedPatternRule, checkInput(), checkOutput(), Pass1Result, Pass2Result, Pass2ViolationReason, LEXICON_RULES (+12 more)

### Community 2 - "AGENTS.md - Project SAHARA Agent Instructions"
Cohesion: 0.12
Nodes (58): AGENTS.md - Project SAHARA Agent Instructions, ARCHITECTURE.md - Technical Architecture, 10-Step Pipeline, Audit Logging (Every Staff Read), Box Breathing Widget (4-4-4), Boxed LLM Call, Change Point Detection (z > 2.0), CI Pipeline (Typecheck, Test, Build) (+50 more)

### Community 3 - "fixtures.ts"
Cohesion: 0.08
Nodes (46): GET(), POST(), CasePatchSchema, GET(), PATCH(), DELETE(), GET(), POST() (+38 more)

### Community 4 - "useLanguage"
Cohesion: 0.09
Nodes (30): CallPage(), ChatMessage, CheckinPage(), metadata, plusJakartaSans, HomePage(), BreathingWidget(), CrisisHelplinesModal() (+22 more)

### Community 5 - "contract.ts"
Cohesion: 0.06
Nodes (40): GET(), POST(), ExplainabilityChart(), ExplainabilityChartProps, BASE_WEIGHTS, CompositeDistressResult, RawScores, ScoringWeights (+32 more)

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
Cohesion: 0.07
Nodes (45): POST(), TriageQueueItem, analyzeTranscript(), cleanJsonText(), generateDeterministicMock(), LLMAnalysisResult, LLMProvider, LLMRequestOptions (+37 more)

### Community 10 - "middleware.ts"
Cohesion: 0.29
Nodes (8): base64urlDecode(), getKey(), verifySessionTokenEdge(), config, enforceAuth(), extractToken(), middleware(), PROTECTED_PATHS

### Community 11 - "rules"
Cohesion: 0.29
Nodes (7): extends, rules, no-console, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, next/core-web-vitals, warn

### Community 12 - "schema.sql"
Cohesion: 0.54
Nodes (7): alerts, assessments, audit_events, cases, checkins, consents, persons

### Community 13 - "auth/route.ts"
Cohesion: 0.57
Nodes (5): POST(), generateSessionToken(), timingSafeEqual(), verifyPasscode(), verifySessionToken()

### Community 14 - "test-runner.ts"
Cohesion: 0.50
Nodes (3): filterArg, testFiles, testsDir

### Community 15 - "CI workflow"
Cohesion: 0.67
Nodes (3): CI workflow, CI environment variables (STAFF_PASSCODE, SESSION_SECRET), CI pipeline (npm ci, typecheck, tests, build)

## Knowledge Gaps
- **148 isolated node(s):** `extends`, `next/core-web-vitals`, `react/no-unescaped-entities`, `CasePatchSchema`, `AuditEventCreateSchema` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `InMemoryRepository` connect `InMemoryRepository` to `fixtures.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `PersonRecord` connect `InMemoryRepository` to `checkin/route.ts`, `fixtures.ts`, `contract.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `react/no-unescaped-entities` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `InMemoryRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.061072261072261075 - nodes in this community are weakly interconnected._
- **Should `interlock.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1476923076923077 - nodes in this community are weakly interconnected._
- **Should `AGENTS.md - Project SAHARA Agent Instructions` be split into smaller, more focused modules?**
  _Cohesion score 0.1161524500907441 - nodes in this community are weakly interconnected._
- **Should `fixtures.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07834101382488479 - nodes in this community are weakly interconnected._