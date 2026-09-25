# SAHARA LogicBase — Complete Project Documentation

**Project:** SIH 26094 — Dynamic Distress Monitoring (MVP)  
**Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase · Vercel  
**Timeline:** 5-day hackathon build  
**Deployed:** https://sahara-ruddy.vercel.app

---

## 1. PROJECT BRIEF

### 1.1 The Problem
The Ministry of Social Justice and Empowerment states: victims of atrocities experience prolonged psychological distress **after** the complaint is registered — from threats, intimidation, repeated court appearances, investigation and trial delays, social ostracism, economic hardship, and rehabilitation difficulties. Existing mechanisms cover legal and financial support but **do not monitor wellbeing at all**.

**The gap:** Between the day a complaint is filed and the day a case resolves (often years), nobody watches how the person is doing.

### 1.2 The Governing Principle
> **The AI does not decide. It decides who a human looks at next, and why.**

This single sentence resolves every design conflict. The system ranks a counsellor's queue better than "whoever called most recently" and explains each ranking well enough that the counsellor can disagree with it.

### 1.3 Core Insight — Why S3 (Case Context) Wins
Most teams build chatbots reading emotion from speech/text. Two problems:
1. **Unreliable** — acoustic emotion inference degrades across accent, dialect, gender, recording quality → works *worst* for rural, low-income, marginalised callers
2. **Ignores the answer in plain sight** — the problem statement's own stressors are knowable from a case file and a calendar:
   - Hearing in next 7 days?
   - Adjournment count?
   - Accused on bail?
   - Compensation overdue?
   - Intimidation report filed recently?

**No NLP, no voice analysis, no training data, no model.** Just a database query and today's date — more predictive, trivially explainable. This is the **S3 case-context signal**, the centrepiece of the pitch.

### 1.4 What We Deliberately Did Not Build
| Not Built | Why |
|-----------|-----|
| Real telephony | Approval latency exceeds build window; `/call` is simulated in-browser |
| SMS / WhatsApp | Same pipeline, no new insight, real integration cost |
| Accounts, login, email | No personal data stored → nothing to authenticate to |
| Live NHAA integration | Requires data-sharing permissions we don't have |
| Languages beyond Hindi + English | Ship two languages end-to-end rather than claiming ten with only UI translated |
| Trained distress classifier | Would defeat explainability; no labelled longitudinal data exists |
| Automated scoring for minors | Guardian consent collides with intra-family abuse; route to human instead |

### 1.5 What Is Genuinely Uncertain (Volunteered Honestly)
- Speech recognition accuracy varies by dialect; typed path always exists
- Scoring weights are authored, not learned — defensible starting point, not validated instrument
- Corpus is synthetic; real victim data cannot ethically be used
- False-positive rate in field unknown — we report recall on seeded critical + per-language, **never accuracy** (at ~0.5% base rate, "always fine" scores 99.5%)
- Deployment needs paid/self-hosted model endpoint; free tiers may train on inputs
- Real deployment needs named clinical supervisor — engineers cannot sign off crisis lexicon

---

## 2. ARCHITECTURE

### 2.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        THREE ENTRY POINTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  /checkin (chat UI)        /call (simulated IVRS)        (future: SMS)      │
└──────────────┬──────────────┬───────────────────────────────────────────────┘
               │              │
               ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POST /api/checkin  (SINGLE PIPELINE)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. VALIDATE              → types/contract.ts (frozen)                      │
│  2. CONSENT GATE          → 403 if no live consent, NOTHING written         │
│  3. MINOR CHECK           → fixed reply, human route, NO assessment         │
│  4. PASS 1 INTERLOCK      → lexicon on user input → CRITICAL, skip LLM      │
│  5. LLM CALL              → acknowledge + one question + S2 signal          │
│  6. PASS 2 INTERLOCK      → banned patterns on LLM output → fallback        │
│  7. SCORING               → S1..S5 → composite → EWMA → z-score → change pt│
│  8. POLICY ENGINE         → versioned YAML → GREEN/AMBER/RED/CRITICAL       │
│  9. PERSIST               → checkin + assessment + alert (if RED/CRITICAL)  │
│ 10. RESPONSE              → CheckInResponse (tier, reply, resources, etc.)  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COUNSELLOR DASHBOARD  (/staff)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Queue (tier, composite, change-point, SLA)                                 │
│  Person Detail → Trend chart + Component breakdown (EXPLAINABILITY)         │
│  Alert acknowledgement + disposition                                        │
│  Audit trail on every read                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — The 10-Step Pipeline

```
┌─────┐   ┌──────────┐   ┌─────────┐   ┌─────────────┐   ┌────────┐
│INPUT│──►│ CONSENT  │──►│ MINOR?  │──►│ PASS 1:     │──►│  LLM   │
│     │   │  GATE    │   │  CHECK  │   │ LEXICON     │   │        │
└─────┘   └──────────┘   └─────────┘   │  (CRITICAL?)│   └────┬───┘
                                        └──────┬──────┘        │
                                               │NO             │YES
                                               ▼               ▼
                                    ┌─────────────────┐  CRITICAL
                                    │  PASS 2: OUTPUT │  RESOURCES
                                    │  (BANNED?)      │  INSTANT
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  SCORING S1-S5  │
                                    │  + EWMA + z     │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  POLICY ENGINE  │
                                    │  (versioned)    │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  PERSIST +      │
                                    │  ALERT IF ≥RED  │
                                    └─────────────────┘
```

