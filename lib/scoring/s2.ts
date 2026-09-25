export interface S2Result {
  score: number | null;
  confidence: "high" | "none";
  valid: boolean;
  explanation: string;
}

/**
 * Validates and extracts S2 (Linguistic Distress Score).
 *
 * Invariants:
 * - Bounds: 0 to 100 inclusive.
 * - Missing or failed LLM signal MUST return score = null, NEVER 0.
 * - A missing signal is not a calm signal.
 */
export function computeS2(s2Score?: number | null): S2Result {
  if (s2Score === null || s2Score === undefined) {
    return {
      score: null,
      confidence: "none",
      valid: true,
      explanation: "Linguistic distress score unavailable (omitted or degraded)",
    };
  }

  if (typeof s2Score !== "number" || isNaN(s2Score)) {
    return {
      score: null,
      confidence: "none",
      valid: false,
      explanation: "Invalid S2 score: not a valid number",
    };
  }

  if (s2Score < 0 || s2Score > 100) {
    return {
      score: null,
      confidence: "none",
      valid: false,
      explanation: `Invalid S2 score: out of bounds [0, 100] (received ${s2Score})`,
    };
  }

  const score = Math.round(s2Score * 100) / 100;
  return {
    score,
    confidence: "high",
    valid: true,
    explanation: `S2 linguistic distress score: ${score}/100`,
  };
}
