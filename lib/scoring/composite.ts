import {
  ComponentsBreakdown,
  ContributionsBreakdown,
  ComponentsBreakdownSchema,
  ContributionsBreakdownSchema,
} from "@/types/contract";

export interface ScoringWeights {
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  s5: 0;
}

export const BASE_WEIGHTS: ScoringWeights = {
  s1: 0.35,
  s2: 0.25,
  s3: 0.25,
  s4: 0.15,
  s5: 0,
};

export interface RawScores {
  s1: number | null;
  s2: number | null;
  s3: number;
  s4: number;
  s5?: number | null;
}

export interface CompositeDistressResult {
  composite: number;
  components: ComponentsBreakdown;
  contributions: ContributionsBreakdown;
  effectiveWeights: {
    s1: number;
    s2: number;
    s3: number;
    s4: number;
    s5: number;
  };
  presentSignals: string[];
  missingSignals: string[];
  explanation: string[];
}

/**
 * Computes composite distress with missing-signal renormalisation.
 *
 * Governing Formula:
 *   Composite = sum(W_effective[k] * S[k])
 *   W_effective[k] = W[k] / sum(W[j] for j in present)
 *
 * Invariants:
 * - A missing signal is NEVER replaced with 0 (missing signal != calm signal).
 * - S5 weight is STRICTLY locked to 0.00. Throws error if non-zero.
 * - S3 (Case Context) and S4 (Engagement) are always present.
 * - When S1 or S2 is null, remaining weights scale proportionally to maintain sum of 1.0.
 */
export function computeComposite(
  raw: RawScores,
  weights: Partial<ScoringWeights> = {}
): CompositeDistressResult {
  const mergedWeights = { ...BASE_WEIGHTS, ...weights };

  // Hard Invariant: S5 weight must strictly be 0.00
  if (mergedWeights.s5 !== 0) {
    throw new Error(
      `Violation of core invariant: S5 (acoustic) weight must be 0.00, received ${mergedWeights.s5}`
    );
  }

  // Validate bounds of present components
  if (typeof raw.s3 !== "number" || raw.s3 < 0 || raw.s3 > 100) {
    throw new Error(`S3 (case context) score must be between 0 and 100, received ${raw.s3}`);
  }
  if (typeof raw.s4 !== "number" || raw.s4 < 0 || raw.s4 > 100) {
    throw new Error(`S4 (engagement) score must be between 0 and 100, received ${raw.s4}`);
  }

  const presentSignals: string[] = [];
  const missingSignals: string[] = [];
  let weightDenominator = 0;

  // S1 presence
  const s1Present = raw.s1 !== null && raw.s1 !== undefined;
  if (s1Present) {
    presentSignals.push("s1");
    weightDenominator += mergedWeights.s1;
  } else {
    missingSignals.push("s1");
  }

  // S2 presence
  const s2Present = raw.s2 !== null && raw.s2 !== undefined;
  if (s2Present) {
    presentSignals.push("s2");
    weightDenominator += mergedWeights.s2;
  } else {
    missingSignals.push("s2");
  }

  // S3 is always present
  presentSignals.push("s3");
  weightDenominator += mergedWeights.s3;

  // S4 is always present
  presentSignals.push("s4");
  weightDenominator += mergedWeights.s4;

  // S5 presence (for display only; weight is 0)
  const s5Present = raw.s5 !== null && raw.s5 !== undefined;
  if (s5Present) {
    presentSignals.push("s5");
  } else {
    missingSignals.push("s5");
  }

  if (weightDenominator <= 0) {
    throw new Error("Cannot renormalise: total weight denominator is 0");
  }

  // Calculate effective weights
  const effW1 = s1Present ? mergedWeights.s1 / weightDenominator : 0;
  const effW2 = s2Present ? mergedWeights.s2 / weightDenominator : 0;
  const effW3 = mergedWeights.s3 / weightDenominator;
  const effW4 = mergedWeights.s4 / weightDenominator;
  const effW5 = 0;

  // Calculate point contributions
  const c1 = s1Present ? effW1 * (raw.s1 as number) : 0;
  const c2 = s2Present ? effW2 * (raw.s2 as number) : 0;
  const c3 = effW3 * raw.s3;
  const c4 = effW4 * raw.s4;
  const c5 = 0 as const;

  const rawComposite = c1 + c2 + c3 + c4;
  const composite = Math.round(rawComposite * 100) / 100;

  const components: ComponentsBreakdown = {
    s1: s1Present ? Math.round((raw.s1 as number) * 100) / 100 : null,
    s2: s2Present ? Math.round((raw.s2 as number) * 100) / 100 : null,
    s3: Math.round(raw.s3 * 100) / 100,
    s4: Math.round(raw.s4 * 100) / 100,
    s5: s5Present ? Math.round((raw.s5 as number) * 100) / 100 : null,
  };

  const contributions: ContributionsBreakdown = {
    s1: Math.round(c1 * 100) / 100,
    s2: Math.round(c2 * 100) / 100,
    s3: Math.round(c3 * 100) / 100,
    s4: Math.round(c4 * 100) / 100,
    s5: 0,
  };

  // Validate output schemas
  ComponentsBreakdownSchema.parse(components);
  ContributionsBreakdownSchema.parse(contributions);

  const explanation: string[] = [
    `Composite distress: ${composite.toFixed(2)} / 100`,
    `Component contributions: S3 case context (${contributions.s3.toFixed(2)} pts), S1 self-report (${contributions.s1.toFixed(2)} pts), S2 linguistic (${contributions.s2.toFixed(2)} pts), S4 engagement (${contributions.s4.toFixed(2)} pts)`,
  ];

  if (missingSignals.includes("s2")) {
    explanation.push(
      "Missing linguistic distress (S2) renormalised across S1, S3, and S4 to prevent false calm signal"
    );
  }
  if (missingSignals.includes("s1")) {
    explanation.push(
      "Missing structured self-report (S1) renormalised across remaining components"
    );
  }

  return {
    composite,
    components,
    contributions,
    effectiveWeights: {
      s1: Number(effW1.toFixed(4)),
      s2: Number(effW2.toFixed(4)),
      s3: Number(effW3.toFixed(4)),
      s4: Number(effW4.toFixed(4)),
      s5: 0,
    },
    presentSignals,
    missingSignals,
    explanation,
  };
}