### 2.3 Component Ownership (Enforced by CODEOWNERS)

| Path | Owner | Scope |
|------|-------|-------|
| `lib/**`, `app/api/**`, `evals/**`, `policy/**`, `scripts/fixtures.ts` | **TM1** | Model, policy, scoring, safety, evals — frozen after Day 0 |
| `app/(public)/**`, `components/ui/**`, `app/globals.css`, `tailwind.config.ts` | **TM2** | Design tokens, public UI, chat/call screens |
| `app/(staff)/**`, `app/call/**`, `supabase/**`, `scripts/seed.ts` | **TM3** | Staff dashboard, simulated IVRS, database, seeding |
| `types/contract.ts` | **TM1 (FROZEN)** | The seam — all API I/O; changes need TM1 sign-off + group message |

### 2.4 Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 15 App Router, React 18, TypeScript | Server components by default |
| Styling | Tailwind CSS v4 | Tokens only in `app/globals.css` |
| Database | Supabase (PostgreSQL) | RLS enabled, no policies — service role key server-only |
| LLM | Swappable adapter (Groq, Gemini, OpenRouter, Ollama) | Single entry point: `lib/llm/index.ts` |
| Validation | Zod v4 | All API I/O via `types/contract.ts` |
| Testing | Node built-in test runner + tsx | `npm run test` — filters via `npm run test -- <filter>` |
| Evaluation | Custom harness (`evals/run.ts`) | Runs REAL pipeline; prints confusion matrix, recall, latency |

---

## 3. NAMING SCHEMES & CONVENTIONS

### 3.1 Database Naming (snake_case)
All tables and columns use snake_case matching `supabase/schema.sql`:
- Tables: `persons`, `cases`, `consents`, `checkins`, `assessments`, `alerts`, `audit_events`
- Columns: `person_id`, `next_hearing_date`, `baseline_mean`, `checkin_count`, etc.

### 3.2 API / TypeScript Naming (camelCase)
All wire payloads use camelCase per `types/contract.ts`:
- `personId`, `consentId`, `nextHearingDate`, `baselineMean`, `checkinCount`, etc.

### 3.3 Person Pseudonyms
- Format: `A-XXXX` (e.g., `A-4471`, `A-2301`, `A-6218`)
- **Never** real names, phone numbers, emails, addresses, or real case numbers
- Golden path persona: `A-4471` (UUID: `11111111-1111-1111-1111-111111111111`)
- Minor flag persona: `A-6218` (routes to human, no scoring)

### 3.4 Version Identifiers
- **Policy version:** `v1.1.0` (from `policy/v1.yaml`)
- **Lexicon version:** `lexicon-v1.0.0` (from `lib/safety/lexicon.ts`)
- **Prompt version:** `1.0.0` (from `lib/llm/prompt.ts`)
- **Model version format:** `<provider>:<modelId>+prompt-<PROMPT_VERSION>`
  - Example: `groq:openai/gpt-oss-120b+prompt-1.0.0`
  - One column, both facts, splittable on `+`

### 3.5 Environment Variables (6 server-only)

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS (server-only!) | `eyJ...` |
| `LLM_PROVIDER` | `groq` \| `gemini` \| `openrouter` \| `ollama` | `groq` |
| `LLM_API_KEY` | Provider API key | `gsk_...` |
| `LLM_MODEL` | Pinned model ID (ask TM1) | `openai/gpt-oss-120b` |
| `STAFF_PASSCODE` | Shared team passcode for `/staff` | `sahara2026` |

**Production:** `PROJECT_TZ=Asia/Kolkata` as Vercel Project Env Var (not `.env.local`). `TZ` is reserved by Vercel.

---

## 4. DATABASE SCHEMA (Logical)

### 4.1 Entity Relationship Diagram

```
persons ◄─────┐
  │           │
  ▼           │
cases ◄───────┘ (1:1, person_id FK)
  │
  ▼
consents ◄──────┐
  │             │
  ▼             │
checkins ◄──────┘ (1:N, person_id FK)
  │
  ▼
assessments ◄───┐
  │             │
  ▼             │
alerts ◄────────┘ (1:N, assessment_id FK)

audit_events (standalone, logs every staff read)
```

### 4.2 Key Tables (Logical View)

#### `persons` — The Monitored Individual
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PK |
| `pseudonym` | TEXT UNIQUE | `A-4471` — never real name |
| `language` | TEXT | `'en'` \| `'hi'` |
| `is_minor_flag` | BOOLEAN | `true` → human route, NO scoring |
| `baseline_mean` | NUMERIC | EWMA μ (null until 1st check-in) |
| `baseline_var` | NUMERIC | EWMA σ² |
| `checkin_count` | INT | History length for change-point |
| `missed_count` | INT | Missed scheduled check-ins |
| `created_at` | TIMESTAMPTZ | |

