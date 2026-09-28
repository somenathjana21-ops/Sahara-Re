---
name: brand-identity
description: Provides the single source of truth for Project SAHARA brand identity, system purpose, critical files, core goals, design tokens, technology choices, and voice/tone. Use this skill whenever generating UI components, designing triage workflows, styling applications, writing trauma-informed copy, or creating user-facing assets for Project SAHARA to ensure brand consistency, safety interlocks, and ethical alignment.
---

# Project SAHARA — Brand Identity & System Guidelines

**Official Brand Name:** Project SAHARA  
**Tagline:** AI-Powered Dynamic Mental Health Monitoring & Distress Prediction System for Victims of Atrocities  
**Institutional Authority:** Ministry of Social Justice and Empowerment — Smart India Hackathon (SIH 26094)  
**Governing Principle:** *"The AI does not decide. It decides who a human looks at next, and why."*

This skill defines the definitive purpose, native shape, critical files, goals, visual identity tokens, and copywriting rules for Project SAHARA. All generated code, UI layouts, and copy must strictly reflect the codebase as the sole source of truth — nothing invented, nothing placeholder.

---

## 1. Codebase Purpose & Governing Philosophy

### The Core Problem
Under the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act 1989 and Bharatiya Nyaya Sanhita (BNS), victims experience severe, prolonged psychological distress **after** registering a complaint. Traumatic triggers persist for months or years:
* Bail release of the accused
* Direct intimidation and community hostility
* Repeated court adjournments and procedural delays
* Overdue statutory relief compensation (SC/ST Act Rule 12(4))
* Social boycott and economic displacement

Existing state mechanisms offer legal and financial aid, but **nobody monitors ongoing psychological wellbeing**. A helpline logs that a call ended; a court records an adjournment. Nothing connects case events to whether a victim is surviving the ordeal.

### The Missing Monitoring Layer
SAHARA is **not an autonomous clinical agent** and **not a therapist bot**. It is an **explainable monitoring and triage layer** that continuously tracks distress across voluntary check-ins and court docket milestones, ranking human counsellors' review queues with complete mathematical explainability.

---

## 2. What the README Leads With: $S_3$ Case Context Dominance

> **"Establish what matters before what measures."**

Most mental health systems attempt to infer emotion from voice pitch or free-form text. In rural, low-income, marginalized populations, this approach fails:
1. **Acoustic & NLP Bias:** Inference degrades severely across regional dialects, accents, gender, and inexpensive smartphone microphones.
2. **Ignores Root Stressors:** The primary causes of acute atrocity distress are **already documented in court dockets and calendars**.

SAHARA calculates the **$S_3$ Case Context Signal** directly from docket data and today's date — requiring zero NLP, zero acoustic inference, and zero ML training data. It is dialect-proof, deterministic, and instantly explainable.

### $S_3$ Deterministic Scoring Rubric
$$S_3 = \min\left(100, \sum \text{applicable condition points}\right)$$

* **$+25$ pts:** Intimidation report filed within the last 14 days *(Time-windowed)*
* **$+20$ pts:** Accused released on bail *(Standing)*
* **$+15$ pts:** Next court hearing within 7 days *(Time-windowed)*
* **$+15$ pts:** Statutory relief compensation overdue $>30$ days *(Standing)*
* **$+10$ pts:** Adjournment count $\ge 3$ *(Standing)*
* **$+10$ pts:** Active social boycott in village *(Standing)*
* **$+5$ pts:** Case pending for $>365$ days *(Standing)*

**UI & Design Rule:** In every presentation, dashboard, or case card, highlight the $S_3$ case docket stressors prominently before displaying linguistic or self-report metrics.

---

## 3. Product Native Shape: The 10-Step Pipeline & Triage Queue

Instead of organizing pages with generic section templates, align all interfaces with the product's native data flow: **Intake $\to$ Deterministic Interlock $\to$ Boxed Model $\to$ Additive Scoring $\to$ Dynamic EWMA Baseline $\to$ Counsellor Triage Queue**.

```
POST /api/checkin (10-Step Pipeline)
  1. Zod Contract Validation       (types/contract.ts)
  2. Consent Gate                  (403 if revoked, 0 DB writes)
  3. Minor Check                   (is_minor_flag → divert to caseworker / Childline 1098, 0 scoring rows)
  4. Pass 1 Interlock              (deterministic regex on 40 phrases; bypass LLM, immediate CRITICAL)
  5. Boxed LLM Call                (1 sentence ack + 1 question, returns S2 distress score in [0, 100])
  6. Pass 2 Interlock              (anti-advice, anti-diagnosis, anti-promise sanitizer; fallback if failed)
  7. Scoring Engine                (S1..S5 additive formula + missing-signal renormalisation, S5 = 0.00)
  8. EWMA Baseline & z-Score       (z computed strictly BEFORE updating running baseline; change point if z > 2.0)
  9. Policy Engine                 (policy/v1.yaml assigns GREEN, AMBER, RED, CRITICAL tiers)
  10. Persistence & Alerts         (write checkins, assessments; alert if Tier >= RED; return response)
```

