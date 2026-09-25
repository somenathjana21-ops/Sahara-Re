# Project Brief — SIH 26094
## AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities

**Read this to understand what we are building and why.** It is the source for the deck, the demo narration, and the answers to hard questions. Everything else in `docs/` is implementation detail hanging off this.

---

## 1. The problem, in the department's own words

The Ministry of Social Justice and Empowerment states it plainly: victims of atrocities experience prolonged psychological distress *after* the complaint is registered — from threats, intimidation, repeated court appearances, investigation and trial delays, social ostracism, economic hardship, and rehabilitation difficulties. Existing mechanisms cover legal and financial support and **do not monitor wellbeing at all**.

So the gap is not "victims need help." It is that between the day a complaint is filed and the day a case resolves — often years — **nobody is watching how the person is doing.** A helpline records that they called. A court records that a hearing was adjourned. Nothing connects those to whether the person is coping.

That specific gap is what this system fills. Not counselling. Not case management. The missing monitoring layer.

---

## 2. The one sentence that governs every decision

> **The AI does not decide. It decides who a human looks at next, and why.**

Everything below follows from this. When a design question is genuinely hard, this sentence resolves it.

It also sets the honest bar for success. We are not claiming to predict suicide. We are claiming to **rank a counsellor's queue better than "whoever called most recently"**, and to explain each ranking well enough that the counsellor can disagree with it.

---

## 3. The core insight

Most teams attacking this problem will build a chatbot that reads emotion from what a victim says or how their voice sounds. That approach has two problems, and the second one is disqualifying.

**It is unreliable.** Acoustic emotion inference degrades sharply across accent, dialect, gender, and recording quality — meaning it works *worst* for rural, low-income, marginalised callers. That is precisely backwards for this population.

**It ignores the answer sitting in plain sight.** Re-read the problem statement's own list of stressors: *repeated court appearances, delays in investigation and trial, economic hardship, threats and intimidation.* Every one of those is **knowable from a case file and a calendar**:

- Is there a hearing in the next seven days?
- How many times has this been adjourned?
- Is the accused out on bail?
- Is the compensation instalment overdue?
- Was an intimidation report filed recently?

No natural language processing. No voice analysis. No training data. No model. Just a database query and today's date — and it is more predictive than parsing a distressed person's speech, and trivially explainable to anyone who asks.

**This is our differentiator.** We call it the S3 case-context signal, and in our worked example it is the single largest contributor to the alert that fires.

---

## 4. How it works

### The pipeline

```
chat ─┐
      ├──→  POST /api/checkin
call ─┘            │
                   ├─ 1. CONSENT GATE — no live consent, no scoring, 403
                   ├─ 2. SAFETY INTERLOCK on user input (deterministic)
                   │       crisis? → resources returned immediately, model never called
                   ├─ 3. LLM — acknowledges, asks one question, returns an S2 signal
                   ├─ 4. SAFETY INTERLOCK on the model's output (second pass)
                   ├─ 5. SCORING — S1..S5 → per-person EWMA → z-score → change point
                   ├─ 6. POLICY ENGINE — versioned YAML → GREEN / AMBER / RED / CRITICAL
                   └─ 7. ALERT if RED or CRITICAL, acknowledgement required
                              ↓
                     counsellor dashboard: queue · trend · breakdown · disposition
```

### The score

```
composite = 0.35·S1 + 0.25·S2 + 0.25·S3 + 0.15·S4 + 0.00·S5
```

| | Signal | What it is | Where it comes from |
|---|---|---|---|
| S1 | Self-report | Three questions, 0–4, tap or keypad | The person |
| S2 | Linguistic | Distress markers in what they wrote or said | The LLM |
| S3 | **Case context** | Hearing, adjournments, bail, relief delay, intimidation | **The case file and a calendar** |
| S4 | Engagement | Missed check-ins, latency, abandonment | System behaviour |
| S5 | Acoustic | Voice paralinguistics | **Displayed, weighted zero** |

**Why additive and interpretable, not a trained classifier.** The problem statement mandates explainable AI. A black-box classifier gives a number and no account of itself; you then have to bolt on post-hoc explanation machinery and defend it. An additive composite of five named components explains itself by construction — every alert shows what contributed and by how much. The interpretability is not a compromise. It is the feature.

