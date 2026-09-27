import {
  LLMOutput,
  LLMOutputSchema,
  PROMPT_VERSION,
  SYSTEM_PROMPT,
  buildUserPrompt,
} from "./prompt";

export type LLMProvider = "groq" | "openrouter" | "gemini" | "ollama" | "mock" | "none";

export interface LLMRequestOptions {
  transcript: string;
  language?: "en" | "hi";
  mockScore?: number; // Override for deterministic testing
  timeoutMs?: number;
}

export interface LLMAnalysisResult {
  reply: string | null;
  s2Score: number | null;
  markers: string[];
  evidence: string[];
  language: "en" | "hi";
  nextQuestionId?: string;
  modelVersion: string;
  rawOutput?: string;
  error?: string;
}

const DEFAULT_PROVIDER: LLMProvider =
  (process.env.LLM_PROVIDER as LLMProvider) || "mock";

const PROVIDER_CONFIGS: Record<
  Exclude<LLMProvider, "mock" | "none">,
  { baseUrl: string; defaultModel: string }
> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-1.5-flash",
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3:latest",
  },
};

/**
 * Strips markdown code blocks if the model returned wrapped JSON.
 */
function cleanJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

/**
 * Deterministic offline mock implementation.
 * Used when LLM_PROVIDER is 'mock', 'none', or during hermetic automated testing.
 */
function generateDeterministicMock(
  transcript: string,
  preferredLanguage: "en" | "hi" = "hi",
  mockScore?: number
): LLMOutput {
  const text = transcript.toLowerCase();

  // If explicit mock score requested, honour it
  if (typeof mockScore === "number") {
    return {
      reply:
        preferredLanguage === "hi"
          ? "मैंने आपकी बात सुनी। क्या आप इस समय सुरक्षित महसूस कर रहे हैं?"
          : "I hear what you are saying. Do you feel safe right now?",
      s2_score: mockScore,
      markers: mockScore >= 50 ? ["fear", "exhaustion"] : ["exhaustion"],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: "q3",
    };
  }

  // Calm / neutral phrases (take precedence when stated positively)
  if (
    text.includes("sab theek") ||
    text.includes("theek hai") ||
    text.includes("theek hoon") ||
    text.includes("all good") ||
    text.includes("feeling fine") ||
    text.includes("koi pareshani nahi") ||
    text.includes("no problem")
  ) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "बात करने के लिए धन्यवाद। पिछली बार से आप कैसा महसूस कर रहे हैं?"
          : "Thank you for checking in. How have you been feeling since we last spoke?",
      s2_score: 15,
      markers: [],
      evidence: [],
      language: preferredLanguage,
      next_question_id: "q1",
    };
  }

  // Golden Path Day 0 transcript detection:
  // "neend bilkul nahi aa rahi hai, dar lag raha hai" / intimidation / hearing distress
  if (
    text.includes("dar") ||
    text.includes("darr") ||
    text.includes("fear") ||
    text.includes("neend") ||
    text.includes("threat") ||
    text.includes("intimidation") ||
    text.includes("hearing")
  ) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "मैं समझ सकता हूँ कि यह समय कठिन है। क्या आप इस समय सुरक्षित महसूस कर रहे हैं?"
          : "I hear that this time is challenging. Do you feel safe right now?",
      s2_score: 55, // Day 0 Golden Path expectation: S2 = 55
      markers: ["fear", "exhaustion"],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: "q3",
    };
  }

  // Mild distress
  if (text.includes("sad") || text.includes("pareshan") || text.includes("udas")) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "आपकी बात सुनी। क्या इससे आपकी नींद या खाने-पीने पर असर पड़ रहा है?"
          : "Thank you for sharing. How has this been affecting your sleep?",
      s2_score: 35,
      markers: ["exhaustion"],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: "q2",
    };
  }

  // Neutral / calm
  return {
    reply:
      preferredLanguage === "hi"
        ? "बात करने के लिए धन्यवाद। पिछली बार से आप कैसा महसूस कर रहे हैं?"
        : "Thank you for checking in. How have you been feeling since we last spoke?",
    s2_score: 15,
    markers: [],
    evidence: [],
    language: preferredLanguage,
    next_question_id: "q1",
  };
}

/**
 * Swappable OpenAI-compatible LLM Adapter.
 *
 * Invariants:
 * 1. Single entry point for all LLM calls across the application.
 * 2. Graceful degradation: network failures, timeouts, rate limits, or schema mismatches
 *    NEVER throw 500. They return s2Score = null to allow composite renormalisation.
 * 3. Returns model_version string for complete audit reproducibility.
 */
export async function analyzeTranscript(
  options: LLMRequestOptions
): Promise<LLMAnalysisResult> {
  const provider = (process.env.LLM_PROVIDER as LLMProvider) || DEFAULT_PROVIDER;
  const lang = options.language || "hi";
  const timeoutMs = options.timeoutMs || 8000;

  // Branch 1: Deterministic mock mode
  if (provider === "mock" || provider === "none") {
    try {
      const mockResult = generateDeterministicMock(
        options.transcript,
        lang,
        options.mockScore
      );
      const validated = LLMOutputSchema.parse(mockResult);
      return {
        reply: validated.reply,
        s2Score: validated.s2_score,
        markers: validated.markers,
        evidence: validated.evidence,
        language: validated.language,
        nextQuestionId: validated.next_question_id,
        modelVersion: `mock:default+prompt-${PROMPT_VERSION}`,
        rawOutput: JSON.stringify(validated),
      };
    } catch (err) {
      return {
        reply: null,
        s2Score: null,
        markers: [],
        evidence: [],
        language: lang,
        modelVersion: `mock:default+prompt-${PROMPT_VERSION}`,
        error: (err as Error).message,
      };
    }
  }

  // Branch 2: Live OpenAI-compatible provider
  const cfg = PROVIDER_CONFIGS[provider];
  if (!cfg) {
    return {
      reply: null,
      s2Score: null,
      markers: [],
      evidence: [],
      language: lang,
      modelVersion: `unknown:${provider}+prompt-${PROMPT_VERSION}`,
      error: `Unknown LLM provider: ${provider}`,
    };
  }

  const baseUrl = process.env.LLM_BASE_URL || cfg.baseUrl;
  const model = process.env.LLM_MODEL || cfg.defaultModel;
  const apiKey = process.env.LLM_API_KEY || "";
  const modelVersion = `${provider}:${model}+prompt-${PROMPT_VERSION}`;

  try {
    const userPrompt = buildUserPrompt(options.transcript, lang);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return {
        reply: null,
        s2Score: null,
        markers: [],
        evidence: [],
        language: lang,
        modelVersion,
        error: `LLM API call failed with status ${response.status}: ${errText.slice(0, 120)}`,
      };
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = json?.choices?.[0]?.message?.content || "";
    const cleaned = cleanJsonText(rawContent);
    const parsed = JSON.parse(cleaned);
    const validated = LLMOutputSchema.parse(parsed);

    return {
      reply: validated.reply,
      s2Score: validated.s2_score,
      markers: validated.markers,
      evidence: validated.evidence,
      language: validated.language,
      nextQuestionId: validated.next_question_id,
      modelVersion,
      rawOutput: rawContent,
    };
  } catch (err) {
    // Graceful degradation: never crash pipeline, return s2Score: null
    return {
      reply: null,
      s2Score: null,
      markers: [],
      evidence: [],
      language: lang,
      modelVersion,
      error: `LLM parsing or network failure: ${(err as Error).message}`,
    };
  }
}
