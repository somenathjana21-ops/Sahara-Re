export interface BaselineParameters {
  ewmaLambda: number;
  sigmaFloor: number;
  changePointZ: number;
  minHistoryForChangePoint: number;
}

export const DEFAULT_BASELINE_CONFIG: BaselineParameters = {
  ewmaLambda: 0.3,
  sigmaFloor: 8.0,
  changePointZ: 2.0,
  minHistoryForChangePoint: 2,
};

export interface PriorBaselineState {
  baseline_mean: number | null;
  baseline_var: number | null;
  checkin_count: number;
}

export interface BaselineEvaluationResult {
  zScore: number | null;
  rawZScore: number | null;
  changePoint: boolean;
  newBaselineMean: number;
  newBaselineVar: number;
  newCheckinCount: number;
  isFirstContact: boolean;
  priorMean: number | null;
  priorVar: number | null;
  effectiveSigma: number | null;
  explanation: string[];
}

/**
 * Evaluates dynamic personal distress baseline using EWMA and change-point detection.
 *
 * CRITICAL ORDER OF OPERATIONS:
 * 1. Compute z_t BEFORE updating running baseline parameters.
 *    (Measuring against prior baseline preserves anomaly magnitude).
 * 2. Update baseline running mean (mu_t) and variance (sigma_t^2).
 * 3. Evaluate change point: z_t > change_point_z AND history_count >= min_history.
 *
 * First-Contact Semantics:
 * When history_count === 0 or baseline_mean is null, z_t is undefined (null).
 * The current composite initializes the baseline: mu_0 = x_0, sigma_0^2 = 0.
 */
export function evaluateBaseline(
  currentComposite: number,
  priorState: PriorBaselineState,
  config: Partial<BaselineParameters> = {}
): BaselineEvaluationResult {
  const cfg = { ...DEFAULT_BASELINE_CONFIG, ...config };
  const historyCount = priorState.checkin_count || 0;
  const isFirstContact = historyCount === 0 || priorState.baseline_mean === null;

  if (isFirstContact) {
    const newMean = Math.round(currentComposite * 100) / 100;
    return {
      zScore: null,
      rawZScore: null,
      changePoint: false,
      newBaselineMean: newMean,
      newBaselineVar: 0,
      newCheckinCount: 1,
      isFirstContact: true,
      priorMean: null,
      priorVar: null,
      effectiveSigma: null,
      explanation: [
        `First check-in: established initial personal baseline mean at ${newMean.toFixed(2)}`,
        "z-score undefined on first contact (requires historical reference points)",
      ],
    };
  }

  const priorMean = priorState.baseline_mean as number;
  const priorVar = Math.max(0, priorState.baseline_var ?? 0);
  const trueSigma = Math.sqrt(priorVar);
  const effectiveSigma = Math.max(trueSigma, cfg.sigmaFloor);

function roundPrecision(val: number, decimals: number = 2): number {
  return Number(Math.round(Number(val + "e+" + decimals)) + "e-" + decimals);
}

  // STEP 1: Compute z-Score STRICTLY BEFORE updating baseline parameters
  const rawZ = (currentComposite - priorMean) / effectiveSigma;
  const zScore = roundPrecision(rawZ, 2);

  // STEP 2: Update EWMA running mean and variance
  // mu_t = lambda * x_t + (1 - lambda) * mu_(t-1)
  const updatedMean = cfg.ewmaLambda * currentComposite + (1 - cfg.ewmaLambda) * priorMean;
  // sigma^2_t = lambda * (x_t - mu_(t-1))^2 + (1 - lambda) * sigma^2_(t-1)
  const updatedVar =
    cfg.ewmaLambda * Math.pow(currentComposite - priorMean, 2) + (1 - cfg.ewmaLambda) * priorVar;

  const newBaselineMean = roundPrecision(updatedMean, 2);
  const newBaselineVar = roundPrecision(updatedVar, 2);
  const newCheckinCount = historyCount + 1;

  // STEP 3: Change Point Trigger
  // Requires both significant deviation (z > 2.0) and established history (>= 2 prior check-ins)
  const changePoint = zScore > cfg.changePointZ && historyCount >= cfg.minHistoryForChangePoint;

  const explanation: string[] = [
    `Personal baseline comparison: prior mean = ${priorMean.toFixed(2)}, effective sigma = ${effectiveSigma.toFixed(2)} (noise floor = ${cfg.sigmaFloor})`,
    `Computed z-score = ${zScore.toFixed(2)} (deviation: ${(currentComposite - priorMean).toFixed(2)} pts)`,
  ];

  if (changePoint) {
    explanation.push(
      `CHANGE POINT DETECTED: z-score (${zScore.toFixed(2)}) exceeds threshold (${cfg.changePointZ}) with ${historyCount} historical sessions`
    );
  } else if (historyCount < cfg.minHistoryForChangePoint) {
    explanation.push(
      `Baseline accumulating (${historyCount}/${cfg.minHistoryForChangePoint} required for change-point evaluation)`
    );
  }

  return {
    zScore,
    rawZScore: rawZ,
    changePoint,
    newBaselineMean,
    newBaselineVar,
    newCheckinCount,
    isFirstContact: false,
    priorMean,
    priorVar,
    effectiveSigma,
    explanation,
  };
}
