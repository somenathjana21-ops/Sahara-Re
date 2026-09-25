# Project SAHARA — Implementation Plan (SIH 26094)

## Overview & Governing Principle
> **"The AI does not decide. It decides who a human looks at next, and why."**

This document details the phase-by-phase implementation roadmap for Project SAHARA (Dynamic Mental Health Monitoring & Distress Prediction System for Victims of Atrocities). Execution will proceed strictly one phase at a time, followed by checkpoint verification and reporting before advancing.

---

## Roadmap at a Glance

| Phase | Focus Area | Key Output & Files | Acceptance Gate |
|---|---|---|---|
| **Phase 1** | Core Contracts, Schema & Fixtures | `types/contract.ts`, `supabase/schema.sql`, `scripts/fixtures.ts`, `scripts/seed.ts` | Golden Path Persona `A-4471` seeded; RLS locked; contracts typecheck clean |
| **Phase 2** | Deterministic Safety Interlock & Reply Banks | `lib/safety/lexicon.ts`, `lib/safety/interlock.ts`, `lib/safety/replies.ts` | 100% recall on 40 seeded critical phrases; Pass 2 rejection of advice/diagnosis |
| **Phase 3** | Swappable LLM Adapter & Scoring Math | `lib/llm/index.ts`, `lib/scoring/*.ts`, `policy/v1.yaml`, `lib/policy/index.ts` | Day 0 math passes ($S_3=90, C=53.75, z=3.11$, RED); $S_5$ weight locked to 0.00 |
| **Phase 4** | Core API Pipeline (`POST /api/checkin`) | `app/api/checkin/route.ts`, `app/api/consent/route.ts`, `app/api/cases/route.ts` | 403 on missing consent (0 DB writes); minor bypass (0 scoring rows); full pipeline integration |
| **Phase 5** | Multilingual Public Interfaces | `app/page.tsx`, `app/checkin/page.tsx`, `app/call/page.tsx`, `locales/*.json` | Design fidelity to `designs/code.html` & `DESIGN.md`; ESC quick exit; simulated IVRS with Keypad `0` |
| **Phase 6** | Counsellor Triage Dashboard | `app/staff/page.tsx`, `app/staff/[personId]/page.tsx`, audit logging | Queue sorted by severity/SLA; explainable breakdown chart; baseline trend graph; alert ACK flow |

---

## Phase 1: Core Data Contracts, Supabase Schema, Seed Fixtures, & Validation

### Objective
Establish the foundational data contracts, database schema with complete RLS lockdown, client/repository abstraction, and deterministic test fixtures including persona `A-4471`.

### Component Responsibilities
- **Contracts (`types/contract.ts`)**: Frozen single-source-of-truth for all wire payloads (camelCase) and database models (snake_case), with accompanying Zod schemas.
- **Database Schema (`supabase/schema.sql`)**: PostgreSQL schema with RLS enabled on all 7 tables and zero public access policies.
- **Data Access Layer (`lib/db/client.ts`, `lib/db/repository.ts`)**: Server-only Supabase service-role client with an in-memory repository fallback for hermetic offline testing.
- **Fixtures (`scripts/fixtures.ts`, `scripts/seed.ts`)**: Seed scripts populating persona `A-4471` (Golden Path), `A-6218` (Minor Flag), and diverse control personas.

### Files to Create / Edit
- `package.json` — Next.js 15, TypeScript, Tailwind CSS, Zod, Supabase JS, Lucide icons
- `tsconfig.json` — Strict TypeScript configuration
- `next.config.ts` — App Router configuration
- `tailwind.config.ts` & `app/globals.css` — Theme tokens matching `designs/DESIGN.md`
- `types/contract.ts` — Typed wire & DB interfaces + Zod schemas
- `supabase/schema.sql` — Schema definition with RLS on all tables
- `lib/db/client.ts` — Supabase client factory (server-side service role key)
- `lib/db/repository.ts` — Database repository interface & implementation with in-memory test fallback
- `scripts/fixtures.ts` — Static test persona definitions and history records
- `scripts/seed.ts` — Database seed execution script

