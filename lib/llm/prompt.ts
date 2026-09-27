import { z } from "zod";

export const PROMPT_VERSION = "1.3.0" as const;

export const LLMMarkerEnum = z.enum([
  "hopelessness",
  "isolation",
  "fear",
  "anger",
  "exhaustion",
  "numbness",
]);
export type LLMMarker = z.infer<typeof LLMMarkerEnum>;

export const LLMOutputSchema = z.object({
  reply: z.string().max(320),
  s2_score: z.number().min(0).max(100),
  markers: z.array(LLMMarkerEnum),
  evidence: z.array(z.string()),
  language: z.enum(["hi", "en"]),
  next_question_id: z.string().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  distress_detected: z.boolean().optional(),
});

export type LLMOutput = z.infer<typeof LLMOutputSchema>;

export const INTAKE_QUESTIONS = [
  {
    id: "q1",
    en: "How have you been feeling since we last spoke?",
    hi: "पिछली बार जब हमने बात की थी, तब से आप कैसा महसूस कर रहे हैं?",
  },
  {
    id: "q2",
    en: "How much has this been affecting your sleep and eating?",
    hi: "क्या इससे आपकी नींद या खाने-पीने पर असर पड़ रहा है?",
  },
  {
    id: "q3",
    en: "Do you feel safe right now?",
    hi: "क्या आप इस समय सुरक्षित महसूस कर रहे हैं?",
  },
];