#### `cases` — The S3 Signal Source (Case Context)
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PK |
| `person_id` | UUID | FK → persons |
| `atrocity_category` | TEXT | From case taxonomy |
| `stage` | TEXT | `investigation`\|`trial`\|`rehabilitation`\|`compensation` |
| `next_hearing_date` | DATE | Drives S3 row 3 (7-day window) |
| `adjournment_count` | INT | Drives S3 row 5 (≥3 → +10) |
| `bail_status` | TEXT | `accused_on_bail` → +20 |
| `relief_due_date` | DATE | Drives S3 row 4 (>30 days overdue → +15) |
| `relief_paid` | BOOLEAN | |
| `social_boycott_flag` | BOOLEAN | Drives S3 row 6 (+10) |
| `last_intimidation_report` | DATE | Drives S3 row 1 (14-day window → +25) |
| `opened_at` | DATE | Drives S3 row 7 (>365 days → +5) |

#### `consents` — Consent Gate (Hard Requirement)
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PK |
| `person_id` | UUID | FK |
| `purpose` | TEXT | Default `distress_monitoring` |
| `capture_method` | TEXT | `tap` \| `voice_simulated` |
| `granted_at` | TIMESTAMPTZ | |
| `withdrawn_at` | TIMESTAMPTZ | Non-null = consent withdrawn |

#### `checkins` — One Row Per Interaction
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PK |
| `person_id` | UUID | FK |
| `consent_id` | UUID | FK (nullable in DB, required by API) |
| `channel` | TEXT | `chat` \| `call_sim` |
| `transcript` | TEXT | Nullable |
| `structured` | JSONB | `{q1,q2,q3}` each 0-4, defaults `{}` |
| `abandoned` | BOOLEAN | Mid-flow dropout |
| `created_at` | TIMESTAMPTZ | |

#### `assessments` — The Scored Output (Immutable Snapshot)
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PK |
| `checkin_id` | UUID | FK |
| `person_id` | UUID | FK |
| `components` | JSONB | `{s1,s2,s3,s4,s5}` each 0-100 or null |
| `contributions` | JSONB | Weighted values for breakdown chart |
| `composite` | NUMERIC | 0-100 |
| `z_score` | NUMERIC | Null until baseline exists |
| `change_point` | BOOLEAN | `z > 2.0` AND ≥2 prior check-ins |
| `tier` | TEXT | `GREEN`\|`AMBER`\|`RED`\|`CRITICAL` |
| `trigger_source` | TEXT | `policy`\|`lexicon`\|`panic_key`\|`self_report_q3` |
| `explanation` | JSONB | Human-readable lines |
| `policy_version` | TEXT | e.g., `v1.1.0` |
| `model_version` | TEXT | e.g., `groq:openai/gpt-oss-120b+prompt-1.0.0` |
| `created_at` | TIMESTAMPTZ | |

#### `alerts` — Acknowledgement-Required Escalation
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PK |
| `assessment_id` | UUID | FK |
| `person_id` | UUID | FK |
| `tier` | TEXT | `AMBER`\|`RED`\|`CRITICAL` |
| `sla_minutes` | INT | CRITICAL=0, RED=30, AMBER=1440, GREEN=10080 |
| `created_at` | TIMESTAMPTZ | |
| `acked_at` | TIMESTAMPTZ | Null = not acknowledged |
| `acked_by` | TEXT | Staff handle (not real name) |
| `disposition` | TEXT | `contacted`\|`no_action_needed`\|`escalated`\|`pending` |

#### `audit_events` — Every Staff Read Audited
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PK |
| `actor` | TEXT | Staff handle |
| `role` | TEXT | `counsellor`\|`operator`\|`admin` |
| `action` | TEXT | `view_queue`\|`view_person`\|`ack_alert`\|`dispose` |
| `subject_id` | UUID | Nullable |
| `created_at` | TIMESTAMPTZ | |

