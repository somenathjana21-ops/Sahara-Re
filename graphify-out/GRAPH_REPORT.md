# Graph Report - Sahara-Re  (2026-09-27)

## Corpus Check
- 77 files · ~76,105 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 490 nodes · 1058 edges · 28 communities (24 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `135227d5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- InMemoryRepository
- interlock.ts
- AGENTS.md - Project SAHARA Agent Instructions
- repository.ts
- useLanguage
- contract.ts
- dependencies
- compilerOptions
- devDependencies
- llm/index.ts
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
- scoring.test.ts
- composite.ts
- checkin/route.ts
- scoring/index.ts
- persons/route.ts
- baseline.ts

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
- `POST()` --calls--> `analyzeTranscript()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/llm/index.ts
- `POST()` --calls--> `evaluatePolicy()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/policy/index.ts
- `POST()` --calls--> `checkInput()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/safety/interlock.ts
- `POST()` --calls--> `computeS3()`  [EXTRACTED]
  app/api/checkin/route.ts → lib/scoring/s3.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Complete Scoring Pipeline** — concept_s1_self_report, concept_s2_linguistic, concept_s3_case_context, concept_s4_engagement, concept_s5_acoustic, concept_scoring_engine, concept_ewma_baseline, concept_policy_engine [EXTRACTED 0.85]
- **6-Phase Implementation Plan** — concept_phase1_contracts, concept_phase2_safety, concept_phase3_scoring, concept_phase4_pipeline, concept_phase5_ui, concept_phase6_dashboard [EXTRACTED 0.90]
- **Safety Interlock System (Two-Pass)** — concept_pass1_interlock, concept_pass2_interlock, concept_lexicon_v1, concept_boxed_llm_call [EXTRACTED 0.90]

## Communities (28 total, 4 thin omitted)

### Community 0 - "InMemoryRepository"
Cohesion: 0.06
Nodes (22): TriageQueueItem, AckModal(), AckModalProps, StaffAuthGate(), StaffAuthGateProps, TrendChart(), TrendChartProps, createDefaultSeededRepository() (+14 more)

### Community 1 - "interlock.ts"
Cohesion: 0.16
Nodes (18): BANNED_OUTPUT_RULES, BannedPatternRule, checkInput(), Pass1Result, Pass2Result, Pass2ViolationReason, LEXICON_RULES, LEXICON_VERSION (+10 more)

### Community 2 - "AGENTS.md - Project SAHARA Agent Instructions"
Cohesion: 0.12
Nodes (58): AGENTS.md - Project SAHARA Agent Instructions, ARCHITECTURE.md - Technical Architecture, 10-Step Pipeline, Audit Logging (Every Staff Read), Box Breathing Widget (4-4-4), Boxed LLM Call, Change Point Detection (z > 2.0), CI Pipeline (Typecheck, Test, Build) (+50 more)

### Community 3 - "repository.ts"
Cohesion: 0.09
Nodes (37): GET(), POST(), CasePatchSchema, GET(), PATCH(), DELETE(), GET(), POST() (+29 more)

### Community 4 - "useLanguage"
Cohesion: 0.09
Nodes (30): CallPage(), ChatMessage, CheckinPage(), metadata, plusJakartaSans, HomePage(), BreathingWidget(), CrisisHelplinesModal() (+22 more)

### Community 5 - "contract.ts"
Cohesion: 0.11
Nodes (18): S1Result, AlertAckRequest, AlertAckRequestSchema, AlertDispositionEnum, AudioMetricsSchema, Channel, ChannelEnum, CheckInRequestSchema (+10 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (30): clsx, lucide-react, next, dependencies, clsx, lucide-react, next, react (+22 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.09
Nodes (23): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+15 more)

### Community 9 - "llm/index.ts"
Cohesion: 0.18
Nodes (15): analyzeTranscript(), cleanJsonText(), generateDeterministicMock(), LLMAnalysisResult, LLMProvider, LLMRequestOptions, PROVIDER_CONFIGS, buildUserPrompt() (+7 more)

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

### Community 22 - "scoring.test.ts"
Cohesion: 0.18
Nodes (13): ConditionSchema, DeterministicTriggerInput, EscalationConfigSchema, evaluatePolicy(), EvaluatePolicyInput, getActivePolicy(), parseAndValidatePolicy(), PolicyDefinition (+5 more)

### Community 23 - "composite.ts"
Cohesion: 0.24
Nodes (10): ExplainabilityChart(), ExplainabilityChartProps, BASE_WEIGHTS, CompositeDistressResult, RawScores, ScoringWeights, ComponentsBreakdown, ComponentsBreakdownSchema (+2 more)

### Community 24 - "checkin/route.ts"
Cohesion: 0.35
Nodes (9): POST(), checkOutput(), getStaticReply(), evaluateBaseline(), computeComposite(), computeS1(), computeS2(), computeS4() (+1 more)

### Community 25 - "scoring/index.ts"
Cohesion: 0.18
Nodes (7): S2Result, S4Input, S4Result, S5_CAVEAT, S5_WEIGHT, S5Result, AudioMetrics

### Community 26 - "persons/route.ts"
Cohesion: 0.33
Nodes (7): GET(), POST(), computeS3(), S3ConditionBreakdown, S3Result, toMidnightMs(), CustomPersonRequestSchema

### Community 27 - "baseline.ts"
Cohesion: 0.40
Nodes (4): BaselineEvaluationResult, BaselineParameters, DEFAULT_BASELINE_CONFIG, PriorBaselineState

## Knowledge Gaps
- **140 isolated node(s):** `extends`, `next/core-web-vitals`, `react/no-unescaped-entities`, `CasePatchSchema`, `AuditEventCreateSchema` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getRepository()` connect `repository.ts` to `checkin/route.ts`, `InMemoryRepository`, `persons/route.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `InMemoryRepository` connect `InMemoryRepository` to `repository.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `react/no-unescaped-entities` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `InMemoryRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.05674044265593561 - nodes in this community are weakly interconnected._
- **Should `AGENTS.md - Project SAHARA Agent Instructions` be split into smaller, more focused modules?**
  _Cohesion score 0.1161524500907441 - nodes in this community are weakly interconnected._
- **Should `repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09220779220779221 - nodes in this community are weakly interconnected._
- **Should `useLanguage` be split into smaller, more focused modules?**
  _Cohesion score 0.09191919191919191 - nodes in this community are weakly interconnected._