### Additive Scoring Formula (Explainability by Construction)
$$\text{Composite} = 0.35 \cdot S_1 + 0.25 \cdot S_2 + 0.25 \cdot S_3 + 0.15 \cdot S_4 + 0.00 \cdot S_5$$

* **$S_1$ Self-Report (Weight 0.35):** 3 structured questions (0–4 scale). If Question 3 (*"Do you feel safe right now?"*) is answered **No (4)**, immediate deterministic **CRITICAL**.
* **$S_2$ Linguistic Distress (Weight 0.25):** Distress score (0–100) extracted from transcript via boxed LLM adapter. Safely yields `null` on failure (never defaults to 0).
* **$S_3$ Case Context (Weight 0.25):** Deterministic court docket & calendar points (0–100).
* **$S_4$ Engagement Monotonicity (Weight 0.15):** Missed check-ins (+25), mid-flow abandonment (+20). Silence never reduces distress.
* **$S_5$ Acoustic Metric (Weight 0.00):** Pinned to literal 0.00 to eliminate dialect bias. Displayed only with low-confidence disclaimer.

### Missing-Signal Renormalisation (Missing ≠ Calm)
When $S_1$ or $S_2$ is null or omitted:
$$W_{\text{effective}, k} = \frac{W_k}{\sum_{j \in \text{present}} W_j}, \quad \text{Composite} = \sum_{k \in \text{present}} (W_{\text{effective}, k} \cdot S_k)$$

### Dynamic Per-Person Baselines (EWMA)
* Running baseline: $\mu_t = 0.3 \cdot x_t + 0.7 \cdot \mu_{t-1}$, $\sigma_t^2 = 0.3 \cdot (x_t - \mu_{t-1})^2 + 0.7 \cdot \sigma_{t-1}^2$
* Noise floor: $\sigma_{\min} = 8$
* z-Score: $z_t = \frac{x_t - \mu_{t-1}}{\max(\sigma_{t-1}, 8)}$
* Change Point Flag: $(z_t > 2.0) \land (\text{History} \ge 2)$

---

## 4. Critical Files Inventory

| File Path | Functional Role & Content |
|---|---|
| [`README.md`](README.md) | Primary source of truth: Executive summary, $S_3$ breakthrough, 10-step architecture, EWMA math, 90s Golden Path demo. |
| [`designs/DESIGN.md`](designs/DESIGN.md) | Therapeutic design system specification: Soft Minimalism, Humanist Functionalism, WCAG 2.1 AAA color tokens, typography scales. |
| [`tailwind.config.ts`](tailwind.config.ts) | Tailwind CSS 3.4 configuration: primary `#206140`, secondary `#475569`, surface `#f8fafc`, tertiary `#8e3d22`, distress tier colors, Plus Jakarta Sans. |
| [`policy/v1.yaml`](policy/v1.yaml) | Versioned policy configuration (v1.1.0): weights, EWMA baseline params, escalation SLAs, tier rules (`GREEN`, `AMBER`, `RED`, `CRITICAL`). |
| [`types/contract.ts`](types/contract.ts) | Canonical Zod wire schemas and DB interfaces (`CheckInRequest`, `CheckInResponse`, `PersonRecord`, `CaseRecord`, `AssessmentRecord`, `AlertRecord`, `AuditEventRecord`). |
| [`app/api/checkin/route.ts`](app/api/checkin/route.ts) | Core 10-step ingestion endpoint orchestrating consent, safety interlocks, LLM, scoring, baseline, policy, and alerts. |
| [`lib/safety/lexicon.ts`](lib/safety/lexicon.ts) | Deterministic crisis lexicon: 40 phrases across English, Hindi (Devanagari), and Romanised Hindi without regex 'g' flag. |
| [`lib/safety/interlock.ts`](lib/safety/interlock.ts) | Pass 1 crisis interlock and Pass 2 LLM output sanitizer (anti-advice, anti-diagnosis, character limits). |
| [`lib/safety/replies.ts`](lib/safety/replies.ts) | Immutably frozen static reply bank and verified statutory helpline contacts (NHAA 14566, Tele-MANAS 14416, Kiran 1800-599-0019, 112, Childline 1098). |
| [`lib/scoring/`](lib/scoring/) | Deterministic scoring modules (`s1.ts`, `s2.ts`, `s3.ts`, `s4.ts`, `s5.ts`, `composite.ts`, `baseline.ts`). |
| [`app/page.tsx`](app/page.tsx) | Multilingual public portal: support pathways, 4-7-8 breathing tool, crisis helpline modal, Quick Exit [ESC]. |
| [`app/checkin/page.tsx`](app/checkin/page.tsx) | Low-bandwidth text check-in UI: 3 structured self-report questions ($S_1$) and open distress reflection ($S_2$). |
| [`app/call/page.tsx`](app/call/page.tsx) | Simulated IVRS voice dialer: Web Speech API (STT & TTS), keypad emergency '0' handoff. |
| [`app/staff/page.tsx`](app/staff/page.tsx) | Counsellor triage dashboard: queue ranked by Tier, SLA countdowns, and change-point flags. |
| [`app/staff/[personId]/page.tsx`](app/staff/[personId]/page.tsx) | Case explainability view: additive $S_1..S_5$ breakdown, EWMA baseline trajectory, docket history, alert ack. |
| [`components/common/QuickExit.tsx`](components/common/QuickExit.tsx) | Instant safety escape: `ESC` key or click immediately redirects to `https://www.weather.com`. |