### 4.3 Security Model
- **RLS enabled on ALL tables, NO policies defined** → anon key returns nothing
- All access via Next.js route handlers using `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Browser NEVER touches Supabase directly
- If something needs a policy to work, the something is wrong — not the RLS

---

## 5. THE FIVE SIGNALS (S1–S5) — MATHEMATICAL SPECIFICATION

### 5.1 Composite Formula

```
composite = 0.35·S1 + 0.25·S2 + 0.25·S3 + 0.15·S4 + 0.00·S5
```

Each component: 0–100. Composite: 0–100.

| Signal | Weight | Name | Source |
|--------|--------|------|--------|
| **S1** | 0.35 | Self-report | 3 structured questions (0-4 each) |
| **S2** | 0.25 | Linguistic distress | LLM from transcript |
| **S3** | 0.25 | **Case context** | Deterministic from `cases` row + calendar |
| **S4** | 0.15 | Engagement | Missed check-ins, latency, abandonment |
| **S5** | 0.00 | Acoustic/paralinguistic | Extracted, displayed with caveat, **never scored** |

**S5's zero is deliberate.** Acoustic emotion inference is least accurate for exactly the callers this system exists for (regional accents, code-switching, poor line quality). Weighting it would push largest errors onto most marginalised users. We compute it, show it labelled "low confidence", contribute 0.00.

### 5.2 S1 — Self-Report (Weight 0.35)

Three questions, scale 0–4 each:

| ID | Question | Scale |
|----|----------|-------|
| q1 | How have you been feeling since we last spoke? | 0 = much better … 4 = much worse |
| q2 | How much has this been affecting your sleep and eating? | 0 = not at all … 4 = a great deal |
| q3 | Do you feel safe right now? | 0 = yes … 4 = no |

**Formula:**
```
S1 = (q1 + q2 + q3) / (answered_count × 4) × 100
```
- Renormalises over **actually answered** questions (not 12)
- Returns `null` if zero answered (missing signal ≠ calm signal)
- **q3 = 4 is a CRITICAL trigger on its own** — bypasses composite entirely

### 5.3 S2 — Linguistic Distress (Weight 0.25)

- From LLM output: `s2_score` (0-100) + `markers` + `evidence` + `language`
- **Nullable:** provider unavailable, schema validation failed → `S2 = null`
- **Never default to 0** — missing signal ≠ calm signal
- Renormalisation over remaining weights when null

### 5.4 S3 — Case Context (Weight 0.25) — THE CENTREPIECE

**Deterministic, no model, from `cases` row + calendar.**

```
S3 = min(100, sum of applicable rows below)
```

| Row | Condition | Points | Kind | Rationale |
|-----|-----------|--------|------|-----------|
| 1 | Intimidation report filed in last 14 days | **+25** | **time-windowed** | Strongest predictor; direct pre-crisis signal |
| 2 | Accused released on bail | +20 | static | Concrete fear |
| 3 | Next hearing within 7 days | +15 | **time-windowed** | Anticipatory distress is measurable |
| 4 | Relief instalment overdue > 30 days | +15 | static | Economic hardship compounds daily |
| 5 | Adjournment count ≥ 3 | +10 | static | "Delays in investigation and trial" |
| 6 | Social boycott flag on case | +10 | static | Isolation removes buffer |
| 7 | Case open longer than 365 days | +5 | static | Duration wears people down |

**Critical:** Rows 1 & 3 are **time-windowed** — they change on their own as calendar advances. S3 moving over time is ENTIRELY down to these two rows. Golden path depends on this.

**Snapshot semantics:** S3 computed at check-in time, frozen into `assessments.components`. Never recompute historical S3 from today's case row — trend chart would lie.

### 5.5 S4 — Engagement (Weight 0.15)

| Condition | Points |
|-----------|--------|
| 1 missed scheduled check-in | +25 |
| 2 missed | +50 |
| 3+ missed | +75 AND force minimum tier Amber |
| Call/chat abandoned mid-flow | +20 |
| Response latency > 3× person's own median | +15 |

**S4 CAN ONLY INCREASE.** Silence can mean recovery, lost phone, coercion, or crisis. Scoring silence as improvement is the failure mode that gets people killed. Monotonicity is tested.

### 5.6 S5 — Acoustic (Weight 0.00)

Extracted for display only. Features (per-person normalised):
- `pitchVariabilityPct` — pitch variability % of person's range
- `speechRateDeviationPct` — speech-rate deviation % from median
- `pauseRatioPct` — silence share %

```
S5_score = mean(pitchVar%, speechRateDev%, pauseRatio%)  [0-100]
confidence = "low"
caveat = "Low confidence. Acoustic inference is unreliable across accent, dialect and line quality; shown for context only and contributes 0.00 to the composite."
```
**Weight 0.00 enforced by:** `computeComposite` throws if S5 weight ≠ 0; `policy/v1.yaml` fails zod validation if `s5_acoustic` ≠ 0.

---

## 6. RENORMALISATION — HANDLING MISSING SIGNALS

**Rule:** NEVER substitute 0 for a missing signal. A missing signal is not a calm signal.

### 6.1 Which Components Can Be Null

| Component | Nullable? | When |
|-----------|-----------|------|
| S1 | **Yes** | Abandoned before first structured answer |
| S2 | **Yes** | LLM provider unavailable / output failed validation |
| S3 | No | Deterministic from `cases` row; always computable |
| S4 | No | Deterministic from `persons` row; always computable |
| S5 | **Yes** | No audio on channel (every `chat` check-in) — weight 0.00 anyway |

### 6.2 Renormalisation Formula

```
denominator = sum(weights of present components)
effective_weight[k] = weight[k] / denominator   (for present components)
contribution[k] = effective_weight[k] × score[k]
composite = sum(contributions)
```

**Example:** S2 missing → denominator = 0.35 + 0.25 + 0.15 = 0.75
- S1 effective weight = 0.35/0.75 = 0.4667
- S3 effective weight = 0.25/0.75 = 0.3333
- S4 effective weight = 0.15/0.75 = 0.2000

**Renormalisation RAISES the composite** — remaining components carry proportionally more. This is deliberate: a person who stops answering does not look calmer.

---

## 7. PER-PERSON BASELINE — WHAT "DYNAMIC" MEANS

### 7.1 Why Per-Person Baselines
Population thresholds systematically:
- **Under-flag** reserved/stoic people (small absolute change = big signal)
- **Over-flag** expressive people (large absolute change = normal for them)

**Solution:** Each person accumulates their own exponentially-weighted baseline. Alert fires on **deviation from themselves**.

### 7.2 EWMA (Exponentially Weighted Moving Average)

**Parameters (from `policy/v1.yaml`):**
- `ewma_lambda` = 0.3
- `sigma_floor` = 8
- `change_point_z` = 2.0
- `min_history_for_change_point` = 2

**Initialisation (first check-in):**
```
μ₀ = x₀              ← first composite becomes baseline
σ²₀ = 0
z is undefined → use first-contact floor instead
```

**Subsequent check-ins (ORDER MATTERS — the easy bug):**

```
z_t = (x_t − μ_(t−1)) / max(σ_(t−1), 8)    ← COMPUTE FIRST

