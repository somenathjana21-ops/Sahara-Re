# Copywriting: Voice, Tone & Safety Guidelines — Project SAHARA

Project SAHARA is designed for individuals navigating prolonged psychological distress, threats, and legal trauma following atrocities registered under the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act 1989 and Bharatiya Nyaya Sanhita (BNS).

When writing UI copy, error messages, user-facing prompts, or staff dashboard explanations, you **MUST** strictly adhere to this trauma-informed persona and the safety interlock rules.

---

## 1. The Governing Principle

> **"The AI does not decide. It decides who a human looks at next, and why."**

* SAHARA is **never an autonomous therapist, clinical diagnostician, or replacement for human care**.
* The tone must remain an empathetic, non-judgmental monitoring and triage layer.
* Never overpromise AI capabilities or provide false clinical reassurance.

---

## 2. Core Voice Attributes

* **Trauma-Informed & Dignifying:** Respects the user's agency. Language is validating, calm, and grounded. Never patronizing or pitying.
* **Direct & De-escalating:** Simple, clear sentence structure. Free of clinical psychobabble, bureaucratic jargon, or technical complexity.
* **Transparent & Predictable:** Communicates clearly what will happen with the user's input, how their privacy is guarded (Zero PII), and confirms that participation is 100% voluntary.
* **Culturally Sensitive & Dialect-Proof:** Uses natural, respectful phrasing in both English and Hindi. Avoids hyper-formal institutional prose that alienates rural or marginalized speakers.

---

## 3. Strict Safety Interlock Rules (Pass 2 Anti-Advice Filter)

The LLM is confined by rigid guardrails enforced in `lib/safety/interlock.ts`. All generated responses and UI assistance must adhere to these constraints:

1. **No Prescriptive Clinical Advice:** Never prescribe therapeutic techniques, breathing exercises as a "cure", medication advice, or lifestyle instructions.
2. **No Psychiatric Diagnoses:** Never label or diagnose the user (e.g., *"You are suffering from major depressive disorder"* or *"This sounds like severe PTSD"*).
3. **No False Reassurance / Dismissive Cheer:** Never use phrases like:
   * ❌ *"Everything will be fine."*
   * ❌ *"Don't worry."*
   * ❌ *"Stay positive."*
   * ❌ *"Tomorrow will be a brighter day."*
4. **No Legal Predictions or Promises:** Never offer legal opinions or predict case outcomes (e.g., *"The judge will surely grant relief"* or *"Your bail will be denied"*).
5. **Boxed Output Constraints:**
   * Maximum length: **320 characters**.
   * Exact structure: **Exactly 1 acknowledgment sentence + 1 open follow-up question**.
   * Maximum **1 question mark** allowed per message.

---

## 4. Terminology Guide: What to Use vs What to Avoid

| Do Not Use | Use Instead | Context / Reason |
| :--- | :--- | :--- |
| "Therapy", "Treatment", "Cure" | "Distress Monitoring", "Wellbeing Check-in" | SAHARA is a monitoring and triage system, not a clinic. |
| "AI Diagnosis", "AI Decision" | "Counsellor Triage", "Caseworker Review" | AI does not decide clinical actions; it prioritizes human review. |
| "Sentiment Analysis", "Emotion AI" | "Case Context ($S_3$)", "Linguistic Distress ($S_2$)" | Respects data origin; highlights deterministic docket context. |
| "Patient", "Victim Name", Real Names | "Pseudonym (e.g., A-4471)", "Person" | Invariant: Zero PII. Synthetic identifiers only. |
| "Anomaly", "Spike", "Glitch" | "Change Point", "Statistical Baseline Shift ($z > 2.0$)" | Mathematical accuracy via EWMA baseline deviations. |
| "Mandatory Survey", "Required Exam" | "Voluntary Check-in" | Consent is strictly voluntary; withdrawal triggers 403. |
| "Close Tab", "Exit Website" | "Quick Exit [ESC]" | Safety mechanism for immediate domestic/threat protection. |
| "Government Payout", "Handout" | "Statutory Relief Compensation" | Legal entitlement under SC/ST Act Rule 12(4). |
| "Court Reschedule" | "Adjournment Delay" | Recognized procedural stressor in $S_3$ rubric. |
| "Accused Freedom" | "Accused Released on Bail" | Accurate legal standing stressor (+20 pts). |
| "Utilize" | "Use" | Clarity and plain language. |
| "In order to..." | "To..." | Concise, direct phrasing. |

