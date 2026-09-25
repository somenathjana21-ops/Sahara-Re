import { z } from "zod";

export const PROMPT_VERSION = "1.0.0" as const;

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

export const SYSTEM_PROMPT = `You conduct a brief wellbeing check-in with a person who has experienced a crime or atrocity and is going through the justice process. You are a listening intake step, not a counsellor.

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

Mirror the user's language: reply in Hindi if they wrote Hindi (including romanised Hindi), otherwise English.

Return ONLY a valid JSON object matching this schema:
{
  "reply": "<= 2 sentences",
  "s2_score": <0-100 linguistic distress>,
  "markers": ["hopelessness" | "isolation" | "fear" | "anger" | "exhaustion" | "numbness"],
  "evidence": ["short phrase quoted from their message"],
  "language": "hi" | "en",
  "next_question_id": "<id from the list>"
}`;

/**
 * Builds the user prompt payload including the available intake questions.
 */
export function buildUserPrompt(
  transcript: string,
  preferredLanguage: "en" | "hi" = "hi",
  availableQuestions = INTAKE_QUESTIONS
): string {
  const questionsFormatted = availableQuestions
    .map((q) => `- [${q.id}]: ${preferredLanguage === "hi" ? q.hi : q.en}`)
    .join("\n");

  return `User transcript:
"""${transcript}"""

Available questions:
${questionsFormatted}

Preferred language: ${preferredLanguage}

Analyze the transcript and return ONLY the JSON object.`;
}
