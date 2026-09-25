import { describe, it } from "node:test";
import assert from "node:assert";
import {
  computeS1,
  computeS2,
  computeS3,
  computeS4,
  computeS5,
  computeComposite,
  evaluateBaseline,
} from "@/lib/scoring";
import {
  getActivePolicy,
  evaluatePolicy,
  parseAndValidatePolicy,
} from "@/lib/policy";
import { analyzeTranscript } from "@/lib/llm";
import { PERSON_A4471, CASE_A4471 } from "@/scripts/fixtures";
import { CaseRecord } from "@/types/contract";

describe("Phase 3: S1 Self-Report Scoring", () => {
  it("should calculate S1 normalized to 0-100 across 3 answered questions", () => {
    // q1=2, q2=2, q3=2 -> sum=6 / 12 -> 50.00
    const res = computeS1({ q1: 2, q2: 2, q3: 2 });
    assert.strictEqual(res.score, 50);
    assert.strictEqual(res.answeredCount, 3);
    assert.strictEqual(res.criticalTrigger, false);
  });

  it("should renormalise S1 over actually answered questions", () => {
    // q1=3, q2=1, q3 omitted -> sum=4 / 8 -> 50.00
    const res = computeS1({ q1: 3, q2: 1 });
    assert.strictEqual(res.score, 50);
    assert.strictEqual(res.answeredCount, 2);
    assert.strictEqual(res.criticalTrigger, false);
  });

  it("should return null for S1 when 0 questions are answered (missing != calm)", () => {
    const res1 = computeS1({});
    assert.strictEqual(res1.score, null);
    assert.strictEqual(res1.answeredCount, 0);

    const res2 = computeS1(null);
    assert.strictEqual(res2.score, null);
    assert.strictEqual(res2.answeredCount, 0);
  });

  it("should fire deterministic CRITICAL trigger when q3 === 4 ('Do you feel safe? No')", () => {
    const res = computeS1({ q1: 1, q2: 1, q3: 4 });
    assert.strictEqual(res.criticalTrigger, true);
    assert.strictEqual(res.triggerSource, "self_report_q3");
  });

  it("should fire CRITICAL on q3 === 4 even if q1 and q2 are omitted", () => {
    const res = computeS1({ q3: 4 });
    assert.strictEqual(res.criticalTrigger, true);
    assert.strictEqual(res.triggerSource, "self_report_q3");
    assert.strictEqual(res.score, 100);
  });
});

describe("Phase 3: S2 Linguistic Distress Scoring", () => {
  it("should validate and format valid S2 scores in [0, 100]", () => {
    const res = computeS2(55);
    assert.strictEqual(res.score, 55);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.confidence, "high");
  });

  it("should return null when S2 is null or undefined (never default to 0)", () => {
    const resNull = computeS2(null);
    assert.strictEqual(resNull.score, null);
    assert.strictEqual(resNull.valid, true);

    const resUndef = computeS2(undefined);
    assert.strictEqual(resUndef.score, null);
    assert.strictEqual(resUndef.valid, true);
  });

  it("should return null and mark invalid when S2 is out of bounds", () => {
    const resNeg = computeS2(-5);
    assert.strictEqual(resNeg.score, null);
    assert.strictEqual(resNeg.valid, false);

    const resOver = computeS2(105);
    assert.strictEqual(resOver.score, null);
    assert.strictEqual(resOver.valid, false);
  });
});

describe("Phase 3: S3 Deterministic Case Context Scoring", () => {
  const referenceDate = new Date();

  it("should compute exact 50 static standing points for A-4471 base docket", () => {
    const baseCase: CaseRecord = {
      ...CASE_A4471,
      last_intimidation_report: null, // Clear time-windowed events
      next_hearing_date: null,
    };

    const res = computeS3(baseCase, referenceDate);
    assert.strictEqual(res.standingPoints, 50, "Standing points must equal 50");
    assert.strictEqual(res.timeWindowedPoints, 0);
    assert.strictEqual(res.score, 50);
  });

  it("should compute exact 90 points on Day 0 for A-4471 with calendar events", () => {
    // CASE_A4471 has:
    // Standing: bail (+20), relief overdue 62d (+15), adjournments 4 (+10), open 400d (+5) = 50
    // Time-windowed: intimidation 1d ago (+25), hearing 6d ahead (+15) = 40
    // Total: 90
    const res = computeS3(CASE_A4471, referenceDate);
    assert.strictEqual(res.standingPoints, 50);
    assert.strictEqual(res.timeWindowedPoints, 40);
    assert.strictEqual(res.score, 90);
    assert.strictEqual(res.capped, false);
  });

  it("should include social boycott flag (+10) and cap at 100", () => {
    const overloadedCase: CaseRecord = {
      ...CASE_A4471,
      social_boycott_flag: true, // +10 -> total 100
      adjournment_count: 5,
    };
    const res = computeS3(overloadedCase, referenceDate);
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.totalPoints, 100);
  });
});

