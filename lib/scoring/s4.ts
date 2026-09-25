export interface S4Input {
  missedCount?: number;
  abandoned?: boolean;
  highLatency?: boolean;
  latencyMs?: number;
  medianLatencyMs?: number;
  priorS4?: number;
}

export interface S4Result {
  score: number;
  reasons: string[];
  missedPoints: number;
  abandonedPoints: number;
  latencyPoints: number;
}

/**
 * Computes S4 (Engagement Monotonicity Score).
 *
 * Invariants:
 * - S4 CAN ONLY INCREASE. Silence never lowers score.
 * - Non-response is not treated as recovery (could be phone loss, intimidation, or crisis).
 *
 * Scoring Rubric:
 * - 1 missed scheduled check-in: +25
 * - 2 missed: +50
 * - 3+ missed: +75 (and forces minimum tier Amber in policy)
 * - Call/chat abandoned mid-flow: +20
 * - Response latency > 3x person's own median: +15
 * - Capped at 100.
 */
export function computeS4(input: S4Input = {}): S4Result {
  const reasons: string[] = [];
  let missedPoints = 0;
  let abandonedPoints = 0;
  let latencyPoints = 0;

  const missed = input.missedCount || 0;
  if (missed >= 3) {
    missedPoints = 75;
    reasons.push(`3+ missed check-ins recorded (${missed}) (+75)`);
  } else if (missed === 2) {
    missedPoints = 50;
    reasons.push("2 consecutive missed check-ins recorded (+50)");
  } else if (missed === 1) {
    missedPoints = 25;
    reasons.push("1 missed check-in recorded (+25)");
  }

  if (input.abandoned) {
    abandonedPoints = 20;
    reasons.push("Check-in abandoned mid-interaction (+20)");
  }

  const isHighLatency =
    input.highLatency ||
    (typeof input.latencyMs === "number" &&
      typeof input.medianLatencyMs === "number" &&
      input.medianLatencyMs > 0 &&
      input.latencyMs > 3 * input.medianLatencyMs);

  if (isHighLatency) {
    latencyPoints = 15;
    reasons.push("Interaction latency exceeded 3x historical median (+15)");
  }

  let totalPoints = missedPoints + abandonedPoints + latencyPoints;

  // Enforce monotonicity: S4 can never decrease below prior S4
  if (typeof input.priorS4 === "number" && input.priorS4 > totalPoints) {
    totalPoints = input.priorS4;
    reasons.push(`Engagement score preserved at historical floor (${input.priorS4})`);
  }

  const score = Math.min(100, Math.max(0, totalPoints));

  return {
    score,
    reasons,
    missedPoints,
    abandonedPoints,
    latencyPoints,
  };
}
