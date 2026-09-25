import { AudioMetrics } from "@/types/contract";

export interface S5Result {
  score: number | null;
  confidence: "low" | "none";
  caveat: string;
  weight: 0;
  features: {
    pitchVariabilityPct?: number;
    speechRateDeviationPct?: number;
    pauseRatioPct?: number;
  };
}

export const S5_WEIGHT = 0.0 as const;

export const S5_CAVEAT =
  "Low confidence. Acoustic inference is unreliable across accent, dialect and line quality; shown for context only and contributes 0.00 to the composite.";

/**
 * Computes S5 (Acoustic / Paralinguistic Metric).
 *
 * Invariants:
 * - Weight is STRICTLY locked to 0.00.
 * - Used exclusively for informational context in the counsellor dashboard.
 * - Acoustic emotion inference degrades heavily across Indian regional accents,
 *   code-switching, and compressed telephony lines, which would otherwise disproportionately
 *   bias against the most vulnerable populations.
 */
export function computeS5(metrics?: AudioMetrics | null): S5Result {
  if (!metrics) {
    return {
      score: null,
      confidence: "none",
      caveat: S5_CAVEAT,
      weight: 0,
      features: {},
    };
  }

  const values: number[] = [];
  const features: S5Result["features"] = {};

  if (typeof metrics.pitchVariabilityPct === "number" && !isNaN(metrics.pitchVariabilityPct)) {
    const clamped = Math.min(100, Math.max(0, metrics.pitchVariabilityPct));
    values.push(clamped);
    features.pitchVariabilityPct = clamped;
  }

  if (typeof metrics.speechRateDeviationPct === "number" && !isNaN(metrics.speechRateDeviationPct)) {
    const clamped = Math.min(100, Math.max(0, metrics.speechRateDeviationPct));
    values.push(clamped);
    features.speechRateDeviationPct = clamped;
  }

  if (typeof metrics.pauseRatioPct === "number" && !isNaN(metrics.pauseRatioPct)) {
    const clamped = Math.min(100, Math.max(0, metrics.pauseRatioPct));
    values.push(clamped);
    features.pauseRatioPct = clamped;
  }

  if (values.length === 0) {
    return {
      score: null,
      confidence: "none",
      caveat: S5_CAVEAT,
      weight: 0,
      features: {},
    };
  }

  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const score = Math.round(mean * 100) / 100;

  return {
    score,
    confidence: "low",
    caveat: S5_CAVEAT,
    weight: 0,
    features,
  };
}