export const SYSTEM_PROMPT = `You conduct a thoughtful, confidential wellbeing check-in with a person who has experienced a crime or atrocity and is navigating the justice process. You are an empathetic, attuned intake listener—not a clinical therapist, lawyer, or automated questionnaire bot.

YOUR OBJECTIVE:
Provide a warm, human, and deeply considerate listening space. You have full conversational control to respond empathetically to what the user shares and guide the dialogue naturally with genuine care, attunement, and respect. Do not sound like a rigid script or robotic questionnaire.

CONVERSATIONAL STAGES & NATURAL FLOW:
1. Stage 1 — Warm Welcome & Emotional Check-in:
   - Greet gently and invite them to share how they are feeling today.
2. Stage 2 — Attuned Exploration (Physical Functioning & Safety):
   - Listen actively to what they share.
   - If they bring up difficulties, explore gently (sleep, appetite/eating, energy, or safety) ONE topic at a time.
   - NEVER repeat questions or topics that have already been explored or answered.
3. Stage 3 — Synthesis, Holding Space & Gentle Closure:
   - Once the user has addressed their general feeling, daily functioning (sleep/eating/energy), and safety status, THE STRUCTURED INTAKE IS COMPLETE.
   - STRICT INVARIANT: DO NOT loop back or ask any more intake questions about sleep, eating, energy, or safety!
   - Synthesize and reflect with genuine consideration: acknowledge their experience as a whole (e.g. noticing how having little appetite or low energy affects them even when safety feels "somewhat okay").
   - Offer warm validation and reassurance of presence without interrogation. You do NOT need to ask a question.
   - If you include a question, it must only be an open, non-demanding choice (e.g., asking if there is anything else on their mind they want to talk about, or if they would rather rest).

DEEP CONSIDERATIONS & ATTUNED LISTENING:
1. Consider the Whole Picture:
   - Do not treat the user's latest response in isolation. Connect what they shared across the entire conversation (e.g., if they mentioned difficulty eating earlier, remember that when they mention low energy or safety).
2. Notice Subtle Nuance:
   - Words like "a bit", "somewhat okay", or "managing" carry significant subtext. "Somewhat okay" indicates coping under strain, not total ease. Acknowledge that tentative space with gentle sensitivity instead of brushing past it.
3. Never Interrogate:
   - You are not an auditor with a checklist. Avoid rapid-fire question cycles. Supportive holding of space and calm validation without demanding an answer are often far more healing.
4. Strict Anti-Repetition Rules:
   - NEVER repeat questions that have already been asked or answered earlier in the conversation history.
   - Do NOT use repetitive formulas:
     * STRICTLY BANNED: Repeatedly starting messages with "I hear that...", "I appreciate you sharing that...", or "It sounds like...". Vary your expressions naturally.
     * STRICTLY BANNED: Echoing the same adjectives or descriptors across turns (e.g. repeating "draining", "heavy", etc. if used previously).
     * STRICTLY BANNED: Re-asking about the same topic in slightly altered phrasing (e.g. asking about energy after the user already responded about energy).
     * Vary your sentence structures, tone, and expressions naturally.

CONCISENESS & FORM:
- Keep your response brief, calm, and readable (1 to 3 short sentences, under 300 characters total).
- Maximum ONE question per message (or NO question at all if providing holding space and validation).

CRITICAL SAFETY BOUNDARIES (STRICTLY PROHIBITED):
- NO medical, psychological, or lifestyle advice / coping prescriptions: do NOT tell them what they "should" do, or tell them to "try breathing", "take a walk", "relax", etc.
- NO psychiatric diagnoses or clinical labeling: never mention depression, anxiety disorder, PTSD, trauma response, panic, etc.
- NO false reassurance or dismissive cheer: never say "everything will be fine", "it will get better", "don't worry", "I understand how you feel", etc.
- NO legal outcome promises: never predict or promise what the police, judge, court, or compensation authorities will do.
- NO mirroring of self-harm or violent crisis terms.
- Direct Human / Counsellor Requests & Acute Despair: If the user indicates they cannot go on/live like this or specifically asks to speak/talk to someone, a human, counsellor, or caseworker, warmly acknowledge their distress, do NOT claim to be a human therapist or ask conversational probing questions, and evaluate with high distress (s2_score: 80-95, markers: ["hopelessness"], distress_detected: true, sentiment: "negative").
- Negative Distress Analysis & Counsellor Forwarding:
  * Actively analyze the user's message for emotional negativity and distress.
  * If the user communicates negative feelings, distress, hopelessness, anxiety, overwhelm, feeling unsafe, or coping difficulties: set "sentiment": "negative", "distress_detected": true, and rate "s2_score" >= 65. Provide compassionate, grounding validation without clinical interrogation.
  * If the user communicates calm, neutral, or positive wellbeing: set "sentiment": "positive" or "neutral", "distress_detected": false, and "s2_score" < 40.
- Language: Mirror the user's language. If they communicate in Hindi (Devanagari or Romanised/Hinglish), reply in Hindi. If English, reply in English.

Return ONLY a valid JSON object matching this schema:
{
  "reply": "<warm, natural, context-aware response <= 320 chars, max 1 question>",
  "s2_score": <0-100 linguistic distress score based on markers and sentiment>,
  "markers": ["hopelessness" | "isolation" | "fear" | "anger" | "exhaustion" | "numbness"],
  "evidence": ["short phrase or word quoted from user message"],
  "language": "hi" | "en",
  "sentiment": "positive" | "neutral" | "negative",
  "distress_detected": true | false,
  "next_question_id": "<optional: q1, q2, q3, or custom topic id>"
}`;

export interface HistoryTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface TopicCoverage {
  moodCovered: boolean;
  physicalCovered: boolean;
  safetyCovered: boolean;
  topicsCoveredList: string[];
}

/**
 * Analyzes conversation turns to detect which core intake dimensions have been explored.
 */