μ_t = 0.3 · x_t + 0.7 · μ_(t−1)             ← THEN update
σ²_t = 0.3 · (x_t − μ_(t−1))² + 0.7 · σ²_(t−1)
```

**Why order matters:** `z_t` measured against baseline *before* this check-in updates it. Update μ first → every deviation partly absorbed → large spikes read smaller → exact wrong direction.

**Sigma floor (8):** Stops flat-history person from tripping on trivial noise. In golden path, true σ = 1.64 → floor does all the work.

### 7.3 Change Point Detection
```
change_point = (z > 2.0) AND (history_count ≥ 2)
```
- PRD feature #4: "sudden-shift detection"
- Deviation test against person's own history, NOT threshold crossing
- At 3rd check-in: history_count = 2 (two prior check-ins)

### 7.4 First-Contact Floor
With no baseline (z undefined): raw composite ≥ 60 → at least Amber. Otherwise first-time caller in genuine distress reads as "no deviation" and gets nothing.

---

## 8. POLICY ENGINE — VERSIONED YAML TIER ASSIGNMENT

### 8.1 Policy File Structure (`policy/v1.yaml`)

```yaml
version: "1.1.0"
signed_by: "TM1"

weights:
  s1_self_report: 0.35
  s2_linguistic:  0.25
  s3_case_context: 0.25
  s4_engagement:  0.15
  s5_acoustic:    0.00    # DELIBERATE ZERO — pinned by zod literal(0)

baseline:
  ewma_lambda: 0.3
  sigma_floor: 8
  change_point_z: 2.0
  min_history_for_change_point: 2

tiers:  # evaluated top to bottom, first match wins
  - tier: RED
    any_of:
      - change_point: true
      - composite_gte: 70
      - s3_gte: 60        # load-bearing: case file alone can escalate
  - tier: AMBER
    any_of:
      - composite_gte: 45
      - z_gte: 1.2
      - first_contact_composite_gte: 60
      - missed_checkins_gte: 3
  - tier: GREEN
    default: true

floors:
  model_may_lower_tier: false
  critical_requires_deterministic_trigger: true

escalation:
  CRITICAL: { ack_required: true,  sla_minutes: 0,     immediate_resources: true }
  RED:      { ack_required: true,  sla_minutes: 30 }
  AMBER:    { ack_required: false, sla_minutes: 1440 }
  GREEN:    { ack_required: false, sla_minutes: 10080 }  # 7 days
```

### 8.2 Tier Assignment Algorithm

```
assignTier(composite, z, changePoint, s3, firstContact, missedCount, policy, deterministicTrigger):
  
  1. Evaluate policy rules top-to-bottom:
     For each rule:
       For each condition in rule.any_of:
         if condition matches → policyTier = rule.tier, matchedRule = condition.key
         break both loops
     If no rule matched → policyTier = GREEN (default rule)

  2. If deterministicTrigger exists (from Pass 1, keypad 0, or q3=4):
     finalTier = max_severity(deterministicTrigger.tier, policyTier)
     # NEVER lower — CLAUDE.md rule 4, floors.model_may_lower_tier: false
     
     If deterministic is CRITICAL:
       triggerSource = deterministic.source (lexicon/panic_key/self_report_q3)
     Else:
       triggerSource = "policy" (raised above deterministic floor)
  
  3. Else:
     finalTier = policyTier
     triggerSource = "policy"
```

### 8.3 Condition Evaluation Vocabulary

| Condition Key | Parameters | Matches When |
|---------------|------------|--------------|
| `change_point` | — | `changePoint === true` |
| `composite_gte` | threshold | `composite ≥ threshold` |
| `s3_gte` | threshold | `s3 !== null AND s3 ≥ threshold` |
| `z_gte` | threshold | `z !== null AND z ≥ threshold` |
| `first_contact_composite_gte` | threshold | `firstContact AND composite ≥ threshold` |
| `missed_checkins_gte` | threshold | `missedCount ≥ threshold` |

### 8.4 Hard Constraints (Enforced in Code)
1. **Policy cannot produce CRITICAL** — only deterministic triggers (lexicon, panic_key, self_report_q3) can. Policy file declaring CRITICAL rule fails to load.
2. **Model may raise tier; never sole cause of Critical; never lower tier.** Only human closes Critical.
3. **Non-response never lowers score.** Missed check-ins escalate via S4.
4. **S5 weight pinned to 0.00** — zod `literal(0)` in policy loader.

---

## 9. SAFETY INTERLOCK — THE TWO-PASS RULE

### 9.1 Architecture

```
USER INPUT ──► [PASS 1: checkInput()] ──► HIT? ──YES──► CRITICAL
                    │                          │
                    NO                         │ (LLM NEVER CALLED)
                    ▼                          ▼
              [ LLM: reply + S2 ]      Crisis resources INSTANT
                    │
                    ▼
           [PASS 2: checkOutput()] ──► REJECTED? ──YES──► Discard reply
                    │                          │
                    NO                         ▼
                    ▼                   fixed fallback_reply
              USER SEES TEXT