**Why S5 is zero.** We extract it, show it to the counsellor labelled low-confidence, and give it no influence — for the reason in §3. Showing it while refusing to score it is a stronger statement than hiding it, and it is a deliberate talking point rather than an omission.

### Why "dynamic" means per-person baselines

A fixed threshold systematically under-flags reserved people and over-flags expressive ones. A stoic person's small change carries more information than a demonstrative person's large absolute value.

So each person accumulates their own exponentially-weighted baseline, and the alert fires on **deviation from themselves**:

```
z = (this composite − their own baseline) / their own variation
change point when z > 2.0 and they have at least 2 prior check-ins
```

That is the PRD's "sudden-shift detection", and it is the honest meaning of the word *Dynamic* in the problem title.

---

## 5. The safety model

This is the part judges probe hardest, and the part that must not fail.

**Crisis detection is deterministic code — a lexicon match — never a model output.** A system prompt is a request. A regex is a guarantee. Under adversarial input, code-switching, distress, or a provider silently changing model versions, the prompt bends and the regex does not.

**The interlock runs twice.** Once on what the person wrote, before any model is contacted. Once on what the model produced, before it reaches the person. The second pass is the one teams forget — it catches the model generating advice, offering false reassurance, or echoing a crisis phrase back.

**The model is tightly boxed.** It may acknowledge in one sentence and ask one question. It may not advise, diagnose, reassure about outcomes, or handle a crisis. Safety-critical text comes from a fixed, human-written reply bank — never generated.

**Tier movement is one-directional.** A model may raise a tier. It may never be the sole cause of CRITICAL, and may never lower any tier. Only a human closes a critical case.

**Silence escalates.** Missed check-ins raise the score, never lower it. Non-response can mean recovery, a lost phone, coercion preventing contact, or crisis — and scoring it as improvement is the failure mode that gets people killed.

**Alerts cannot silently vanish.** Delivery requires acknowledgement, and a daily reconciliation job asserts that every RED or CRITICAL in the last 24 hours has a matching human acknowledgement. Mismatches raise incidents.

Even the unfinished stub **fails closed**: with the pipeline unwired, the production endpoint returns 503 with real helpline numbers rather than guessing a tier.

---

## 6. Privacy and legal posture

| Commitment | How it is enforced |
|---|---|
| No personal data anywhere | Pseudonymous IDs (`A-4471`). No name, phone, email, address, or real case number in the database, repo, or fixtures. A CI job fails the build on PII patterns |
| Consent before scoring | No live consent row, no assessment written. Enforced at the top of the handler, not in the UI |
| Consent is genuinely voluntary | Stated in body text on the landing page: participation does not affect the case, relief, or compensation. Entitlements have no dependency on the consent service |
| Distress data never reaches law enforcement | Enforced in the authorisation layer, not by hiding UI |
| Every access is auditable | Every staff-side read of person-level data writes an audit row |
| Database locked down | Row-level security on, no policies; all access via server-side handlers. The browser never touches the database |
| Minors | Any minor indicator routes to a human workflow with no automated scoring. Guardian consent under DPDP collides badly with intra-family abuse cases where the guardian may be implicated — so we don't pretend to have solved it |

Legal grounding: SC/ST (Prevention of Atrocities) Act 1989 and Rules · §228A IPC / the corresponding BNS provision on victim identity · DPDP Act 2023 and Rules.

---

## 7. What we deliberately did not build

Saying this out loud is a strength. Every item is a decision, not an oversight.

| Not built | Why |
|---|---|
| Real telephony | Approval latency exceeds the build window. The call screen is simulated in-browser and **labelled as such on screen** |
| SMS / WhatsApp | Same pipeline, no new insight, real integration cost |
| Accounts, login, email | We store no personal data, so there is nothing to authenticate to |
| Live NHAA integration | Requires data-sharing permissions we don't have. Simulated, and we say so |
| Languages beyond Hindi and English | We ship two languages end-to-end rather than claiming ten with only the UI translated |
| A trained distress classifier | Would defeat the explainability requirement, and no labelled longitudinal data exists to train one honestly |
| Automated scoring for minors | See §6 |

---

## 8. What is genuinely uncertain

Volunteer these. A judge who finds a limitation you hid discounts everything else you said.

