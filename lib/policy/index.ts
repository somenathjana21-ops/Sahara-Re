import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { z } from "zod";
import { Tier, TriggerSource } from "@/types/contract";

// ==========================================
// Policy Zod Validation Schemas
// ==========================================

export const EscalationConfigSchema = z.object({
  ack_required: z.boolean(),
  sla_minutes: z.number().int().min(0),
  immediate_resources: z.boolean().optional(),
});

export const ConditionSchema = z.object({
  change_point: z.boolean().optional(),
  composite_gte: z.number().min(0).max(100).optional(),
  s3_gte: z.number().min(0).max(100).optional(),
  z_gte: z.number().optional(),
  first_contact_composite_gte: z.number().min(0).max(100).optional(),
  missed_checkins_gte: z.number().int().min(0).optional(),
});

export const TierRuleSchema = z.object({
  // HARD INVARIANT: Policy CANNOT declare CRITICAL.
  // Critical can only be initiated by deterministic triggers (Pass 1, panic key, q3=4).
  tier: z.enum(["RED", "AMBER", "GREEN"]),
  any_of: z.array(ConditionSchema).optional(),
  default: z.boolean().optional(),
});

export const PolicyDefinitionSchema = z.object({
  version: z.string(),
  signed_by: z.string(),
  weights: z.object({
    s1_self_report: z.number().min(0).max(1),
    s2_linguistic: z.number().min(0).max(1),
    s3_case_context: z.number().min(0).max(1),
    s4_engagement: z.number().min(0).max(1),
    // HARD INVARIANT: S5 weight must strictly be 0.00
    s5_acoustic: z.literal(0),
  }),
  baseline: z.object({
    ewma_lambda: z.number().min(0).max(1),
    sigma_floor: z.number().min(0),
    change_point_z: z.number().min(0),
    min_history_for_change_point: z.number().int().min(1),
  }),
  tiers: z.array(TierRuleSchema),
  floors: z.object({
    model_may_lower_tier: z.literal(false),
    critical_requires_deterministic_trigger: z.literal(true),
  }),
  escalation: z.object({
    CRITICAL: EscalationConfigSchema,
    RED: EscalationConfigSchema,
    AMBER: EscalationConfigSchema,
    GREEN: EscalationConfigSchema,
  }),
});

export type PolicyDefinition = z.infer<typeof PolicyDefinitionSchema>;

// Tier severity rank mapping
const TIER_RANK: Record<Tier, number> = {
  GREEN: 0,
  AMBER: 1,
  RED: 2,
  CRITICAL: 3,
};

// ==========================================
// Policy Loader & Cache
// ==========================================

let cachedPolicy: PolicyDefinition | null = null;

export function parseAndValidatePolicy(yamlContent: string): PolicyDefinition {
  const parsed = yaml.parse(yamlContent);
  return PolicyDefinitionSchema.parse(parsed);
}

export function getActivePolicy(): PolicyDefinition {
  if (cachedPolicy) return cachedPolicy;

  const policyPath = path.resolve(process.cwd(), "policy", "v1.yaml");
  if (!fs.existsSync(policyPath)) {
    throw new Error(`Policy file not found at: ${policyPath}`);
  }

  const rawYaml = fs.readFileSync(policyPath, "utf-8");
  cachedPolicy = parseAndValidatePolicy(rawYaml);
  return cachedPolicy;
}

// ==========================================
// Policy Evaluator
// ==========================================

export interface DeterministicTriggerInput {
  tier: Tier;
  source: TriggerSource;
  reason?: string;
}

export interface EvaluatePolicyInput {
  composite: number;
  zScore: number | null;
  changePoint: boolean;
  s3Score: number;
  isFirstContact: boolean;
  missedCount: number;
  deterministicTrigger?: DeterministicTriggerInput | null;
}

export interface EvaluatePolicyResult {
  tier: Tier;
  triggerSource: TriggerSource;
  slaMinutes: number;
  ackRequired: boolean;
  immediateResources: boolean;
  policyVersion: string;
  matchedRules: string[];
  explanation: string[];
}

/**
 * Evaluates the distress state against the versioned policy and deterministic interlocks.
 *
 * Invariants:
 * 1. Policy CANNOT produce CRITICAL on its own.
 * 2. Deterministic triggers (Pass 1 lexicon, keypad 0, q3=4) cannot be lowered by policy or model.
 * 3. Tiers are evaluated top-down; first matching rule sets the policy candidate tier.
 */