```

**Pass 2 is the one teams forget.** Catches model echoing crisis phrase, generating advice, false reassurance, or outcome promises. 50ms budget — runs before LLM contacted so crisis resources work even if model down.

### 9.2 Pass 1 — Input Check (`checkInput`)

- Runs on user transcript (normalised: lowercase, strip punctuation, collapse whitespace)
- Matches against `LEXICON` (versioned regex patterns)
- **No negation handling** — "I don't want to kill myself" STILL fires. Over-firing is correct failure direction (cost of FP = counsellor reads extra transcript; cost of FN = person in danger asked about sleep).
- Returns: `{ hit: true, category, matched }` or `{ hit: false }`

### 9.3 Lexicon (`lib/safety/lexicon.ts`)

**4 Categories, 3 written forms each (English, Devanagari Hindi, Romanised Hindi):**

| Category | English Examples | Hindi (Devanagari) | Hindi (Romanised) |
|----------|------------------|-------------------|-------------------|
| Self-harm intent | "kill myself", "don't want to live", "better off dead" | "जीना नहीं चाहता", "अपनी जान", "मर जाऊं" | "jeena nahi chahta", "marna chahta hoon", "jaan de dunga" |
| Hopelessness + finality | "no way out", "nothing left", "give up completely" | "कोई रास्ता नहीं", "कुछ नहीं बचा" | "koi rasta nahi", "kuch nahi bacha" |
| Immediate danger | "they are here", "coming for me now", "going to kill me" | "वो आ गए", "मार डालेंगे" | "wo aa gaye", "maar dalenge" |
| Direct request | "help me", "need help now", "save me" | "मदद करो", "बचाओ" | "madad karo", "bachao" |

**Requirements:**
- Patterns written against normalised text (lowercase, no apostrophes, `\s*` between words)
- **No `g` flag on regex** — module-level shared objects, `g` makes `.test()` stateful
- Human review required: `REVIEWED_BY` + `REVIEWED_ON` at top of file
- Romanised Hindi is "the form teams forget" — covered explicitly

### 9.4 Pass 2 — Output Check (`checkOutput`)

Runs on LLM's reply BEFORE person sees it. Checks in order:

| Pattern Class | Examples Caught |
|---------------|-----------------|
| Advice | "you should", "try to", "I recommend", "what helps is", "have you considered" |
| Diagnosis | "depression", "anxiety disorder", "PTSD", "trauma response", "symptoms of" |
| False reassurance | "everything will be fine", "don't worry", "it will get better", "this will pass" |
| Outcome promises | "the police will", "your case will", "you will receive" |
| Crisis terms | Any lexicon term appearing in model's own output |
| Length | >320 chars or >1 question mark |

Rejected → discard reply entirely, send `fallback_reply` from reply bank, log rejection (metric).

### 9.5 Critical Triggers (All Deterministic)

| Trigger | Source | Action |
|---------|--------|--------|
| Lexicon match on user input | `lib/safety/lexicon.ts` | CRITICAL, resources instant, LLM never called |
| Keypad `0` pressed on `/call` | UI event | CRITICAL, bypasses everything |
| "Talk to a person" button on `/checkin` | UI event | CRITICAL |
| S1 q3 answered "not safe" (4) | Structured input | CRITICAL, floor for policy |

**Model may raise Green→Amber→Red. Never produce Critical. Never lower tier.**

### 9.6 Reply Bank (`lib/safety/replies.ts`)

**All safety-critical text is fixed, human-written. LLM never generates any of it.**

| Key | Used When |
|-----|-----------|
| `consent_notice` | Start of every session — voluntary, does not affect claim/relief/compensation |
| `crisis_immediate` | Critical fired — acknowledges, names contact happening, lists resources |
| `crisis_resources` | Helpline numbers (NHAA 14566, Tele-MANAS 14416, 1800-89-14416) |
| `fallback_reply` | Pass 2 rejected LLM output |
| `llm_unavailable` | Provider down — check-in still logs, scores on S1/S3/S4 |
| `closing_low` / `closing_med` | End of Green / Amber session |
| `minor_detected` | Minor indicator → human route, no scoring |
| `wrong_person` | Someone else on line — reveals nothing |

---

## 10. LLM INTEGRATION

### 10.1 Single Entry Point
All LLM calls via `lib/llm/index.ts` only. Never import provider SDK directly.

### 10.2 System Prompt (Fixed, Versioned)

```
You conduct a brief wellbeing check-in with a person who has experienced a
crime or atrocity and is going through the justice process. You are a
listening intake step, not a counsellor.

YOUR ONLY JOB, in this order:
1. Acknowledge what they said in at most ONE short sentence.
2. Ask exactly ONE question from the provided question list.

YOU MUST NOT:
- give advice, suggestions, coping strategies, or things to try
- name or imply any mental health condition
- promise or predict any outcome about their case, safety, or feelings
- say things will improve, or that you understand how they feel
- ask more than one question
- write more than 2 sentences total

Mirror the user's language: reply in Hindi if they wrote Hindi (including
romanised Hindi), otherwise English.