export function detectTopicCoverage(
  transcript: string,
  history?: HistoryTurn[]
): TopicCoverage {
  const allText = [
    ...(history || []).map((h) => h.content.toLowerCase()),
    transcript.toLowerCase(),
  ].join(" ");

  const moodCovered =
    allText.includes("feel") ||
    allText.includes("mood") ||
    allText.includes("coping") ||
    allText.includes("better") ||
    allText.includes("sad") ||
    allText.includes("upset") ||
    allText.includes("theek") ||
    allText.includes("achha") ||
    allText.includes("kaisa") ||
    allText.includes("mehsoos");

  const physicalCovered =
    allText.includes("sleep") ||
    allText.includes("neend") ||
    allText.includes("appetite") ||
    allText.includes("bhookh") ||
    allText.includes("eat") ||
    allText.includes("khana") ||
    allText.includes("energy") ||
    allText.includes("drain") ||
    allText.includes("tired") ||
    allText.includes("thak");

  const safetyCovered =
    allText.includes("safe") ||
    allText.includes("suraksh") ||
    allText.includes("threat") ||
    allText.includes("danger") ||
    allText.includes("khatra") ||
    allText.includes("darr");

  const topicsCoveredList: string[] = [];
  if (moodCovered) topicsCoveredList.push("Overall mood/emotional wellbeing");
  if (physicalCovered) topicsCoveredList.push("Sleep, appetite, and energy levels");
  if (safetyCovered) topicsCoveredList.push("Personal safety and environment");

  return { moodCovered, physicalCovered, safetyCovered, topicsCoveredList };
}

/**
 * Builds the user prompt payload including conversation history, topic analysis, and core themes.
 */
export function buildUserPrompt(
  transcript: string,
  preferredLanguage: "en" | "hi" = "hi",
  history?: HistoryTurn[],
  availableQuestions = INTAKE_QUESTIONS
): string {
  let historySection = "";
  if (history && history.length > 0) {
    const formattedHistory = history
      .filter((h) => h.content && h.content.trim())
      .map((h) => {
        const speaker = h.role === "user" ? "User" : "Havenline (You)";
        return `${speaker}: ${h.content.trim()}`;
      })
      .join("\n");
    if (formattedHistory) {
      historySection = `Conversation history so far:\n${formattedHistory}\n\n`;
    }
  }

  const { moodCovered, physicalCovered, safetyCovered, topicsCoveredList } =
    detectTopicCoverage(transcript, history);

  const allPrimaryCovered = moodCovered && physicalCovered && safetyCovered;

  let guidanceSection = "";
  if (allPrimaryCovered) {
    guidanceSection = `STAGE 3 GUIDANCE (PRIMARY INTAKE COMPLETE — HOLDING SPACE & GENTLE CLOSURE):
All core check-in themes (${topicsCoveredList.join(", ")}) have already been explored.
- STRICT RULE: DO NOT ask any further intake questions about sleep, eating, energy, or safety.
- STRICT RULE: DO NOT repeat any questions or phrases from earlier messages.
- CONSIDERATION: Synthesize and reflect on their whole situation with genuine warmth (e.g. acknowledging the strain of low appetite and energy even when safety is somewhat okay).
- HOLDING SPACE: Provide a supportive, grounding statement of care and presence. You do NOT need to ask a question. If you ask anything, it must only be an open, non-demanding choice (e.g. asking if there is anything else they'd like to share or if they would prefer to rest).`;
  } else {
    guidanceSection = `CONVERSATIONAL PROGRESSION:
- Topics explored so far: ${topicsCoveredList.length > 0 ? topicsCoveredList.join(", ") : "Initial greeting / check-in"}
- STRICT RULE: DO NOT re-ask questions about topics that have already been explored.
- CONSIDERATION: Respond directly and thoughtfully to the latest message. Connect with earlier context where helpful. Avoid repetitive formulas like "I hear that" or "I appreciate you sharing".`;
  }

  const themesFormatted = availableQuestions
    .map((q) => `- [${q.id}]: ${preferredLanguage === "hi" ? q.hi : q.en}`)
    .join("\n");

  return `${historySection}Latest user message to respond to:
"""${transcript}"""

${guidanceSection}

Core intake themes for reference (explore naturally, do not rigidly repeat):
${themesFormatted}

Preferred language: ${preferredLanguage}

Respond with genuine conversational empathy, thoughtfulness, and consideration. Return ONLY the JSON object.`;
}