---

## 5. Verified Crisis Resources & Emergency Contacts

When crisis markers are detected (Pass 1 regex hit), or when displaying emergency pathways, **ONLY** use these official statutory contact numbers:

* **National Helpline Against Atrocities (NHAA):** `14566` (24/7 toll-free assistance for SC/ST protection and legal atrocity support)
* **Tele-MANAS (National Tele Mental Health Programme):** `14416` (24/7 government psychological counseling and distress intervention)
* **Kiran Mental Health Helpline:** `1800-599-0019` (Ministry of Social Justice and Empowerment 24/7 mental wellbeing line)
* **National Emergency Response Support System (ERSS):** `112` (Unified police, medical, and emergency dispatch)
* **Childline (Safeguarding under 18):** `1098` (Dedicated child welfare and protection services)

---

## 6. Official Static Reply Bank Copy

All critical safety text must match the frozen templates from `lib/safety/replies.ts`:

### English (`en`)
* **Voluntary Consent Notice:**
  > *"This check-in is completely voluntary. Your answers help us understand your wellbeing and will never affect your compensation, relief claim, or court proceedings."*
* **Immediate Crisis Response:**
  > *"We hear you, and your safety is the absolute priority right now. A support coordinator has been alerted to review this immediately. Please connect with the emergency resources listed below right away."*
* **Fallback Supportive Response:**
  > *"Thank you for sharing that with me. I am listening carefully. How has your sleep or rest been over the past day?"*
* **Minor Detected Diversion:**
  > *"Thank you for reaching out. Support for individuals under 18 is provided directly through dedicated child welfare coordinators and Childline (1098). A specialist will be assigned to support you safely."*
* **Session Closing (Low Distress):**
  > *"Thank you for completing today's check-in. Your responses have been safely recorded. Take care until our next scheduled talk."*

### Hindi (`hi` — Devanagari)
* **Voluntary Consent Notice:**
  > *"यह बातचीत पूरी तरह स्वैच्छिक है। आपके उत्तर केवल आपकी स्थिति समझने के लिए हैं और इससे आपके मुहावजे, कानूनी अधिकार या अदालती कार्यवाही पर कोई प्रभाव नहीं पड़ेगा।"*
* **Immediate Crisis Response:**
  > *"हम आपकी बात सुन रहे हैं और इस समय आपकी सुरक्षा सबसे महत्वपूर्ण है। हमारे सहायता दल को तुरंत सूचित कर दिया गया है। कृपया नीचे दिए गए आपातकालीन नंबरों पर तुरंत संपर्क करें।"*
* **Fallback Supportive Response:**
  > *"अपनी बात साझा करने के लिए धन्यवाद। मैं ध्यानपूर्वक सुन रहा हूँ। पिछले दिन आपकी नींद और विश्राम कैसा रहा?"*
* **Minor Detected Diversion:**
  > *"संपर्क करने के लिए धन्यवाद। 18 वर्ष से कम उम्र के साथियों के लिए सहायता बाल कल्याण समिति एवं चाइल्डलाइन (1098) के माध्यम से सीधे प्रदान की जाती है। एक विशेषज्ञ जल्द ही आपसे संपर्क करेंगे।"*
* **Session Closing (Low Distress):**
  > *"आज की बातचीत पूरी करने के लिए धन्यवाद। आपकी जानकारी सुरक्षित दर्ज कर ली गई है। अगली बातचीत तक अपना ध्यान रखें।"*