describe("Phase 3: S4 Engagement Monotonicity Scoring", () => {
  it("should score missed check-ins monotonically (1->25, 2->50, 3+->75)", () => {
    assert.strictEqual(computeS4({ missedCount: 0 }).score, 0);
    assert.strictEqual(computeS4({ missedCount: 1 }).score, 25);
    assert.strictEqual(computeS4({ missedCount: 2 }).score, 50);
    assert.strictEqual(computeS4({ missedCount: 3 }).score, 75);
    assert.strictEqual(computeS4({ missedCount: 5 }).score, 75);
  });

  it("should add +20 for mid-flow abandonment and +15 for 3x median latency", () => {
    const res = computeS4({
      missedCount: 1, // 25
      abandoned: true, // +20
      latencyMs: 12000,
      medianLatencyMs: 3000, // 12000 > 3*3000 -> +15
    });
    assert.strictEqual(res.score, 60);
  });

  it("should preserve prior S4 floor (monotonically non-decreasing invariant)", () => {
    const res = computeS4({
      missedCount: 0,
      abandoned: false,
      priorS4: 50, // Historical floor
    });
    assert.strictEqual(res.score, 50, "S4 must never decrease below prior floor");
  });
});

describe("Phase 3: S5 Paralinguistic Metric & Pinned Zero Weight", () => {
  it("should compute mean acoustic metrics with low-confidence caveat", () => {
    const res = computeS5({
      pitchVariabilityPct: 60,
      speechRateDeviationPct: 40,
      pauseRatioPct: 50,
    });
    assert.strictEqual(res.score, 50);
    assert.strictEqual(res.confidence, "low");
    assert.strictEqual(res.weight, 0);
    assert.ok(res.caveat.includes("Low confidence"));
    assert.ok(res.caveat.includes("contributes 0.00"));
  });

  it("should return null for chat channels without audio", () => {
    const res = computeS5(null);
    assert.strictEqual(res.score, null);
    assert.strictEqual(res.confidence, "none");
    assert.strictEqual(res.weight, 0);
  });
});

describe("Phase 3: Composite Scoring & Missing Signal Renormalisation", () => {
  it("Golden Path Day 0: S1=50, S2=55, S3=90, S4=0 -> Composite=53.75 with exact contributions", () => {
    const result = computeComposite({
      s1: 50,
      s2: 55,
      s3: 90,
      s4: 0,
      s5: null,
    });

    // Exact component contributions:
    // S1: 0.35 * 50 = 17.50
    // S2: 0.25 * 55 = 13.75
    // S3: 0.25 * 90 = 22.50
    // S4: 0.15 * 0  = 0.00
    // S5: 0.00      = 0.00
    assert.strictEqual(result.contributions.s1, 17.5);
    assert.strictEqual(result.contributions.s2, 13.75);
    assert.strictEqual(result.contributions.s3, 22.5);
    assert.strictEqual(result.contributions.s4, 0);
    assert.strictEqual(result.contributions.s5, 0);

    // Sum: 17.50 + 13.75 + 22.50 + 0 = 53.75
    assert.strictEqual(result.composite, 53.75);
    assert.deepStrictEqual(result.presentSignals, ["s1", "s2", "s3", "s4"]);
    assert.deepStrictEqual(result.missingSignals, ["s5"]);
  });

  it("should renormalise over S1, S3, S4 when S2 is null without throwing", () => {
    // Denominator = 0.35 + 0.25 + 0.15 = 0.75
    // Eff weights: S1 = 0.35/0.75 = 7/15, S3 = 0.25/0.75 = 1/3, S4 = 0.15/0.75 = 1/5
    const result = computeComposite({
      s1: 50,
      s2: null, // S2 provider down
      s3: 90,
      s4: 0,
    });

    const expectedS1Contrib = Math.round((50 * (0.35 / 0.75)) * 100) / 100; // 23.33
    const expectedS3Contrib = Math.round((90 * (0.25 / 0.75)) * 100) / 100; // 30.00
    const expectedComposite = Math.round((expectedS1Contrib + expectedS3Contrib) * 100) / 100; // 53.33

    assert.strictEqual(result.components.s2, null);
    assert.strictEqual(result.contributions.s2, 0);
    assert.strictEqual(result.contributions.s1, expectedS1Contrib);
    assert.strictEqual(result.contributions.s3, expectedS3Contrib);
    assert.strictEqual(result.composite, expectedComposite);
    assert.ok(result.missingSignals.includes("s2"));
  });

  it("should throw error if S5 weight is configured above 0.00", () => {
    assert.throws(
      () => {
        // @ts-expect-error Intentionally testing violation of literal(0) invariant
        computeComposite({ s1: 50, s2: 50, s3: 50, s4: 0 }, { s5: 0.1 });
      },
      /Violation of core invariant: S5 \(acoustic\) weight must be 0.00/
    );
  });
});

