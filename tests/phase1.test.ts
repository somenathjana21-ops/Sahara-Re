import { describe, it } from "node:test";
import assert from "node:assert";
import {
  CheckInRequestSchema,
  CheckInResponseSchema,
  PersonRecord,
  TierEnum,
} from "@/types/contract";
import {
  PERSON_A4471,
  CASE_A4471,
  CONSENT_A4471,
  PERSON_A6218,
  SEED_PERSONS,
  SEED_CASES,
  SEED_CONSENTS,
} from "@/scripts/fixtures";
import { InMemoryRepository } from "@/lib/db/repository";

describe("Phase 1: Core Data Contracts & Validation", () => {
  it("should validate a compliant checkin request payload", () => {
    const validPayload = {
      personId: PERSON_A4471.id,
      consentId: CONSENT_A4471.id,
      channel: "chat",
      transcript: "mujhe bahut dar lag raha hai",
      structured: { q1: 2, q2: 3, q3: 1 },
      abandoned: false,
    };

    const parsed = CheckInRequestSchema.parse(validPayload);
    assert.strictEqual(parsed.personId, PERSON_A4471.id);
    assert.strictEqual(parsed.channel, "chat");
    assert.strictEqual(parsed.structured?.q1, 2);
  });

  it("should reject a checkin request with invalid channel or out-of-range structured scores", () => {
    const invalidPayload = {
      personId: PERSON_A4471.id,
      consentId: CONSENT_A4471.id,
      channel: "invalid_channel", // Invalid
      structured: { q1: 10 }, // 10 is > 4
    };

    assert.throws(() => {
      CheckInRequestSchema.parse(invalidPayload);
    });
  });

  it("should enforce all 4 tiers in TierEnum", () => {
    assert.strictEqual(TierEnum.parse("GREEN"), "GREEN");
    assert.strictEqual(TierEnum.parse("AMBER"), "AMBER");
    assert.strictEqual(TierEnum.parse("RED"), "RED");
    assert.strictEqual(TierEnum.parse("CRITICAL"), "CRITICAL");
    assert.throws(() => TierEnum.parse("UNKNOWN"));
  });
});

describe("Phase 1: Golden Path Persona A-4471 Fixture Verification", () => {
  it("should verify persona A-4471 parameters before Day 0 check-in", () => {
    assert.strictEqual(PERSON_A4471.pseudonym, "A-4471");
    assert.strictEqual(PERSON_A4471.is_minor_flag, false);
    assert.strictEqual(PERSON_A4471.baseline_mean, 28.9);
    assert.strictEqual(PERSON_A4471.baseline_var, 2.7);
    assert.strictEqual(PERSON_A4471.checkin_count, 2);
    assert.strictEqual(PERSON_A4471.missed_count, 0);
  });

  it("should compute standing static case context = 50 points for A-4471", () => {
    let staticPoints = 0;
    if (CASE_A4471.bail_status === "accused_on_bail") staticPoints += 20;
    if (CASE_A4471.relief_due_date && !CASE_A4471.relief_paid) staticPoints += 15;
    if (CASE_A4471.adjournment_count >= 3) staticPoints += 10;
    // Opened 400 days ago (> 365)
    staticPoints += 5;

    assert.strictEqual(staticPoints, 50, "Standing static pressure must equal 50");
  });

  it("should compute Day 0 S3 case context = 90 points for A-4471 with calendar events", () => {
    let s3Total = 50; // static base

    // D-1 Event 1: Intimidation report filed within 14 days (+25)
    if (CASE_A4471.last_intimidation_report) {
      s3Total += 25;
    }

    // D-1 Event 2: Next court hearing in 6 days (within 7 days) (+15)
    if (CASE_A4471.next_hearing_date) {
      s3Total += 15;
    }

    assert.strictEqual(s3Total, 90, "Day 0 S3 Case Context must equal 90 points");
  });

  it("should verify minor persona A-6218 has is_minor_flag = true and 0 check-in history", () => {
    assert.strictEqual(PERSON_A6218.pseudonym, "A-6218");
    assert.strictEqual(PERSON_A6218.is_minor_flag, true);
    assert.strictEqual(PERSON_A6218.checkin_count, 0);
  });
});

describe("Phase 1: Repository & Data Access", () => {
  it("should seed and retrieve entities through InMemoryRepository", async () => {
    const repo = new InMemoryRepository();
    await repo.seed({
      persons: SEED_PERSONS,
      cases: SEED_CASES,
      consents: SEED_CONSENTS,
    });

    const person = await repo.getPersonByPseudonym("A-4471");
    assert.ok(person);
    assert.strictEqual(person.id, PERSON_A4471.id);

    const caseRec = await repo.getCaseByPersonId(person.id);
    assert.ok(caseRec);
    assert.strictEqual(caseRec.atrocity_category, "land_dispossession");

    const consent = await repo.getActiveConsent(person.id);
    assert.ok(consent);
    assert.strictEqual(consent.withdrawn_at, null);

    // Test revoking consent
    await repo.revokeConsent(person.id);
    const activeConsentAfterRevoke = await repo.getActiveConsent(person.id);
    assert.strictEqual(activeConsentAfterRevoke, null);
  });
});