---

## 5. Core Invariants & Goals

1. **Zero PII Guaranteed:** Pseudonyms only (`A-XXXX` / `U-XXXX`). No real names, telephone numbers, Aadhaar numbers, or court case numbers in code, DB, or mock data.
2. **$S_5$ Pinned to 0.00:** Enforced by Zod `literal(0)`. Acoustic paralinguistics are displayed with a low-confidence caveat only; never factored into composite distress.
3. **Missing ≠ Calm:** Missing inputs trigger renormalisation across present signals. Never default omitted signals to zero.
4. **Deterministic Crisis Detection (Pass 1):** Crisis detection is deterministic code, not LLM prompt engineering. Negation still triggers CRITICAL (fails safe).
5. **Pass 2 Sanitizer:** Rejects prescriptive advice, diagnoses, false cheer (*"everything will be fine"*), and legal promises. Replaces non-compliant text with static reply bank copy.
6. **Tier Movement is One-Way Up:** Model/policy may raise tier, never lower it; only human counsellors can resolve or downgrade an alert.
7. **Order of Operations:** z-score computed strictly *before* updating baseline.
8. **Monotonic Engagement ($S_4$):** Missed check-ins (+25) and abandonment (+20) preserve prior floors.
9. **Consent Gate:** Missing or revoked consent triggers `403 Forbidden` with zero DB writes.
10. **Staff Passcode & Audit Trail:** Staff login requires `STAFF_PASSCODE`. Every read of person data writes an immutable record to `audit_events`.

---

## 6. Golden Path Reference Test Values (Persona A-4471)

Use these exact values when demonstrating or validating system workflows:
* **Persona:** `A-4471` (Trial stage, Hindi language, baseline $\mu = 28.90, \sigma^2 = 2.70$)
* **Base Docket Stressors:** Accused on bail (+20), relief overdue 62d (+15), 4 adjournments (+10), case open 400d (+5) $\to S_3 = 50$ standing points.
* **Day 0 Stressor Spike:** Intimidation report filed yesterday (+25), hearing scheduled in 6 days (+15) $\to S_3 = 90$ points.
* **Check-in Input:** Self-report $S_1 = 50$, linguistic distress $S_2 = 55$, engagement $S_4 = 0$.
* **Composite Score:** $(0.35 \times 50) + (0.25 \times 55) + (0.25 \times 90) + (0.15 \times 0) = \mathbf{53.75}$.
* **z-Score Calculation:** $z = \frac{53.75 - 28.90}{\max(1.64, 8)} = \frac{24.85}{8} = \mathbf{3.11} \implies \mathbf{Change\ Point\ Triggered!}$
* **Resulting Tier:** **RED Tier** (SLA 30 minutes, mandatory counsellor acknowledgment) **6 days before the hearing occurs**.

---

## 7. Reference Documentation

Consult the specialized resources below for exact tokens, stack requirements, and copywriting rules:
* 👉 **[`resources/design-tokens.json`](resources/design-tokens.json)** — Exact colors, typography scales, tier colors, and spacing tokens.
* 👉 **[`resources/tech-stack.md`](resources/tech-stack.md)** — Next.js 15, React 19, TypeScript strict, Supabase RLS, and component rules.
* 👉 **[`resources/voice-tone.md`](resources/voice-tone.md)** — Trauma-informed voice, anti-advice rules, terminology table, and frozen static replies.
