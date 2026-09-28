# Preferred Tech Stack & Implementation Rules — Project SAHARA

When generating code, UI components, or backend services for Project SAHARA, you **MUST** strictly adhere to the following architecture and technology choices.

---

## 1. Core Technology Stack

* **Framework:** Next.js 15 (App Router), React 19
* **Language:** TypeScript 5 (Strict Mode enforced — `npm run typecheck` must pass with zero errors)
* **Styling Engine:** Tailwind CSS 3.4 (Mandatory. Extended with therapeutic color tokens in `tailwind.config.ts` and `designs/DESIGN.md`.)
* **Iconography:** Lucide React (`lucide-react`)
* **Database & Auth:** Supabase (PostgreSQL) with strict Row Level Security (RLS) on all tables and zero public access policies.
* **LLM Engine:** Swappable OpenAI-compatible adapter (`lib/llm/index.ts`) supporting `mock`, `groq`, `openrouter`, `gemini`, and `ollama` (defaults to `mock` for zero-cost offline development).
* **Voice / Speech:** Native Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) for client-side zero-dependency simulated IVRS dialer (`app/call/page.tsx`).
* **Test Suite:** Native Node.js `node:test` runner executed via `scripts/test-runner.ts` and `tsx` (`npm test`).

---

## 2. Invariant Engineering Rules (Never Violate)

1. **Zero PII (Personally Identifiable Information):**
   * Never store real names, phone numbers, Aadhaar numbers, or real court docket numbers in code, DB, or mock fixtures.
   * All individuals must use pseudonyms following `/^[AU]-[A-Za-z0-9_-]{2,28}$/` (e.g., `A-4471`, `U-1001`).

2. **$S_5$ Acoustic Weight is Pinned to Literal 0.00:**
   * Enforced by Zod schema `literal(0)` and `policy/v1.yaml`.
   * Voice paralinguistics (pitch variability, speech rate deviation, pause ratio) may be displayed for caseworkers only with a prominent low-confidence caveat. Acoustic inference must never affect distress scoring or triage tiering to prevent dialect/accent bias.

3. **Deterministic Safety Interlocks:**
   * **Pass 1 (Lexicon Interlock):** Evaluated strictly before LLM invocation. Regex matching across 40 verified crisis markers in English, Hindi (Devanagari), and Romanised Hindi (Hinglish). Crisis detection is deterministic code, not prompt engineering.
   * **Fail-Safe Negation:** Even negated statements (*"I don't want to die"*) fire the interlock. In crisis triage, false alarms are safe; missed crises are fatal.
   * **Pass 2 (Output Sanitizer):** Rejects any clinical advice, medical diagnoses, false reassurances (*"everything will be fine"*), legal promises, messages $>320$ characters, or $>1$ question mark. Substitutes vetted static copy from `lib/safety/replies.ts`.

4. **Missing ≠ Calm (Signal Renormalisation):**
   * When optional signals ($S_1$ or $S_2$) are omitted, renormalise over present signals:
     $$W_{\text{effective}, k} = \frac{W_k}{\sum_{j \in \text{present}} W_j}$$
   * Never default missing responses to zero. Silence or missing data must never make a victim appear calm.

5. **Order of Operations in EWMA Baseline:**
   * The z-score ($z_t = \frac{x_t - \mu_{t-1}}{\max(\sigma_{t-1}, 8)}$) must be computed **strictly before** updating the running EWMA baseline $(\mu_t, \sigma_t^2)$.

6. **Tier Movement is One-Way Up:**
   * Automated scoring and policy evaluation may elevate a victim's tier (e.g., GREEN $\to$ RED), but can never lower it. Only a human counsellor can resolve or downgrade an alert.

7. **Consent Gate at Ingestion Top:**
   * Every check-in must pass the consent check at Step 2 of `POST /api/checkin`. If active consent is revoked or missing, return `403 Forbidden` with 0 database writes.

8. **Minor Safeguarding Diversion:**
   * Any person record flagged with `is_minor_flag === true` halts automated distress scoring (0 scoring rows) and routes directly to Childline (`1098`) and dedicated child welfare caseworker workflows.

9. **Staff Passcode & Immutable Audit Logging:**
   * Access to `/staff` routes requires `STAFF_PASSCODE`.
   * Every read of victim or case data by staff must persist an audit record in `audit_events`.

---

## 3. Component & UI Patterns

* **Tailwind Class Usage:** Apply utility classes directly in JSX matching design tokens (`bg-primary`, `bg-surface`, `text-distress-red`, etc.). Do not use inline `style={{ ... }}` objects for layout or colors.
* **Soft Minimalism & Humanist Functionalism:**
  * Avoid aggressive, flashing animations or hyper-saturated red banners.
  * Use gentle, therapeutic green (`#206140`, `#3b7a57`) and calming slate surfaces (`#f8fafc`, `#f1f5f9`).
  * For emergency actions, use terracotta rose (`#d97757`, `#8e3d22`) to signal urgency without triggering ocular panic.
* **Touch Targets & Accessibility:**
  * Action buttons (Call, Text, Check-in): Minimum 56px height.
  * Form inputs: Minimum 48px height with soft focus rings (`rgba(59, 122, 87, 0.4)`).
  * Quick Exit: Always pinned with keyboard `ESC` listener and instant window redirection to `https://www.weather.com`.
* **Prose Line Length:** Constrain reading copy to `max-w-prose` (max 64 characters per line) with relaxed line heights (`1.6` to `1.65`) to minimize scanning fatigue for distressed users.

---

## 4. Forbidden Patterns

* ❌ Do NOT introduce external UI component frameworks (e.g. Mantine, MUI, AntD, Chakra) — stick to Tailwind CSS 3.4.
* ❌ Do NOT use jQuery or Bootstrap.
* ❌ Do NOT store PII or generate mock data with real names or actual FIR/case numbers.
* ❌ Do NOT assign non-zero weight to $S_5$.
* ❌ Do NOT allow LLM prompt engineering to replace the deterministic Pass 1 regex lexicon.
* ❌ Do NOT create separate `.css` files; keep styling unified within component JSX via Tailwind.
