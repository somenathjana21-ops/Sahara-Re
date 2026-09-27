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
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export interface LLMAnalysisResult {
  reply: string | null;
  s2Score: number | null;
  markers: string[];
  evidence: string[];
  language: "en" | "hi";
  nextQuestionId?: string;
  sentiment?: "positive" | "neutral" | "negative";
  distressDetected?: boolean;
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
  mockScore?: number,
  history?: Array<{ role: string; content: string }>
): LLMOutput {
  const text = transcript.toLowerCase().trim();

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

  // Greetings
  if (text === "hi" || text === "hello" || text === "hey" || text === "namaste") {
    return {
      reply:
        preferredLanguage === "hi"
          ? "नमस्ते। आप आज कैसा महसूस कर रहे हैं? जब भी आप बात करना चाहें, हम सुनने के लिए उपस्थित हैं।"
          : "Hello. How are you doing today? We are here to listen whenever you feel ready to share.",
      s2_score: 10,
      markers: [],
      evidence: [],
      language: preferredLanguage,
      next_question_id: "q1",
    };
  }

  // Positive progression / feeling better
  if (text.includes("better") || text.includes("sudhar") || text.includes("achha")) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "यह जानकर अच्छा लगा कि आप कुछ बेहतर महसूस कर रहे हैं। क्या आपकी नींद और दिनचर्या पर भी कोई सकारात्मक प्रभाव पड़ा है?"
          : "I'm glad to hear you are feeling a bit better. Has that helped your sleep and rest recently?",
      s2_score: 15,
      markers: [],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: "q2",
    };
  }

  // Physical functioning / appetite / eating difficulties
  if (
    text.includes("unable to eat") ||
    text.includes("eating") ||
    text.includes("appetite") ||
    text.includes("bhookh") ||
    text.includes("khana")
  ) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "यह सुनकर खेद है कि आपको खाने में परेशानी हो रही है। कम पोषण से थकान हो सकती है। क्या इसका असर आपकी दिन की ऊर्जा पर पड़ रहा है?"
          : "It sounds like eating has been tough right now. Not being able to eat enough can be wearing. Is this affecting your energy during the day?",
      s2_score: 30,
      markers: ["exhaustion"],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: "q2",
    };
  }

  // Brief nuance response: "a bit" / "little" / "thoda"
  if (text.includes("a bit") || text.includes("little") || text.includes("thoda")) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "अपनी बात साझा करने के लिए धन्यवाद। थोड़ी सी भी परेशानी थकान ला सकती है। क्या आप इस समय अपने परिवेश में सुरक्षित महसूस कर रहे हैं?"
          : "Thank you for letting me know. Even slight disruptions can be wearing. Do you feel safe in your environment right now?",
      s2_score: 25,
      markers: ["exhaustion"],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: "q3",
    };
  }

  // Nuanced safety / coping response: "somewhat okay", "managing", "okay" (Stage 3 Synthesis & Closure)
  if (
    text.includes("somewhat") ||
    text.includes("thoda theek") ||
    text.includes("kuch theek") ||
    (text.includes("okay") && history && history.length >= 3)
  ) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "अपनी बात साझा करने के लिए धन्यवाद। जब भूख और ऊर्जा कम हो, तो स्थिति संभालना कठिन हो सकता है भले ही सुरक्षा कुछ हद तक ठीक हो। कृपया आज खुद का ध्यान रखें—हम यहीं हैं।"
          : "Thank you for sharing that with me. Coping with low appetite and low energy is demanding even when safety feels somewhat okay. Please be gentle with yourself today—we are here whenever you'd like to talk.",
      s2_score: 25,
      markers: ["exhaustion"],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: undefined,
    };
  }

  // High distress indicators / negative replies / inability to go on / human requests
  if (
    text.includes("very bad") ||
    text.includes("bahut bura") ||
    text.includes("terrible") ||
    text.includes("horrible") ||
    text.includes("cannot live") ||
    text.includes("cant live") ||
    text.includes("talk to someone") ||
    text.includes("speak to someone") ||
    text.includes("hopeless") ||
    text.includes("depressed") ||
    text.includes("crying") ||
    text.includes("miserable") ||
    text.includes("scared") ||
    text.includes("overwhelmed") ||
    text.includes("cannot cope") ||
    text.includes("cant cope") ||
    text.includes("unbearable")
  ) {
    const isAcute =
      text.includes("cannot live") ||
      text.includes("cant live") ||
      text.includes("unbearable");
    return {
      reply:
        preferredLanguage === "hi"
          ? "मुझे खेद है कि आज आपको बहुत बुरा महसूस हो रहा है। आपकी सुरक्षा और सहायता सबसे पहले है। हम आपकी बात सुन रहे हैं।"
          : "I hear how heavy and difficult things feel right now. Support coordinators have been alerted to review this immediately. We are here to support you.",
      s2_score: isAcute ? 85 : 65,
      markers: ["hopelessness", "fear"],
      evidence: [transcript.slice(0, 30)],
      language: preferredLanguage,
      next_question_id: "q3",
      sentiment: "negative",
      distress_detected: true,
    };
  }

  // Mention of death / acute distress
  if (text.includes("death") || text.includes("maut") || text.includes("mar")) {
    return {
      reply:
        preferredLanguage === "hi"
          ? "आपकी बात से आपकी गहरी पीड़ा महसूस हो रही है। आपकी सुरक्षा सबसे महत्वपूर्ण है, क्या आप अभी सुरक्षित हैं?"
          : "I hear how much pain you are experiencing right now. Your safety matters most—do you feel safe right now?",
      s2_score: 85,
      markers: ["hopelessness", "fear"],
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

  // Context-aware default: vary by history length if available
  const hasHistory = history && history.length > 0;
  return {
    reply:
      preferredLanguage === "hi"
        ? hasHistory
          ? "अपनी बात साझा करने के लिए धन्यवाद। क्या आप इसके बारे में थोड़ा और बताना चाहेंगे?"
          : "बात करने के लिए धन्यवाद। पिछली बार से आप कैसा महसूस कर रहे हैं?"
        : hasHistory
        ? "Thank you for sharing that with me. Is there anything specific on your mind today?"
        : "Thank you for checking in. How have you been feeling since we last spoke?",
    s2_score: 20,
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
        options.mockScore,
        options.history
      );
      const validated = LLMOutputSchema.parse(mockResult);
      const isDistress = Boolean(
        validated.distress_detected ||
        validated.s2_score >= 65 ||
        validated.markers.includes("hopelessness") ||
        (validated.sentiment === "negative" && validated.s2_score >= 45)
      );
      return {
        reply: validated.reply,
        s2Score: validated.s2_score,
        markers: validated.markers,
        evidence: validated.evidence,
        language: validated.language,
        nextQuestionId: validated.next_question_id,
        sentiment: validated.sentiment,
        distressDetected: isDistress,
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
  const temperature = process.env.LLM_TEMPERATURE
    ? parseFloat(process.env.LLM_TEMPERATURE)
    : 0.6;

  try {
    const userPrompt = buildUserPrompt(options.transcript, lang, options.history);
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
        temperature,
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
    const isDistress = Boolean(
      validated.distress_detected ||
      validated.s2_score >= 65 ||
      validated.markers.includes("hopelessness") ||
      (validated.sentiment === "negative" && validated.s2_score >= 45)
    );

    return {
      reply: validated.reply,
      s2Score: validated.s2_score,
      markers: validated.markers,
      evidence: validated.evidence,
      language: validated.language,
      nextQuestionId: validated.next_question_id,
      sentiment: validated.sentiment,
      distressDetected: isDistress,
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