Return ONLY this JSON:
{
  "reply": "<= 2 sentences",
  "s2_score": <0-100 linguistic distress>,
  "markers": ["hopelessness"|"isolation"|"fear"|"anger"|"exhaustion"|"numbness"],
  "evidence": ["short phrase quoted from their message"],
  "language": "hi" | "en",
  "next_question_id": "<id from the list>"
}
```

### 10.3 Provider Swapping
Change one env var (`LLM_PROVIDER`) → same pipeline, same eval set, comparison table.
Supported: `groq`, `gemini`, `openrouter`, `ollama`, `none` (deterministic, no model).

### 10.4 Degradation Behaviour
- Provider unavailable / rate-limited / invalid output → `S2 = null`, renormalise over S1/S3/S4
- Check-in still logs, still scores, interlock still works
- **Never 500** — person mid check-in must not lose session because free tier ran out

---

## 11. GOLDEN PATH — THE 90-SECOND DEMO

### 11.1 Persona A-4471
- **Language:** Hindi
- **Case:** Land dispossession, trial stage
- **Standing case pressure (static):** Accused on bail +20, relief 62 days overdue +15, 4 adjournments +10, case open 400 days +5 = **50 points** (deliberately under `s3_gte:60` RED threshold)

### 11.2 Timeline

| Day | S3 | Composite | z-score | Tier | Key Event |
|-----|-----|-----------|---------|------|-----------|
| D-3 | 50 | 28.00 | — | GREEN | Baseline init: μ₀=28.00 |
| D-2 | 50 | 31.00 | 0.375 | GREEN | μ₁=28.90, σ²=2.70 (σ=1.64→floored to 8) |
| D-1 | — | — | — | — | Intimidation report filed; hearing (D+6) enters 7-day window |
| D-0 | **90** | **53.75** | **3.11** | **RED** | **LIVE ON STAGE** |

### 11.3 Day 0 Breakdown (The Explainability)

| Component | Raw | Weighted Contribution |
|-----------|-----|----------------------|
| **S3 Case Context** | 90 | **22.50** ← LARGEST |
| S1 Self-report | 50 | 17.50 |
| S2 Linguistic | 55 | 13.75 |
| S4 Engagement | 0 | 0.00 |
| S5 Acoustic | displayed | 0.00 — never scored |

### 11.4 The Three Demo Sentences (All True of These Numbers)
1. **"Her self-report moved from mild to moderate and her language got somewhat more distressed — but the thing that moved most was the case file."** S3 went 50 → 50 → 90, largest single contribution.
2. **"A composite of 53.75 is not alarming in absolute terms. It fires because it is 3.11 standard deviations above her own baseline."** That is what "dynamic" means — fixed threshold would have missed her.
3. **"The hearing is six days away and the intimidation report was filed yesterday. She is flagged BEFORE the hearing, not after it."** Prediction from court calendar, no model involved in the part that mattered most.

---

## 12. EVALUATION & TESTING

### 12.1 Test Commands

| Command | Purpose |
|---------|---------|
| `npm run test` | All `*.test.ts` |
| `npm run test -- scoring` | Filter tests (scoring, interlock, safety) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | `typecheck && test && eval safety` — full CI gate |

### 12.2 Eval Sets

| Set | Size | Purpose | When |
|-----|------|---------|------|
| `safety` | 40 | **100% required** — 40 seeded critical utterances (EN, Devanagari, romanised) | Every commit / CI |
| `dev` | 80 | Confusion matrix, CRITICAL recall, per-language recall, Pass-2 rejections, latency | Daily tuning |
| `holdout` | 40 | **Run ONCE on Day 4** — do not tune after seeing it | Day 4 only |

### 12.3 Eval Harness (`evals/run.ts`)
- Runs the **REAL pipeline** (interlock → LLM → scoring → policy), never reimplements arithmetic
- Prints: confusion matrix, CRITICAL recall (overall + per-language separate rows), over-fire rate, Pass-2 rejection breakdown, latency
- **Never prints accuracy** — base rate ~0.5%, "always fine" scores 99.5%
- Holdout guard: fails if run twice without `--force` (second file visible in repo)

### 12.4 Safety Acceptance Tests (All Must Pass Before Day 5)

| # | Test | Pass Criterion |
|---|------|----------------|
| S1 | 40 seeded critical utterances (EN, Devanagari, romanised) | **100% detected** — any miss blocks build |
| S2 | 20 near-miss non-critical utterances | Recorded over-fire rate (not required zero) |
| S3 | Keypad `0` mid-call | Crisis resources render BEFORE call screen advances |
| S4 | LLM output containing "you should try" | Rejected by Pass 2, fallback shown |
| S5 | LLM provider unreachable | Check-in still logs, scores S1/S3/S4, interlock works |
| S6 | Check-in with no consent row | 403, no assessment written |
| S7 | Model returns "Green" on Critical input | Ignored — Critical stands |
| S8 | Two check-ins from one persona | One trend, not two orphan rows |
| S9 | Three missed check-ins | Score rises, never falls |
| S10 | Minor indicator present | Human route, zero assessment rows written |

---

## 13. DEMO ORDER (7 MINUTES)

| Step | Duration | Content |
|------|----------|---------|
| 1 | 90s | Dashboard trend + breakdown (golden path) |
| 2 | 60s | Point at S3: "strongest signal isn't voice, it's court calendar" — S3 22.50 > S1 17.50 > S2 13.75. Hearing in 6 days, intimidation filed yesterday. Flagged BEFORE hearing. |
| 3 | 90s | Live `/call` → speak → score lands on dashboard |
| 4 | 60s | Type crisis phrase → resources instantly, before model. Show code. |
| 5 | 45s | Model swap: one env var, comparison table |
| 6 | 45s | Limitations slide |

---

## 14. HARD RULES (Merge Blockers from CLAUDE.md)

1. **Crisis detection is deterministic code** (`lib/safety/lexicon.ts`). Never an LLM call.
2. **Interlock runs twice** — on input before LLM, on output before human. Never remove the second.
3. **LLM never writes safety-critical text** — crisis messages from `lib/safety/replies.ts`.
4. **LLM may raise tier; never sole cause of Critical; never lower tier.** Only human closes Critical.
5. **Non-response never lowers score.** Missed check-ins escalate.
6. **No PII anywhere.** Pseudonyms only (`A-4471`). No real Indian names.
7. **Never report "accuracy."** Base rate ~0.5%. Report recall on seeded Critical + per-language.
8. **Never render composite without component breakdown.** Breakdown IS explainability.
9. **S5 acoustic weighted 0.0** — display greyed with caveat; never score it.
10. **Minor indicators route to human workflow.** No automated scoring.

---

## 15. DAILY RITUAL (10 Minutes, Start of Day)

1. `npm run eval -- --set safety` = **100%**
2. Worked-example test passes (composite 53.75 ±0.5, z 3.11 ±0.05, RED)
3. `types/contract.ts` unchanged (or group notified)
4. No secrets reachable from client
5. No real names in `evals/` or `scripts/`

---

## 16. KEY FILES TO READ BEFORE FIRST COMMIT

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Ten hard rules (merge blockers) |
| `docs/00_MVP_PLAN.md` | Architecture, schedule, golden path, demo order |
| `docs/SAFETY_SPEC.md` | Interlock, lexicon, replies, banned outputs |
| `docs/SCORING_AND_POLICY.md` | S1–S5, EWMA, z-score, change-point, policy YAML |
| `types/contract.ts` | Frozen schema for all API I/O |
| `supabase/schema.sql` | Database contract (RLS on, no policies) |
| `policy/v1.yaml` | Versioned tier rules (tuning surface) |

---

## 17. COMMON PITFALLS (What Agents Get Wrong)

| Pitfall | Why It Breaks | Check |
|---------|---------------|-------|
| Crisis detection in system prompt | Natural LLM-shaped solution | Grep `lib/safety/` for provider imports — should be none |
| S5 non-zero weight | Reads as unfinished TODO | Comment citing SCORING §2 is the defence |
| Default missing S2 to 0 | Cleaner than renormalising | Test: null S2 with high S1/S3 must still reach RED |
| Negation handling in lexicon | Reduces false positives | Test: "I don't want to kill myself" fires |
| Editing `evals/safety.jsonl` to pass | Optimising for green run | That file is TM1's; review every diff |
| Calling Supabase from client | RLS returns nothing; suggests permissive policy | Refuse — service role key server-only |
| Composite without breakdown | Violates explainability invariant | Never render naked number |
| Keypad `0` awaiting API | Must render crisis panel locally first | Test with network offline |
| Hardcoded baseline in seed | Demo not reproducible | Must come from `lib/scoring/baseline.ts` |

---

## 18. OPERATIONAL CONSTRAINTS SUMMARY

- **Interlock runs twice:** Pass 1 on user input (before LLM), Pass 2 on LLM output (before human). Never remove Pass 2.
- **Crisis path is synchronous:** Keypad `0`, lexicon hit, q3=4 all return resources in same response — no async.
- **LLM never writes safety text:** All crisis messages, resources, consent language from `lib/safety/replies.ts`.
- **LLM may raise tier; never sole cause of Critical; never lower tier.** Only human closes Critical.
- **Non-response never lowers score.** Missed check-ins escalate via S4.
- **S5 acoustic weight is 0.0** — compute, display greyed with caveat, never score.
- **Minor indicators route to human workflow** — no assessment written, no tier assigned.
- **Renormalisation on missing S1/S2:** Weights scale up over remaining components. Missing signal ≠ calm signal.
- **z-score computed BEFORE baseline update** — order matters (§7).
- **S3 time-windowed rows change on calendar alone** — frozen at check-in time.
- **RLS on, no policies** — anon key returns nothing. Service role key server-only.
- **No PII anywhere** — pseudonyms only (`A-4471`).
- **Never report "accuracy"** — base rate ~0.5%. Report recall on seeded Critical + per-language.
- **PROJECT_TZ=Asia/Kolkata required** — policy engine fails without it. Set as Vercel Project Env Var.
- **model_version format:** `<provider>:<modelId>+prompt-<PROMPT_VERSION>` (e.g., `groq:openai/gpt-oss-120b+prompt-1.0.0`)

---

## 19. SLASH COMMANDS (`.claude/commands/`)

| Command | Action |
|---------|--------|
| `/safety` | Run safety eval, explain every miss |
| `/goldenpath` | Seed + assert demo numbers |
| `/arch` | Audit against ten hard rules |
| `/lane` | Flag changed files outside your CODEOWNERS paths |

---

*This document is the logical/mathematical specification. Code is the implementation. When in doubt, the math wins — a judge should be able to recompute a score by hand from this document.*