describe("Phase 3: Dynamic EWMA Baseline & Change-Point Algorithm", () => {
  it("should initialise baseline on first contact (z undefined)", () => {
    const firstContact = evaluateBaseline(42.0, {
      baseline_mean: null,
      baseline_var: null,
      checkin_count: 0,
    });

    assert.strictEqual(firstContact.isFirstContact, true);
    assert.strictEqual(firstContact.zScore, null);
    assert.strictEqual(firstContact.changePoint, false);
    assert.strictEqual(firstContact.newBaselineMean, 42.0);
    assert.strictEqual(firstContact.newBaselineVar, 0);
    assert.strictEqual(firstContact.newCheckinCount, 1);
  });

  it("Golden Path Day 0: z=3.11 with mu_1=28.90, var=2.70 (sigma floored to 8) triggers change_point=true", () => {
    // Persona A-4471 prior state:
    // mean = 28.90, var = 2.70, checkin_count = 2
    // Composite = 53.75
    // true sigma = sqrt(2.7) = 1.64 -> floored to 8
    // z = (53.75 - 28.90) / 8 = 24.85 / 8 = 3.10625 -> 3.11
    // z > 2.0 && history >= 2 -> changePoint = true
    const result = evaluateBaseline(53.75, {
      baseline_mean: PERSON_A4471.baseline_mean,
      baseline_var: PERSON_A4471.baseline_var,
      checkin_count: PERSON_A4471.checkin_count,
    });

    assert.strictEqual(result.zScore, 3.11);
    assert.strictEqual(result.changePoint, true);
    assert.strictEqual(result.effectiveSigma, 8.0);
    assert.strictEqual(result.newCheckinCount, 3);

    // Verify baseline was updated:
    // mu_2 = 0.3 * 53.75 + 0.7 * 28.90 = 16.125 + 20.23 = 36.355 -> 36.36
    assert.strictEqual(result.newBaselineMean, 36.36);
  });

  it("Order of Operations: z-score must be evaluated BEFORE updating baseline", () => {
    // If baseline were updated first:
    // updatedMean = 36.36
    // z would be (53.75 - 36.36)/8 = 2.17 instead of 3.11
    const result = evaluateBaseline(53.75, {
      baseline_mean: 28.9,
      baseline_var: 2.7,
      checkin_count: 2,
    });

    assert.strictEqual(result.zScore, 3.11, "z-score must be computed strictly prior to updating mu");
  });
});

