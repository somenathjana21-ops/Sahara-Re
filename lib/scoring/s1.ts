import { StructuredCheckin } from "@/types/contract";

export interface S1Result {
  score: number | null;
  answeredCount: number;
  criticalTrigger: boolean;
  triggerSource?: "self_report_q3";
  explanation?: string;
}

/**
 * Computes S1 (Self-Report Distress Score) from structured questions q1, q2, q3.
 *
 * Formula:
 *   S1 = (sum of answered questions) / (answered_count * 4) * 100
 *
 * Invariants:
 * - Each question is on a 0-4 scale.
 * - Renormalises strictly over answered questions.
 * - Returns score: null if 0 questions were answered (missing signal != calm signal).
 * - If q3 === 4 ("Do you feel safe right now? No"), flags criticalTrigger = true
 *   with triggerSource = "self_report_q3".
 */
export function computeS1(structured?: StructuredCheckin | null): S1Result {
  if (!structured) {
    return {
      score: null,
      answeredCount: 0,
      criticalTrigger: false,
    };
  }

  const validQuestions = ["q1", "q2", "q3"] as const;
  const answered: number[] = [];

  for (const q of validQuestions) {
    const val = structured[q];
    if (typeof val === "number" && !isNaN(val) && val >= 0 && val <= 4) {
      answered.push(val);
    }
  }

  // Safety trigger: q3 === 4 indicates immediate subjective danger / lack of safety
  const criticalTrigger = structured.q3 === 4;

  if (answered.length === 0) {
    return {
      score: null,
      answeredCount: 0,
      criticalTrigger,
      triggerSource: criticalTrigger ? "self_report_q3" : undefined,
      explanation: criticalTrigger
        ? "Deterministic crisis trigger: q3 answered unsafe (4)"
        : "No structured self-report questions answered",
    };
  }

  const sum = answered.reduce((acc, v) => acc + v, 0);
  const maxPossible = answered.length * 4;
  const rawScore = (sum / maxPossible) * 100;
  const score = Math.round(rawScore * 100) / 100;

  return {
    score,
    answeredCount: answered.length,
    criticalTrigger,
    triggerSource: criticalTrigger ? "self_report_q3" : undefined,
    explanation: criticalTrigger
      ? `S1 self-report: ${score}/100 across ${answered.length} questions; CRITICAL trigger on q3=4`
      : `S1 self-report: ${score}/100 across ${answered.length} answered question(s)`,
  };
}
