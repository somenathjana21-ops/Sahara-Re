import { IRepository } from "./repository";
import {
  PERSON_A4471,
  CONSENT_A4471,
  PERSON_A7892,
  CONSENT_A7892,
  PERSON_A2301,
  CONSENT_A2301,
} from "@/scripts/fixtures";
import { AlertRecord, AssessmentRecord, CheckinRecord } from "@/types/contract";

/**
 * Ensures initial triage queue fixtures for staff dashboard demo & evaluation.
 * If alerts or Day 0 assessments are not yet recorded, this creates:
 * - A-4471: Day 0 assessment (RED, z=3.11, change_point=true, composite=53.75, S3 dominant=22.50) + RED alert (SLA 30m)
 * - A-7892: AMBER tier alert (SLA 240m) due to 3 missed check-ins
 * - A-2301: Stable GREEN assessment
 */
export async function ensureStaffTriageFixtures(repo: IRepository): Promise<void> {
  const existingAlerts = await repo.listAlerts();
  const a4471Alert = existingAlerts.find((a) => a.person_id === PERSON_A4471.id);

  if (!a4471Alert) {
    const now = new Date();
    // 8 minutes ago for SLA countdown realism
    const day0Time = new Date(now.getTime() - 8 * 60 * 1000).toISOString();

    // Check if Day 0 checkin already exists
    const checkins = await repo.getCheckinsByPersonId(PERSON_A4471.id);
    let day0Checkin = checkins.find(
      (c) => c.transcript === "neend bilkul nahi aa rahi hai, dar lag raha hai"
    );

    if (!day0Checkin) {
      day0Checkin = await repo.createCheckin({
        person_id: PERSON_A4471.id,
        consent_id: CONSENT_A4471.id,
        channel: "chat",
        transcript: "neend bilkul nahi aa rahi hai, dar lag raha hai",
        structured: { q1: 2, q2: 2, q3: 2 },
        abandoned: false,
      });
      // Override created_at for SLA countdown
      day0Checkin.created_at = day0Time;
    }

    const assessments = await repo.getAssessmentsByPersonId(PERSON_A4471.id);
    let day0Assessment = assessments.find((a) => a.composite === 53.75);

    if (!day0Assessment) {
      day0Assessment = await repo.createAssessment({
        checkin_id: day0Checkin.id,
        person_id: PERSON_A4471.id,
        components: { s1: 50, s2: 55, s3: 90, s4: 0, s5: null },
        contributions: { s1: 17.5, s2: 13.75, s3: 22.5, s4: 0.0, s5: 0 },
        composite: 53.75,
        z_score: 3.11,
        change_point: true,
        tier: "RED",
        trigger_source: "policy",
        explanation: [
          "S1 self-report distress score 50.00 (moderate: sleep disturbances, anxiety)",
          "S2 linguistic distress score 55.00 extracted from user transcript",
          "S3 case context: standing pressure 50 pts + intimidation report (+25) + hearing in 6 days (+15) = 90 pts (DOMINANT DRIVER)",
          "S4 engagement: on track (0 missed check-ins, no mid-flow abandonment)",
          "Dynamic baseline change point detected: z-score 3.11 exceeds 2.0 threshold with prior history",
          "Policy rule matched: Change point + S3 >= 60 triggers RED tier with 30-minute SLA",
        ],
        policy_version: "v1.1.0",
        model_version: "mock:default+prompt-1.0.0",
      });
      day0Assessment.created_at = day0Time;
    }

    // Create active RED alert with 30-minute SLA
    const alert = await repo.createAlert({
      assessment_id: day0Assessment.id,
      person_id: PERSON_A4471.id,
      tier: "RED",
      sla_minutes: 30,
    });
    alert.created_at = day0Time;

    // Update person running baseline to reflect Day 0
    await repo.updatePersonBaseline(PERSON_A4471.id, 36.36, 2.7, 3);
  }

  // Ensure A-7892 has an AMBER alert for engagement monotonicity
  const a7892Alert = existingAlerts.find((a) => a.person_id === PERSON_A7892.id);
  if (!a7892Alert) {
    const amberTime = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    const assessments7892 = await repo.getAssessmentsByPersonId(PERSON_A7892.id);
    let assessment7892 = assessments7892[0];

    if (!assessment7892) {
      assessment7892 = await repo.createAssessment({
        checkin_id: crypto.randomUUID(),
        person_id: PERSON_A7892.id,
        components: { s1: 30, s2: 25, s3: 10, s4: 75, s5: null },
        contributions: { s1: 10.5, s2: 6.25, s3: 2.5, s4: 11.25, s5: 0 },
        composite: 30.5,
        z_score: 0.85,
        change_point: false,
        tier: "AMBER",
        trigger_source: "policy",
        explanation: [
          "S4 engagement monotonicity: 3 missed check-ins (+75 pts)",
          "Social boycott flag active (+10 pts)",
          "Policy rule matched: 3+ missed check-ins enforces minimum AMBER tier",
        ],
        policy_version: "v1.1.0",
        model_version: "mock:default+prompt-1.0.0",
      });
      assessment7892.created_at = amberTime;
    }

    const amberAlert = await repo.createAlert({
      assessment_id: assessment7892.id,
      person_id: PERSON_A7892.id,
      tier: "AMBER",
      sla_minutes: 240,
    });
    amberAlert.created_at = amberTime;
  }

  // Ensure A-2301 has a stable GREEN assessment
  const a2301Assessments = await repo.getAssessmentsByPersonId(PERSON_A2301.id);
  if (a2301Assessments.length === 0) {
    const greenTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    await repo.createAssessment({
      checkin_id: crypto.randomUUID(),
      person_id: PERSON_A2301.id,
      components: { s1: 20, s2: 20, s3: 20, s4: 0, s5: null },
      contributions: { s1: 7.0, s2: 5.0, s3: 5.0, s4: 0.0, s5: 0 },
      composite: 17.0,
      z_score: -0.2,
      change_point: false,
      tier: "GREEN",
      trigger_source: "policy",
      explanation: [
        "Distress levels well within personal baseline",
        "Case in rehabilitation stage, relief compensation paid",
      ],
      policy_version: "v1.1.0",
      model_version: "mock:default+prompt-1.0.0",
    });
  }
}