describe("Phase 3: Policy Engine & Tier Assignment", () => {
  it("should load and parse policy/v1.yaml successfully", () => {
    const policy = getActivePolicy();
    assert.strictEqual(policy.version, "1.1.0");
    assert.strictEqual(policy.weights.s5_acoustic, 0);
    assert.strictEqual(policy.floors.model_may_lower_tier, false);
    assert.strictEqual(policy.floors.critical_requires_deterministic_trigger, true);
  });

  it("Golden Path Day 0: assign RED tier on change_point=true and S3=90 (SLA 30 min, ack required)", () => {
    const evalResult = evaluatePolicy({
      composite: 53.75,
      zScore: 3.11,
      changePoint: true,
      s3Score: 90,
      isFirstContact: false,
      missedCount: 0,
      deterministicTrigger: null,
    });

    assert.strictEqual(evalResult.tier, "RED");
    assert.strictEqual(evalResult.triggerSource, "policy");
    assert.strictEqual(evalResult.slaMinutes, 30);
    assert.strictEqual(evalResult.ackRequired, true);
    assert.ok(evalResult.matchedRules.includes("change_point"));
  });

  it("should assign AMBER tier on composite >= 45 or z >= 1.2 or first contact >= 60", () => {
    const resAmberComp = evaluatePolicy({
      composite: 46.0,
      zScore: 0.5,
      changePoint: false,
      s3Score: 30,
      isFirstContact: false,
      missedCount: 0,
    });
    assert.strictEqual(resAmberComp.tier, "AMBER");

    const resAmberZ = evaluatePolicy({
      composite: 35.0,
      zScore: 1.3,
      changePoint: false,
      s3Score: 20,
      isFirstContact: false,
      missedCount: 0,
    });
    assert.strictEqual(resAmberZ.tier, "AMBER");

    const resFirstContact = evaluatePolicy({
      composite: 62.0,
      zScore: null,
      changePoint: false,
      s3Score: 30,
      isFirstContact: true,
      missedCount: 0,
    });
    assert.strictEqual(resFirstContact.tier, "AMBER");
  });

  it("should assign GREEN tier default when no elevated conditions are met", () => {
    const res = evaluatePolicy({
      composite: 25.0,
      zScore: 0.2,
      changePoint: false,
      s3Score: 20,
      isFirstContact: false,
      missedCount: 0,
    });
    assert.strictEqual(res.tier, "GREEN");
    assert.strictEqual(res.slaMinutes, 10080); // 7 days
    assert.strictEqual(res.ackRequired, false);
  });

  it("Invariant: deterministic trigger CRITICAL cannot be lowered by policy", () => {
    const res = evaluatePolicy({
      composite: 20.0, // Low calm score
      zScore: 0.1,
      changePoint: false,
      s3Score: 10,
      isFirstContact: false,
      missedCount: 0,
      deterministicTrigger: {
        tier: "CRITICAL",
        source: "lexicon",
        reason: "Pass 1 regex match",
      },
    });

    assert.strictEqual(res.tier, "CRITICAL");
    assert.strictEqual(res.triggerSource, "lexicon");
    assert.strictEqual(res.slaMinutes, 0);
    assert.strictEqual(res.immediateResources, true);
  });

  it("Invariant: YAML policy declaring CRITICAL tier rule fails Zod validation", () => {
    const invalidYaml = `
version: "1.1.0"
signed_by: "test"
weights: { s1_self_report: 0.35, s2_linguistic: 0.25, s3_case_context: 0.25, s4_engagement: 0.15, s5_acoustic: 0.00 }
baseline: { ewma_lambda: 0.3, sigma_floor: 8, change_point_z: 2.0, min_history_for_change_point: 2 }
tiers:
  - tier: CRITICAL # FORBIDDEN: policy cannot originate CRITICAL
    any_of: [{ composite_gte: 90 }]
floors: { model_may_lower_tier: false, critical_requires_deterministic_trigger: true }
escalation:
  CRITICAL: { ack_required: true, sla_minutes: 0 }
  RED: { ack_required: true, sla_minutes: 30 }
  AMBER: { ack_required: false, sla_minutes: 1440 }
  GREEN: { ack_required: false, sla_minutes: 10080 }
`;
    assert.throws(() => {
      parseAndValidatePolicy(invalidYaml);
    });
  });

  it("Invariant: YAML policy with non-zero S5 weight fails Zod validation", () => {
    const invalidYaml = `
version: "1.1.0"
signed_by: "test"
weights: { s1_self_report: 0.35, s2_linguistic: 0.25, s3_case_context: 0.25, s4_engagement: 0.15, s5_acoustic: 0.05 } # INVALID
baseline: { ewma_lambda: 0.3, sigma_floor: 8, change_point_z: 2.0, min_history_for_change_point: 2 }
tiers:
  - tier: RED
    any_of: [{ composite_gte: 70 }]
  - tier: GREEN
    default: true
floors: { model_may_lower_tier: false, critical_requires_deterministic_trigger: true }
escalation:
  CRITICAL: { ack_required: true, sla_minutes: 0 }
  RED: { ack_required: true, sla_minutes: 30 }
  AMBER: { ack_required: false, sla_minutes: 1440 }
  GREEN: { ack_required: false, sla_minutes: 10080 }
`;
    assert.throws(() => {
      parseAndValidatePolicy(invalidYaml);
    });
  });
});

describe("Phase 3: LLM Adapter & Graceful Degradation", () => {
  it("should return valid output and S2=55 for Golden Path distress transcript in mock mode", async () => {
    const result = await analyzeTranscript({
      transcript: "neend bilkul nahi aa rahi hai, dar lag raha hai sunwai se pehle",
      language: "hi",
    });

    assert.strictEqual(result.s2Score, 55);
    assert.strictEqual(result.language, "hi");
    assert.ok(result.reply);
    assert.ok(result.markers.includes("fear"));
    assert.ok(result.modelVersion.startsWith("mock:"));
  });

  it("should return low S2 score for calm neutral transcript", async () => {
    const result = await analyzeTranscript({
      transcript: "sab theek hai abhi, koi pareshani nahi hai",
      language: "hi",
    });

    assert.strictEqual(result.s2Score, 15);
    assert.strictEqual(result.language, "hi");
    assert.ok(result.reply);
  });

  it("should gracefully degrade to s2Score=null on unknown provider or failure without throwing", async () => {
    const originalProvider = process.env.LLM_PROVIDER;
    try {
      process.env.LLM_PROVIDER = "non_existent_provider";
      const result = await analyzeTranscript({
        transcript: "testing degradation",
        language: "en",
      });

      assert.strictEqual(result.s2Score, null);
      assert.strictEqual(result.reply, null);
      assert.ok(result.error);
    } finally {
      process.env.LLM_PROVIDER = originalProvider;
    }
  });
});
