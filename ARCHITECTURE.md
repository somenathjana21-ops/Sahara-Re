# Project SAHARA — Technical Architecture (SIH 26094)

## 1. Architectural Philosophy & Governing Principles

### The Governing Principle
> **"The AI does not decide. It decides who a human looks at next, and why."**

Project SAHARA is not an autonomous diagnostic agent or a clinical decision maker. It is an explainable monitoring and triage layer that ranks a human counsellor's attention and provides inspectable justifications for why a specific victim warrants review.

### The Core Insight: $S_3$ Case Context Dominance
Psychological distress among atrocity victims is heavily driven by system-side milestones:
- Imminent court hearings
- Release of the accused on bail
- Intimidation and retaliation reports
- Protracted trial delays and repeated adjournments
- Delayed disbursement of statutory relief compensation

These variables are deterministically knowable from case dockets and court calendars. They require zero speech recognition or natural language processing, are completely immune to dialect bias, and are inherently explainable.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PUBLIC INTERFACES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│   Web Chat UI (/checkin)                 Simulated Voice IVRS (/call)       │
│   - Multilingual (EN / HI)                - Web Speech API (STT / TTS)      │
│   - Quick Exit [ESC]                     - Keypad Emergency '0' Key        │
│   - Voluntary Consent Notice             - Offline Emergency Fallback       │
└───────────────────────┬───────────────────────────────┬─────────────────────┘
                        │                               │
                        ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POST /api/checkin  (UNIFIED INGESTION)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. CONTRACT VALIDATION    → Zod schema validation (types/contract.ts)      │
│  2. CONSENT GATE           → 403 Forbidden if no active consent row         │
│  3. MINOR CHECK            → Divert to caseworker workflow (0 score rows)   │
│  4. PASS 1 INTERLOCK       → Deterministic Regex Lexicon (Skip LLM on hit)  │
│  5. BOXED LLM CALL         → OpenAI-compatible adapter (1 sent + 1 q)       │
│  6. PASS 2 INTERLOCK       → Banned pattern check (advice/diagnosis filter) │
│  7. SCORING ENGINE         → S1..S5 + Missing Signal Renormalisation        │
│  8. EWMA & CHANGE-POINT    → Per-person baseline update & z-score test      │
│  9. POLICY ENGINE          → Versioned YAML evaluation (RED/AMBER/GREEN)    │
│ 10. PERSISTENCE & ALERTS   → Write checkin, assessment; alert if Tier >= RED│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COUNSELLOR DASHBOARD  (/staff)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  - Triage Queue: Sorted by severity, change-point flag, and SLA timer        │
│  - Explainability by Construction: Additive component breakdown chart       │
│  - Dynamic Baseline Trend Chart: Visual trajectory against personal baseline │
│  - Alert Acknowledgment Workflow: Requires staff handle & records disposition│
│  - Audit Logging: Every staff view of person-level data writes audit_events │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 10-Step Pipeline & Safety Interlock

```
[Incoming Request]
        │
        ▼
[1. Validate Contract] ───────► Invalid payload? → 400 Bad Request
        │
        ▼
[2. Consent Gate] ────────────► No live consent? → 403 Forbidden, 0 rows written
        │
        ▼
[3. Minor Check] ─────────────► is_minor_flag === true? → Return caseworker referral, 0 scoring rows
        │
        ▼
[4. Pass 1 Interlock] ────────► Lexicon regex hit? → Escalate to CRITICAL immediately;
        │                       LLM call bypassed; return crisis hotlines synchronously
        ▼
[5. Boxed LLM Invocation] ────► Swappable OpenAI-compatible adapter generates 1 acknowledgment + 1 question
        │                       (Failure / timeout? → Degrades gracefully, S2 = null)
        ▼
[6. Pass 2 Interlock] ────────► Output contains advice, diagnosis, false reassurance, or promises?
        │                       → Reject output, substitute static reply from Reply Bank
        ▼
[7. Scoring Engine] ──────────► Calculate S1 (self-report), S2 (linguistic), S3 (case context),
        │                       S4 (engagement monotonicity), S5 (acoustic, weight 0.00).
        │                       Apply missing-signal renormalisation if S1 or S2 is null.
        ▼
[8. EWMA Baseline & z-Score] ─► Calculate z_t prior to updating running baseline; flag change point
        │
        ▼
[9. Policy Engine] ───────────► Evaluate versioned YAML rules; assign GREEN / AMBER / RED / CRITICAL
        │
        ▼
[10. Persistence & Alerts] ───► Write checkins, assessments; write alerts if Tier >= RED; return response
```

---

## 4. Mathematical Engine Specifications

### 4.1 Composite Distress Formula
$$Composite = 0.35 \cdot S_1 + 0.25 \cdot S_2 + 0.25 \cdot S_3 + 0.15 \cdot S_4 + 0.00 \cdot S_5$$