export function evaluatePolicy(
  input: EvaluatePolicyInput,
  policy: PolicyDefinition = getActivePolicy()
): EvaluatePolicyResult {
  let policyTier: Tier = "GREEN";
  const matchedRules: string[] = [];
  const explanation: string[] = [];

  // Step 1: Evaluate top-to-bottom tier rules
  tierLoop: for (const rule of policy.tiers) {
    if (rule.default) {
      policyTier = rule.tier;
      matchedRules.push(`default_${rule.tier.toLowerCase()}`);
      explanation.push(`Assigned baseline ${rule.tier} tier (no higher threshold met)`);
      break;
    }

    if (rule.any_of) {
      for (const cond of rule.any_of) {
        if (cond.change_point && input.changePoint) {
          policyTier = rule.tier;
          matchedRules.push("change_point");
          explanation.push(
            `Matched rule: Sudden change point detected against personal baseline (z = ${input.zScore})`
          );
          break tierLoop;
        }

        if (
          typeof cond.composite_gte === "number" &&
          input.composite >= cond.composite_gte
        ) {
          policyTier = rule.tier;
          matchedRules.push(`composite_gte_${cond.composite_gte}`);
          explanation.push(
            `Matched rule: Composite distress (${input.composite}) >= threshold (${cond.composite_gte})`
          );
          break tierLoop;
        }

        if (typeof cond.s3_gte === "number" && input.s3Score >= cond.s3_gte) {
          policyTier = rule.tier;
          matchedRules.push(`s3_gte_${cond.s3_gte}`);
          explanation.push(
            `Matched rule: External case context pressure (${input.s3Score}) >= threshold (${cond.s3_gte})`
          );
          break tierLoop;
        }

        if (
          typeof cond.z_gte === "number" &&
          input.zScore !== null &&
          input.zScore >= cond.z_gte
        ) {
          policyTier = rule.tier;
          matchedRules.push(`z_gte_${cond.z_gte}`);
          explanation.push(
            `Matched rule: z-score (${input.zScore}) >= baseline threshold (${cond.z_gte})`
          );
          break tierLoop;
        }

        if (
          typeof cond.first_contact_composite_gte === "number" &&
          input.isFirstContact &&
          input.composite >= cond.first_contact_composite_gte
        ) {
          policyTier = rule.tier;
          matchedRules.push(`first_contact_composite_gte_${cond.first_contact_composite_gte}`);
          explanation.push(
            `Matched rule: First-contact composite (${input.composite}) >= first-contact threshold (${cond.first_contact_composite_gte})`
          );
          break tierLoop;
        }

        if (
          typeof cond.missed_checkins_gte === "number" &&
          input.missedCount >= cond.missed_checkins_gte
        ) {
          policyTier = rule.tier;
          matchedRules.push(`missed_checkins_gte_${cond.missed_checkins_gte}`);
          explanation.push(
            `Matched rule: Missed check-ins (${input.missedCount}) >= threshold (${cond.missed_checkins_gte})`
          );
          break tierLoop;
        }
      }
    }
  }

  // Step 2: Compare candidate tier with deterministic floor
  let finalTier: Tier = policyTier;
  let triggerSource: TriggerSource = "policy";

  if (input.deterministicTrigger) {
    const detTier = input.deterministicTrigger.tier;
    const detRank = TIER_RANK[detTier];
    const polRank = TIER_RANK[policyTier];

    if (detRank >= polRank) {
      finalTier = detTier;
      triggerSource = input.deterministicTrigger.source;
      explanation.unshift(
        `Deterministic trigger active (${input.deterministicTrigger.source}): locked to ${finalTier} tier`
      );
    } else {
      // Policy escalated higher than deterministic trigger
      finalTier = policyTier;
      triggerSource = "policy";
      explanation.unshift(
        `Policy evaluated higher (${finalTier}) than deterministic floor (${detTier})`
      );
    }
  }

  // Step 3: SLA & escalation configuration
  const escalationConfig = policy.escalation[finalTier];

  return {
    tier: finalTier,
    triggerSource,
    slaMinutes: escalationConfig.sla_minutes,
    ackRequired: escalationConfig.ack_required,
    immediateResources: Boolean(escalationConfig.immediate_resources),
    policyVersion: policy.version,
    matchedRules,
    explanation,
  };
}
