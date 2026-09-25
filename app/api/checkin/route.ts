import { NextRequest, NextResponse } from "next/server";
import {
  CheckInRequestSchema,
  CheckInResponse,
  TriggerSource,
} from "@/types/contract";
import { getRepository } from "@/lib/db/repository";
import { checkInput, checkOutput } from "@/lib/safety/interlock";
import { CRISIS_RESOURCES, getStaticReply } from "@/lib/safety/replies";
import { analyzeTranscript, LLMAnalysisResult } from "@/lib/llm";
import {
  computeS1,
  computeS2,
  computeS3,
  computeS4,
  computeS5,
  computeComposite,
  evaluateBaseline,
} from "@/lib/scoring";
import { evaluatePolicy, DeterministicTriggerInput } from "@/lib/policy";

/**
 * PROJECT SAHARA — Core API Ingestion Pipeline (POST /api/checkin)
 *
 * 10-Step Pipeline Execution:
 * 1. Contract Validation (Zod schema)
 * 2. Consent Gate (403 Forbidden, 0 rows written if no active consent)
 * 3. Minor Check (Safe caseworker routing, 0 scoring/assessment rows written)
 * 4. Pass 1 Interlock & Panic Key (Instant CRITICAL, synchronous helplines, LLM bypassed)
 * 5. Boxed LLM Invocation (Single acknowledgment + single question, S2 score)
 * 6. Pass 2 Interlock (Sanitizes clinical advice, diagnoses, promises, and false reassurance)
 * 7. Scoring Engine (S1..S5 + missing signal renormalisation)
 * 8. EWMA Baseline & Change-Point (z_t evaluated strictly BEFORE updating baseline)
 * 9. Policy Engine (Versioned YAML rules; assigns GREEN/AMBER/RED/CRITICAL)
 * 10. Persistence & Alerts (checkin, assessment, conditional alert if Tier >= RED)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // -------------------------------------------------------------
    // Step 1: Contract Validation
    // -------------------------------------------------------------
    const parsedRequest = CheckInRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid check-in request payload",
          details: parsedRequest.error.issues,
        },
        { status: 400 }
      );
    }
    const req = parsedRequest.data;
    const repo = getRepository();

    // -------------------------------------------------------------
    // Step 2: Consent Gate
    // Invariant: 403 Forbidden with 0 writes if no active consent
    // -------------------------------------------------------------
    const person = await repo.getPerson(req.personId);
    if (!person) {
      return NextResponse.json(
        {
          status: "forbidden",
          tier: "GREEN",
          reply: "Person record not found or unauthorized.",
        } satisfies Partial<CheckInResponse>,
        { status: 403 }
      );
    }

    const activeConsent = await repo.getActiveConsent(req.personId);
    if (
      !activeConsent ||
      activeConsent.id !== req.consentId ||
      activeConsent.withdrawn_at !== null
    ) {
      return NextResponse.json(
        {
          status: "forbidden",
          tier: "GREEN",
          reply: "Active consent is required to process check-in.",
        } satisfies Partial<CheckInResponse>,
        { status: 403 }
      );
    }

    // -------------------------------------------------------------
    // Step 3: Minor Check
    // Invariant: Return caseworker referral with 0 assessment rows
    // -------------------------------------------------------------
    if (person.is_minor_flag) {
      // Create check-in contact entry for caseworker audit trail
      const checkin = await repo.createCheckin({
        person_id: person.id,
        consent_id: req.consentId,
        channel: req.channel,
        transcript: req.transcript ?? null,
        structured: req.structured ?? {},
        abandoned: req.abandoned ?? false,
      });

      const minorReply = getStaticReply("minor_detected", person.language);
      const resources = CRISIS_RESOURCES[person.language];

      return NextResponse.json(
        {
          status: "minor_routed",
          checkinId: checkin.id,
          tier: "GREEN",
          reply: minorReply,
          resources,
        } satisfies CheckInResponse,
        { status: 200 }
      );
    }

    // -------------------------------------------------------------
    // Step 4: Deterministic Crisis Triggers & Pass 1 Interlock
    // Invariant: On match, instant CRITICAL, crisis helplines, LLM bypassed
    // -------------------------------------------------------------
    let deterministicTrigger: DeterministicTriggerInput | null = null;

    // Trigger A: Simulated Telephony Panic Key ("0")
    if (req.keypadDigit === "0") {
      deterministicTrigger = {
        tier: "CRITICAL",
        source: "panic_key",
        reason: "Simulated emergency keypad digit '0' pressed",
      };
    }

    // Trigger B: Deterministic Lexicon Regex (Pass 1)
    if (!deterministicTrigger && req.transcript) {
      const pass1 = checkInput(req.transcript);
      if (pass1.hit) {
        deterministicTrigger = {
          tier: "CRITICAL",
          source: "lexicon",
          reason: `Pass 1 crisis lexicon match: ${pass1.description || pass1.matchedRuleId}`,
        };
      }
    }

    // Trigger C: S1 Self-report q3 === 4 ("Do you feel safe right now? No")
    const s1Result = computeS1(req.structured);
    if (!deterministicTrigger && s1Result.criticalTrigger) {
      deterministicTrigger = {
        tier: "CRITICAL",
        source: "self_report_q3",
        reason: "Self-report question q3 answered unsafe (4)",
      };
    }

    // -------------------------------------------------------------
    // Step 5: Boxed LLM Invocation
    // If deterministic trigger hit or no transcript, LLM is bypassed
    // -------------------------------------------------------------
    let llmResult: LLMAnalysisResult;

    if (deterministicTrigger) {
      // LLM call strictly bypassed for safety & speed
      llmResult = {
        reply: null,
        s2Score: null,
        markers: [],
        evidence: [],
        language: person.language,
        modelVersion: "bypassed:deterministic_trigger",
      };
    } else if (req.transcript && req.transcript.trim()) {
      llmResult = await analyzeTranscript({
        transcript: req.transcript,
        language: person.language,
      });
    } else {
      llmResult = {
        reply: null,
        s2Score: null,
        markers: [],
        evidence: [],
        language: person.language,
        modelVersion: "none:no_transcript",
      };
    }

    // -------------------------------------------------------------
    // Step 6: Pass 2 Interlock (LLM Output Sanitization)
    // -------------------------------------------------------------
    let sanitizedReply: string;
    if (deterministicTrigger) {
      sanitizedReply = getStaticReply("crisis_immediate", person.language);
    } else if (llmResult.reply) {
      const pass2Result = checkOutput(llmResult.reply, person.language);
      sanitizedReply = pass2Result.sanitizedReply;
    } else {
      sanitizedReply = getStaticReply(
        req.abandoned ? "closing_low" : "fallback_reply",
        person.language
      );
    }

    // -------------------------------------------------------------
    // Step 7: Scoring Engine (S1..S5 + Renormalisation)
    // -------------------------------------------------------------
    const s2Result = computeS2(llmResult.s2Score);

    const caseRecord = await repo.getCaseByPersonId(person.id);
    const s3Result = caseRecord
      ? computeS3(caseRecord)
      : {
          score: 0,
          standingPoints: 0,
          timeWindowedPoints: 0,
          totalPoints: 0,
          capped: false,
          conditions: [],
          reasons: ["No active legal docket or case context found"],
        };

    const s4Result = computeS4({
      missedCount: person.missed_count,
      abandoned: req.abandoned,
    });

    const s5Result = computeS5(req.audioMetrics);

    const compositeResult = computeComposite({
      s1: s1Result.score,
      s2: s2Result.score,
      s3: s3Result.score,
      s4: s4Result.score,
      s5: s5Result.score,
    });

    // -------------------------------------------------------------
    // Step 8: Dynamic EWMA Baseline & Change-Point
    // Invariant: z_t computed strictly BEFORE updating running baseline
    // -------------------------------------------------------------
    const baselineResult = evaluateBaseline(
      compositeResult.composite,
      {
        baseline_mean: person.baseline_mean,
        baseline_var: person.baseline_var,
        checkin_count: person.checkin_count,
      }
    );

    // -------------------------------------------------------------
    // Step 9: Policy Engine & Tier Assignment
    // -------------------------------------------------------------
    const policyResult = evaluatePolicy({
      composite: compositeResult.composite,
      zScore: baselineResult.zScore,
      changePoint: baselineResult.changePoint,
      s3Score: s3Result.score,
      isFirstContact: baselineResult.isFirstContact,
      missedCount: person.missed_count,
      deterministicTrigger,
    });

    // -------------------------------------------------------------
    // Step 10: Persistence & Conditional Alerts
    // -------------------------------------------------------------
    // Update baseline parameters on person record
    await repo.updatePersonBaseline(
      person.id,
      baselineResult.newBaselineMean,
      baselineResult.newBaselineVar,
      baselineResult.newCheckinCount
    );

    // Persist check-in record
    const checkin = await repo.createCheckin({
      person_id: person.id,
      consent_id: req.consentId,
      channel: req.channel,
      transcript: req.transcript ?? null,
      structured: req.structured ?? {},
      abandoned: req.abandoned ?? false,
    });

    // Collate human-readable explainability logs
    const explanation: string[] = [
      ...(s1Result.explanation ? [s1Result.explanation] : []),
      ...s3Result.reasons,
      ...s4Result.reasons,
      ...compositeResult.explanation,
      ...baselineResult.explanation,
      ...policyResult.explanation,
    ];

    // Persist assessment record
    const assessment = await repo.createAssessment({
      checkin_id: checkin.id,
      person_id: person.id,
      components: compositeResult.components,
      contributions: compositeResult.contributions,
      composite: compositeResult.composite,
      z_score: baselineResult.zScore,
      change_point: baselineResult.changePoint,
      tier: policyResult.tier,
      trigger_source: policyResult.triggerSource,
      explanation,
      policy_version: policyResult.policyVersion,
      model_version: llmResult.modelVersion,
    });

    // Create staff alert if Tier is RED or CRITICAL
    if (policyResult.tier === "RED" || policyResult.tier === "CRITICAL") {
      await repo.createAlert({
        assessment_id: assessment.id,
        person_id: person.id,
        tier: policyResult.tier,
        sla_minutes: policyResult.slaMinutes,
      });
    }

    const isCritical = policyResult.tier === "CRITICAL";
    const finalReply = isCritical
      ? getStaticReply("crisis_immediate", person.language)
      : sanitizedReply;

    const resources =
      isCritical || policyResult.immediateResources
        ? CRISIS_RESOURCES[person.language]
        : undefined;

    const responsePayload: CheckInResponse = {
      status: isCritical ? "critical" : "ok",
      checkinId: checkin.id,
      assessmentId: assessment.id,
      tier: policyResult.tier,
      reply: finalReply,
      resources,
      components: compositeResult.components,
      contributions: compositeResult.contributions,
      composite: compositeResult.composite,
      zScore: baselineResult.zScore,
      changePoint: baselineResult.changePoint,
      triggerSource: policyResult.triggerSource,
      explanation,
      nextQuestionId: isCritical ? undefined : llmResult.nextQuestionId,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("[SAHARA] Checkin pipeline error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during check-in processing",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