| Component | Weight | Source | Bounds | Rule / Behavior |
|---|---|---|---|---|
| **$S_1$ Self-Report** | 0.35 | 3 structured questions ($q_1, q_2, q_3$, scale 0–4) | 0–100 or `null` | $S_1 = \frac{q_1 + q_2 + q_3}{\text{answered\_count} \times 4} \times 100$. If $q_3 = 4$ ("Do you feel safe right now? No"), trigger deterministic `CRITICAL`. |
| **$S_2$ Linguistic** | 0.25 | LLM extracted from user input | 0–100 or `null` | Returns `null` if model fails, times out, or output violates schema. Never default to 0. |
| **$S_3$ Case Context** | 0.25 | Deterministic sum of case docket and calendar | 0–100 | Time-windowed & static conditions (see §4.2). |
| **$S_4$ Engagement** | 0.15 | System interaction behavior | 0–100 | Monotonically non-decreasing: +25 per missed check-in, +20 for mid-flow dropout. Silence never lowers score. |
| **$S_5$ Acoustic** | 0.00 | Paralinguistic audio metrics | 0–100 or `null` | Displayed with low-confidence disclaimer; contribution locked to 0.00. |

### 4.2 $S_3$ Case Context Rubric
$$S_3 = \min\left(100, \sum \text{applicable condition points}\right)$$

1. **Intimidation report filed within last 14 days:** **+25** *(time-windowed)*
2. **Accused released on bail:** **+20** *(static)*
3. **Next court hearing within 7 days:** **+15** *(time-windowed)*
4. **Relief compensation overdue > 30 days:** **+15** *(static)*
5. **Adjournment count $\ge 3$:** **+10** *(static)*
6. **Social boycott flag active:** **+10** *(static)*
7. **Case open > 365 days:** **+5** *(static)*

### 4.3 Missing Signal Renormalisation
When optional components ($S_1$ or $S_2$) are `null`, remaining weights are scaled so they sum to 1.0:
$$W_{\text{effective}, k} = \frac{W_k}{\sum_{j \in \text{present}} W_j}$$
$$Composite = \sum_{k \in \text{present}} \left(W_{\text{effective}, k} \cdot S_k\right)$$

*Rationale:* A missing signal is not a calm signal. Renormalisation prevents a distressed user who drops off from appearing artificially calm.

### 4.4 Dynamic EWMA & Change-Point Algorithm
To prevent absorbing the current check-in before evaluating anomaly deviation, $z_t$ is computed **strictly before** updating running baseline parameters ($\lambda = 0.3, \text{noise floor} = 8$):

1. **Compute $z$-Score:**
   $$z_t = \frac{x_t - \mu_{t-1}}{\max(\sigma_{t-1}, 8)}$$
2. **Update Baseline Mean and Variance:**
   $$\mu_t = 0.3 \cdot x_t + 0.7 \cdot \mu_{t-1}$$
   $$\sigma_t^2 = 0.3 \cdot (x_t - \mu_{t-1})^2 + 0.7 \cdot \sigma_{t-1}^2$$
3. **Change Point Trigger:**
   $$\text{Change Point} = (z_t > 2.0) \land (\text{history\_count} \ge 2)$$

---

## 5. Security, Privacy & Database Isolation

### 5.1 Zero PII Guarantee
- All monitored individuals are referenced exclusively by synthetic pseudonyms (`A-XXXX`).
- Real names, phone numbers, home addresses, and official court FIR/case numbers are never recorded in database tables, log files, or test fixtures.

### 5.2 Supabase Row Level Security (RLS)
- RLS is enabled on all tables: `persons`, `cases`, `consents`, `checkins`, `assessments`, `alerts`, `audit_events`.
- **Zero public access policies** are configured. The public / anonymous client key has zero read or write access.
- All database queries and mutations occur strictly server-side using the `SUPABASE_SERVICE_ROLE_KEY`.

### 5.3 Audit Trail
- Every staff-side read of person-level data automatically records an immutable row in `audit_events` containing the staff handle, action (`view_queue`, `view_person`, `ack_alert`), target ID, and timestamp.

---

## 6. Technology Stack & Swappable Components

| Layer | Technology | Specification / Role |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | React Server Components by default; API route handlers |
| **Language** | TypeScript 5 | Strict mode, zero untyped `any` |
| **Styling** | Tailwind CSS | Therapeutic token palette defined in `designs/DESIGN.md` |
| **Database** | Supabase (PostgreSQL) | Fully locked down with RLS; server-only access |
| **LLM Provider** | OpenAI-Compatible Adapter | Centralized in `lib/llm/index.ts`; switchable via `.env` (Groq, Nemotron, OpenRouter, Ollama) |
| **Speech Engine** | Native Web Speech API | Client-side `SpeechRecognition` & `SpeechSynthesis` for simulated IVRS |
| **Validation** | Zod | Runtime validation on all API contracts and policy schemas |