### Acceptance Criteria
1. `npm run typecheck` succeeds without errors.
2. Persona `A-4471` is seeded with:
   - Accused on bail (+20), relief overdue 62 days (+15), 4 adjournments (+10), case open 400 days (+5) = 50 standing points.
   - Day -3 history: $S_3 = 50$, Composite = $28.00$, $\mu_0 = 28.00$, $\sigma_0^2 = 0$.
   - Day -2 history: $S_3 = 50$, Composite = $31.00$, $\mu_1 = 28.90$, $\sigma_1^2 = 2.70$ (true $\sigma = 1.64$, floored to 8).
   - Day -1 transition: Intimidation report filed (+25), trial hearing in 6 days (+15) $\rightarrow S_3 = 90$.
3. All tables in `supabase/schema.sql` have RLS enabled with 0 public policies.

---

## Phase 2: Deterministic Safety Interlock & Fixed Reply Banks

### Objective
Implement the two-pass safety interlock ensuring crisis detection is deterministic code-based regex matching and all LLM output is strictly sanitized against clinical advice, diagnoses, and false reassurance.

### Component Responsibilities
- **Input Lexicon (`lib/safety/lexicon.ts`)**: 4 categories (self-harm, hopelessness, immediate danger, direct request) across English, Devanagari Hindi, and Romanised Hindi. Zero `g` flags. No negation handling ("I don't want to die" still fires).
- **Interlock Passes (`lib/safety/interlock.ts`)**:
  - `checkInput(transcript)`: Pass 1 on user input. On match, triggers instant `CRITICAL` and bypasses LLM.
  - `checkOutput(reply)`: Pass 2 on LLM output. Catches advice, diagnosis, false reassurance, outcome promises, repeated crisis terms, or excessive length.
- **Reply Bank (`lib/safety/replies.ts`)**: Human-authored, immutable static text for consent notices, crisis helpline delivery, minor diversion, and pass-2 fallbacks in English and Hindi.

### Files to Create / Edit
- `lib/safety/lexicon.ts` — Versioned regex patterns (`lexicon-v1.0.0`) with reviewer audit metadata
- `lib/safety/interlock.ts` — Pass 1 and Pass 2 evaluation functions
- `lib/safety/replies.ts` — Static bilingual reply bank
- `tests/safety.test.ts` — Test suite for 100% detection of 40 seeded critical phrases and Pass 2 rejection rules

### Acceptance Criteria
1. 100% recall on 40 seeded critical test phrases across English, Devanagari, and Romanised Hindi.
2. Any string containing banned LLM patterns (e.g. "you should try breathing", "sounds like depression", "everything will be fine") is rejected and replaced by `fallback_reply`.
3. Input with negation (e.g. "I do not want to die") triggers Pass 1 `CRITICAL` (fails safe).

---

## Phase 3: Swappable LLM Adapter, Scoring Math & Policy Engine

### Objective
Construct the swappable OpenAI-compatible LLM adapter, the mathematical scoring engine ($S_1$ through $S_5$), missing signal renormalisation, dynamic EWMA baselining, and the YAML-driven policy engine.

### Component Responsibilities
- **LLM Adapter (`lib/llm/index.ts`, `lib/llm/prompt.ts`)**: Generic OpenAI-compatible client supporting Groq, OpenRouter, Nemotron, local Ollama, or deterministic mock. Gracefully returns `s2_score: null` on failure or schema mismatch.
- **Mathematical Engine (`lib/scoring/`)**:
  - $S_1$ Self-Report: Answered questions sum normalized to 0–100. $q_3 = 4$ triggers deterministic `self_report_q3` CRITICAL.
  - $S_2$ Linguistic: Score from LLM or `null`.
  - $S_3$ Case Context: Deterministic calendar & case file evaluation capped at 100.
  - $S_4$ Engagement: Monotonic scoring (+25 missed check-in, +20 mid-flow abandonment).
  - $S_5$ Acoustic: Computed for display; weight strictly locked to 0.00.
  - Renormalisation: Scales weights over present components when $S_1$ or $S_2$ is `null`.
  - EWMA Baseline: Evaluates $z_t$ **before** updating $\mu_t$ and $\sigma_t^2$ ($\lambda = 0.3, \text{floor} = 8$). Change point triggered when $z_t > 2.0 \land \text{history} \ge 2$.
- **Policy Engine (`policy/v1.yaml`, `lib/policy/index.ts`)**: Versioned YAML policy assigning tiers (RED, AMBER, GREEN). Policy cannot originate CRITICAL. Model cannot lower tier.