- **Speech recognition accuracy varies by dialect**, and we have measured it on only two languages. A typed path always exists.
- **The scoring weights are authored, not learned.** They are grounded in the problem statement's own list of stressors and tuned against a synthetic development set — a defensible starting point, not a validated instrument.
- **The corpus is synthetic**, because real victim data cannot ethically be used for prototype testing. Nothing here has been validated against real outcomes, and we do not claim it has.
- **We do not know the false-positive rate in the field.** We report recall on seeded critical cases and per-language slices, and we deliberately do not report accuracy: at a crisis base rate near 0.5%, a system that always says "fine" scores 99.5%.
- **Deployment would need a paid or self-hosted model endpoint.** Free tiers may train on inputs, which is exactly why this system never sends real data through one.
- **A real deployment needs a named clinical supervisor.** We are engineers; the crisis lexicon and the escalation thresholds need a clinician's sign-off before this touches a real person.

---

## 9. The demo, in ninety seconds

One persona. Three check-ins. Flat, flat, spike.

**A-4471**, land dispossession, trial stage. Accused on bail, fourth adjournment, relief 62 days overdue — 50 points of standing case pressure, held deliberately below the escalation threshold.

| | Day −3 | Day −2 | Day −1 | Day 0, live on stage |
|---|---|---|---|---|
| S3 | 50 | 50 | *intimidation report filed; hearing enters the 7-day window* | **90** |
| Composite | 28.00 | 31.00 | | **53.75** |
| z | — | 0.375 | | **3.11** |
| Tier | GREEN | GREEN | | **RED** |

Breakdown at the alert: **S3 22.50** · S1 17.50 · S2 13.75 · S4 0.00.

**The three sentences, all true of those numbers:**

1. Her self-report moved from mild to moderate and her language got somewhat more distressed — but the thing that moved most was **the case file**.
2. A composite of 53.75 is not alarming in absolute terms. It fires because it is **3.11 standard deviations above her own baseline**. A fixed threshold would have missed her.
3. The hearing is six days away and the intimidation report was filed yesterday. **She is flagged before the hearing, not after it.**

---

## 10. Hard questions, honest answers

| Question | Answer |
|---|---|
| What's your accuracy? | We don't report it. At a ~0.5% base rate, "always fine" scores 99.5%. We report recall on seeded critical cases and per-language slices. |
| Isn't this just a chatbot? | The chat is one of three inputs. The product is the scoring, the change-point detection, and the escalation. Here is the dashboard. |
| Do voice and text use the same model? | Yes — both normalise to one record before any scoring. Here is the single endpoint. |
| What if the AI is wrong? | It never decides. It decides who a human looks at next, and why. It can raise a tier, never lower one, and only a human closes a critical case. |
| What if the model says something harmful? | It cannot reach the user unchecked. The interlock runs on its output too, and safety-critical text comes from a fixed bank. |
| Isn't emotion-from-voice unreliable? | Yes — worst for the accents of the most marginalised callers. We extract it, display it with a caveat, and weight it zero. |
| How do you know an alert wasn't dropped? | Acknowledgement-required delivery plus a daily reconciliation job. Every critical alert in 24 hours must have a matching acknowledgement. |
| Did you use real victim data? | No. The corpus is synthetic. Public case records were used only to build a de-identified atrocity-category taxonomy. |
| Your LLM is on a free tier — isn't that a privacy problem? | It would be with real data. Free tiers may train on inputs, which is exactly why real data never goes through one. Production needs a paid or self-hosted endpoint. |
| Is consent real if relief depends on it? | Entitlements have no dependency on the consent service, and we say so in the notice the person hears. |
| Why not just train a model? | It would defeat the explainability requirement, and no labelled longitudinal data exists to train one honestly. Our interpretability is structural, not bolted on. |

---

## 11. Where everything lives

| Document | What it answers |
|---|---|
| `docs/00_MVP_PLAN.md` | Scope, ownership, five-day schedule, the golden path |
| `docs/SAFETY_SPEC.md` | Interlock, lexicon, reply bank, banned output patterns, acceptance tests |
| `docs/SCORING_AND_POLICY.md` | The score, the case-context rubric, baselines, policy file, worked example |
| `docs/TM1/2/3_GUIDE.md` | Per-person build instructions and prompts |
| `docs/CHECKS_TM1/2/3.md` | Executable verification — run against the repo, reports PASS/FAIL with evidence |
| `supabase/schema.sql` | The data contract |
| `types/contract.ts` | The code contract. Frozen |
| `CLAUDE.md` | The ten rules any agent working in this repo must obey |