### Files to Create / Edit
- `lib/llm/index.ts` — Swappable adapter with graceful degradation
- `lib/llm/prompt.ts` — Boxed prompt template & Zod output parser
- `lib/scoring/s1.ts` — Self-report calculation & $q_3$ safety check
- `lib/scoring/s2.ts` — Linguistic score validator & null handler
- `lib/scoring/s3.ts` — Deterministic case context calculator
- `lib/scoring/s4.ts` — Engagement monotonicity calculator
- `lib/scoring/s5.ts` — Paralinguistic feature calculator (weight 0.00)
- `lib/scoring/composite.ts` — Missing signal renormalisation & composite sum
- `lib/scoring/baseline.ts` — EWMA and change-point engine
- `policy/v1.yaml` — Versioned policy definition (`v1.1.0`)
- `lib/policy/index.ts` — Policy evaluation logic
- `tests/scoring.test.ts` — Verification of math, baselines, and policy rules

### Acceptance Criteria
1. Day 0 golden path calculation matches exact expected values:
   - Raw scores: $S_1 = 50, S_2 = 55, S_3 = 90, S_4 = 0$
   - Contributions: $S_1 = 17.50, S_2 = 13.75, S_3 = 22.50, S_4 = 0.00$
   - Composite = $53.75$
   - $z$-score = $3.11$ (calculated using $\mu_1 = 28.90, \sigma = 8$)
   - Change Point = `true`, Tier = `RED`.
2. When $S_2$ is `null`, weights renormalise over $S_1, S_3, S_4$ without throwing errors.
3. Acoustic weight ($S_5$) cannot be set above 0.00 (zod validation fails if non-zero).

---

## Phase 4: Core API Pipeline (`POST /api/checkin`)

### Objective
Unify validation, consent verification, minor routing, two-pass safety, LLM invocation, mathematical scoring, policy evaluation, and database persistence into the single check-in pipeline.

### Component Responsibilities
- **API Handler (`app/api/checkin/route.ts`)**: Executes the 10-step ingestion pipeline.
  1. Zod payload validation.
  2. Consent Gate: Return 403 Forbidden with 0 writes if no active consent row.
  3. Minor Check: Return caseworker diversion with 0 scoring rows if `is_minor_flag === true`.
  4. Pass 1 Interlock: Instant synchronous crisis resources on regex hit.
  5. Boxed LLM Call: Generate acknowledgment, question, and $S_2$.
  6. Pass 2 Interlock: Substitute fallback reply if LLM output violates safety guidelines.
  7. Scoring Engine: Compute $S_1..S_5$, apply renormalisation, compute baseline & $z$-score.
  8. Policy Engine: Assign tier.
  9. Persistence: Write `checkins`, `assessments`, and conditional `alerts` (Tier $\ge$ RED).
  10. Return typed `CheckInResponse`.
- **Ancillary APIs**: `app/api/consent/route.ts`, `app/api/cases/route.ts`, `app/api/alerts/route.ts`.

### Files to Create / Edit
- `app/api/checkin/route.ts` — Core pipeline handler
- `app/api/consent/route.ts` — Grant / revoke consent endpoint
- `app/api/cases/route.ts` — Case query endpoint for simulation
- `app/api/alerts/route.ts` — Alert listing and acknowledgment endpoint
- `tests/pipeline.test.ts` — Integration test covering all branches

### Acceptance Criteria
1. Check-in request without active consent returns HTTP 403 Forbidden with 0 database rows created.
2. Check-in for minor persona `A-6218` returns caseworker referral with 0 assessment rows written.
3. Crisis utterance triggers Pass 1, returns synchronous crisis helplines, and records CRITICAL alert without invoking LLM.
4. Normal check-in writes `checkin` and `assessment` records and updates person baseline.

---

## Phase 5: Multilingual Public Interfaces (`/checkin` and `/call`)

### Objective
Build the client-facing user interfaces following the design specifications in `designs/DESIGN.md` and `designs/code.html`, featuring multilingual localization (English and Hindi), voluntary consent, grounding box breathing, text check-in, and simulated speech IVRS.

### Component Responsibilities
- **Design Tokens & Shell**: Deep sage green (`#206140`), soft stone canvas (`#F8FAFC`), Plus Jakarta Sans typography, WCAG 2.1 AAA contrast.
- **Global Header**: 24/7 Hotline Quick Notice Sub-bar (NHAA 14566, Tele-MANAS 14416), "Safe Connection" indicator, and "Quick Exit [ESC]" button with instant history-clearing redirect to weather.com.
- **Grounding Breathing Tool**: 4-4-4 box breathing interactive visualizer.
- **Chat Check-in (`/checkin`)**: Conversational message list, S1 question cards ($q_1, q_2, q_3$), and "Talk to a Person" panic button.
- **Simulated Call IVRS (`/call`)**: Simulated telephony interface using Web Speech API (`SpeechRecognition` & `SpeechSynthesis`), prominent "Simulated Voice Interface" disclaimer banner, and interactive keypad with `0` Emergency Key.
- **Localization**: Lean dictionary-based system in `locales/en.json` and `locales/hi.json`.

### Files to Create / Edit
- `locales/en.json` & `locales/hi.json` — Localization dictionaries
- `components/common/Header.tsx` — Global header with 24/7 hotline and Quick Exit
- `components/common/QuickExit.tsx` — Keyboard `ESC` and click exit handler
- `components/common/BreathingWidget.tsx` — 4-4-4 box breathing widget
- `components/common/LanguageSwitcher.tsx` — Bilingual toggle
- `app/page.tsx` — Sanctuary landing page matching `designs/code.html`
- `app/checkin/page.tsx` — Text check-in conversational chat interface
- `app/call/page.tsx` — Simulated IVRS speech-to-text / text-to-speech interface

### Acceptance Criteria
1. Pressing `ESC` on any screen immediately navigates to `https://weather.com`.
2. Language toggle smoothly switches all UI text between English and Hindi.
3. Pressing keypad `0` on `/call` or clicking "Talk to a Person" on `/checkin` immediately renders crisis helplines locally without network delay.
4. Text and simulated speech check-ins post to `/api/checkin` and render response messages.

---

## Phase 6: Counsellor Triage Dashboard (`/staff`)

### Objective
Build the staff-facing dashboard providing an explainable, triaged view of monitored victims, interactive trend graphs, alert acknowledgments, and audit logging.

### Component Responsibilities
- **Staff Access Gate**: Simple passcode authentication (`STAFF_PASSCODE`).
- **Triage Queue**: Ranked view prioritizing CRITICAL $\rightarrow$ RED $\rightarrow$ AMBER $\rightarrow$ GREEN, highlighting change-point flags and SLA countdowns.
- **Person Detail & Explainability View**:
  - Additive Component Breakdown: Stacked/bar chart illustrating exact point contributions of $S_1, S_2, S_3, S_4, S_5$.
  - Dynamic Baseline Trend Chart: Visual trajectory of historical check-ins with baseline mean ($\mu$) and standard deviation bands ($\sigma$).
  - Case Milestones ($S_3$): Direct inspection of upcoming hearing dates, bail status, and intimidation reports.
  - Alert Acknowledgment: Action button recording staff handle and disposition (`contacted`, `no_action_needed`, `escalated`).
- **Audit Logging**: Every staff view of person-level data records an immutable entry in `audit_events`.

### Files to Create / Edit
- `app/staff/page.tsx` — Triaged queue view with filters, SLA badges, and summary statistics
- `app/staff/[personId]/page.tsx` — Detailed person view with explainability breakdown & baseline trend chart
- `components/staff/ExplainabilityChart.tsx` — Component breakdown chart ($S_1$ through $S_5$)
- `components/staff/TrendChart.tsx` — Historical trajectory with EWMA baseline and $z$-score
- `components/staff/AckModal.tsx` — Alert acknowledgment & disposition modal
- `app/api/staff/audit/route.ts` — Audit event logging endpoint

### Acceptance Criteria
1. Triage queue lists persona `A-4471` in RED tier with Change Point badge ($z = 3.11$) and 30-minute SLA timer.
2. Person detail view for `A-4471` displays the exact component breakdown: $S_3$ is the dominant contributor ($22.50$ points), larger than $S_1$ ($17.50$) and $S_2$ ($13.75$).
3. Acknowledging an alert requires a staff handle and records timestamp and disposition in `alerts` and `audit_events`.
4. Reading any person detail screen creates a `view_person` audit event.

---

## Checkpoint Reporting Protocol
At the conclusion of each phase:
1. All automated tests for that phase will be executed and reported.
2. A status summary listing files created/modified and verification evidence will be presented.
3. Explicit user confirmation will be requested before beginning the subsequent phase.
