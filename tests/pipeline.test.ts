import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as checkinHandler } from "@/app/api/checkin/route";
import {
  GET as consentGetHandler,
  POST as consentPostHandler,
  DELETE as consentDeleteHandler,
} from "@/app/api/consent/route";
import {
  GET as casesGetHandler,
  PATCH as casesPatchHandler,
} from "@/app/api/cases/route";
import {
  GET as alertsGetHandler,
  POST as alertsPostHandler,
} from "@/app/api/alerts/route";
import {
  getRepository,
  resetRepository,
} from "@/lib/db/repository";
import {
  PERSON_A4471,
  CONSENT_A4471,
  CASE_A4471,
  PERSON_A6218,
  CONSENT_A6218,
  PERSON_A2301,
  CONSENT_A2301,
} from "@/scripts/fixtures";
import { CheckInResponse } from "@/types/contract";

describe("Phase 4: Core API Pipeline Integration Suite", () => {
  beforeEach(() => {
    // Reset to clean seeded state before each test
    resetRepository();
  });

  // =========================================================================
  // Gate 1: Consent Gate & Lockdown
  // =========================================================================
  describe("Consent Gate & Lockdown", () => {
    it("should return 403 Forbidden with 0 DB writes when consentId does not match", async () => {
      const repo = getRepository();
      const checkinsBefore = (await repo.getCheckinsByPersonId(PERSON_A4471.id)).length;
      const assessmentsBefore = (await repo.getAssessmentsByPersonId(PERSON_A4471.id)).length;

      const fakeConsentId = "00000000-0000-0000-0000-000000000000";
      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          consentId: fakeConsentId,
          channel: "chat",
          transcript: "sab theek hai",
          structured: { q1: 1, q2: 1, q3: 1 },
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 403);

      const json = await res.json();
      assert.strictEqual(json.status, "forbidden");
      assert.ok(json.reply.includes("consent"));

      // Verify ZERO database mutations occurred
      const checkinsAfter = (await repo.getCheckinsByPersonId(PERSON_A4471.id)).length;
      const assessmentsAfter = (await repo.getAssessmentsByPersonId(PERSON_A4471.id)).length;
      assert.strictEqual(checkinsAfter, checkinsBefore, "Zero checkin rows must be written");
      assert.strictEqual(assessmentsAfter, assessmentsBefore, "Zero assessment rows must be written");
    });

    it("should return 403 Forbidden when consent has been withdrawn", async () => {
      const repo = getRepository();
      await repo.revokeConsent(PERSON_A4471.id);

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          consentId: CONSENT_A4471.id,
          channel: "chat",
          transcript: "sab theek hai",
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.strictEqual(json.status, "forbidden");
    });

    it("should reject payload with 400 Bad Request if schema is invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: "invalid-uuid",
          channel: "unknown_channel",
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.error, "Invalid check-in request payload");
    });
  });

  // =========================================================================
  // Gate 2: Minor Persona Caseworker Routing
  // =========================================================================
  describe("Minor Persona Routing (A-6218)", () => {
    it("should divert minor persona A-6218 to caseworker workflow with 0 assessment rows written", async () => {
      const repo = getRepository();

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A6218.id,
          consentId: CONSENT_A6218.id,
          channel: "chat",
          transcript: "mujhe bahut dar lag raha hai ghar par",
          structured: { q1: 4, q2: 4, q3: 4 },
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "minor_routed");
      assert.strictEqual(json.tier, "GREEN");
      assert.ok(json.reply.includes("18") || json.reply.includes("Childline") || json.reply.includes("विशेषज्ञ"));
      assert.ok(json.resources && json.resources.length > 0);

      // Verify ZERO assessment and ZERO alert rows written for minor persona
      const assessments = await repo.getAssessmentsByPersonId(PERSON_A6218.id);
      assert.strictEqual(assessments.length, 0, "No scoring or assessment rows may be written for minors");

      const alerts = (await repo.listAlerts()).filter((a) => a.person_id === PERSON_A6218.id);
      assert.strictEqual(alerts.length, 0, "No automated alerts may be generated for minors");
    });
  });

  // =========================================================================
  // Gate 3: Pass 1 Interlock & Deterministic Triggers
  // =========================================================================
  describe("Pass 1 Interlock & Deterministic Crisis Triggers", () => {
    it("should trigger Pass 1 CRITICAL on crisis transcript, bypass LLM, and record alert", async () => {
      const repo = getRepository();

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          consentId: CONSENT_A4471.id,
          channel: "chat",
          transcript: "mujhe lagta hai jeene ka koi fayda nahi ab", // Crisis phrase
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "critical");
      assert.strictEqual(json.tier, "CRITICAL");
      assert.strictEqual(json.triggerSource, "lexicon");
      assert.ok(json.resources && json.resources.length >= 2);
      assert.ok(json.reply.includes("सुरक्षा") || json.reply.includes("priority"));

      // Verify CRITICAL alert written to database
      const alerts = await repo.listAlerts();
      const criticalAlert = alerts.find(
        (a) => a.person_id === PERSON_A4471.id && a.tier === "CRITICAL"
      );
      assert.ok(criticalAlert, "CRITICAL alert must be persisted in database");
      assert.strictEqual(criticalAlert.sla_minutes, 0, "Critical SLA is 0 (immediate)");

      // Verify LLM modelVersion indicates deterministic bypass
      const assessments = await repo.getAssessmentsByPersonId(PERSON_A4471.id);
      const latestAssessment = assessments[assessments.length - 1]!;
      assert.strictEqual(latestAssessment.model_version, "bypassed:deterministic_trigger");
    });

    it("should trigger CRITICAL on simulated IVRS panic keypad '0' press and bypass LLM", async () => {
      const repo = getRepository();

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          consentId: CONSENT_A4471.id,
          channel: "call_sim",
          keypadDigit: "0",
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "critical");
      assert.strictEqual(json.tier, "CRITICAL");
      assert.strictEqual(json.triggerSource, "panic_key");

      const alerts = await repo.listAlerts();
      assert.ok(alerts.some((a) => a.person_id === PERSON_A4471.id && a.tier === "CRITICAL"));
    });

    it("should trigger CRITICAL when S1 self-report q3 === 4 ('Do you feel safe? No')", async () => {
      const repo = getRepository();

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          consentId: CONSENT_A4471.id,
          channel: "chat",
          transcript: "theek hoon", // Calm text
          structured: { q1: 1, q2: 1, q3: 4 }, // Unsafe indicator
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "critical");
      assert.strictEqual(json.tier, "CRITICAL");
      assert.strictEqual(json.triggerSource, "self_report_q3");

      const alerts = await repo.listAlerts();
      assert.ok(alerts.some((a) => a.person_id === PERSON_A4471.id && a.tier === "CRITICAL"));
    });
  });

  // =========================================================================
  // Gate 4: Golden Path Persona A-4471 Full Pipeline Integration
  // =========================================================================
  describe("Golden Path Persona A-4471 Day 0 Ingestion", () => {
    it("should process Day 0 check-in: S1=50, S2=55, S3=90, S4=0 -> Composite=53.75, z=3.11, change_point=true, Tier=RED", async () => {
      const repo = getRepository();

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          consentId: CONSENT_A4471.id,
          channel: "chat",
          transcript: "neend bilkul nahi aa rahi hai, dar lag raha hai",
          structured: { q1: 2, q2: 2, q3: 2 },
          abandoned: false,
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "ok");
      assert.strictEqual(json.tier, "RED");
      assert.strictEqual(json.changePoint, true);

      // Verify exact mathematical outputs
      assert.strictEqual(json.composite, 53.75);
      assert.strictEqual(json.zScore, 3.11);

      assert.deepStrictEqual(json.components, {
        s1: 50,
        s2: 55,
        s3: 90,
        s4: 0,
        s5: null,
      });

      assert.deepStrictEqual(json.contributions, {
        s1: 17.5,
        s2: 13.75,
        s3: 22.5,
        s4: 0,
        s5: 0,
      });

      // Verify RED alert persisted with 30-minute SLA
      const alerts = await repo.listAlerts();
      const redAlert = alerts.find(
        (a) => a.person_id === PERSON_A4471.id && a.tier === "RED"
      );
      assert.ok(redAlert, "Alert must be created for RED tier assessment");
      assert.strictEqual(redAlert.sla_minutes, 30);

      // Verify person running baseline updated
      const personAfter = await repo.getPerson(PERSON_A4471.id);
      assert.ok(personAfter);
      assert.strictEqual(personAfter.checkin_count, 3); // Was 2 in fixture
      assert.strictEqual(personAfter.baseline_mean, 36.36); // 0.3*53.75 + 0.7*28.90 = 36.355 -> 36.36
    });
  });

  // =========================================================================
  // Gate 5: Missing Signal Renormalisation & Abandonment
  // =========================================================================
  describe("Missing Signal Renormalisation & Abandonment", () => {
    it("should renormalise over present components when S2 is null without throwing", async () => {
      const repo = getRepository();

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A2301.id,
          consentId: CONSENT_A2301.id,
          channel: "chat",
          transcript: null, // No transcript -> S2 is null
          structured: { q1: 1, q2: 1, q3: 1 }, // S1 = 25
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "ok");
      assert.strictEqual(json.components?.s2, null);
      assert.ok(typeof json.composite === "number");
    });

    it("should score mid-flow abandonment (+20 on S4)", async () => {
      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A2301.id,
          consentId: CONSENT_A2301.id,
          channel: "chat",
          abandoned: true,
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.components?.s4, 20);
    });
  });

  // =========================================================================
  // Gate 6: Ancillary Endpoints (Consent, Cases, Alerts)
  // =========================================================================
  describe("Ancillary Endpoints (/api/consent, /api/cases, /api/alerts)", () => {
    it("should manage consent lifecycle via /api/consent (GET, POST, DELETE)", async () => {
      // 1. GET active consent
      const getReq = new NextRequest(`http://localhost:3000/api/consent?personId=${PERSON_A4471.id}`);
      const getRes = await consentGetHandler(getReq);
      assert.strictEqual(getRes.status, 200);
      const getJson = await getRes.json();
      assert.ok(getJson.consent);
      assert.strictEqual(getJson.consent.person_id, PERSON_A4471.id);

      // 2. DELETE revoke consent
      const delReq = new NextRequest(`http://localhost:3000/api/consent?personId=${PERSON_A4471.id}`, {
        method: "DELETE",
      });
      const delRes = await consentDeleteHandler(delReq);
      assert.strictEqual(delRes.status, 200);

      // 3. Verify revoked
      const checkReq = new NextRequest(`http://localhost:3000/api/consent?personId=${PERSON_A4471.id}`);
      const checkRes = await consentGetHandler(checkReq);
      const checkJson = await checkRes.json();
      assert.strictEqual(checkJson.consent, null);

      // 4. POST grant new consent
      const postReq = new NextRequest("http://localhost:3000/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          purpose: "distress_monitoring",
          captureMethod: "tap",
        }),
      });
      const postRes = await consentPostHandler(postReq);
      assert.strictEqual(postRes.status, 201);
      const postJson = await postRes.json();
      assert.ok(postJson.consent);
      assert.strictEqual(postJson.consent.person_id, PERSON_A4471.id);
    });

    it("should query and update case docket via /api/cases (GET, PATCH)", async () => {
      // 1. GET case by pseudonym
      const getReq = new NextRequest("http://localhost:3000/api/cases?pseudonym=A-4471");
      const getRes = await casesGetHandler(getReq);
      assert.strictEqual(getRes.status, 200);
      const getJson = await getRes.json();
      assert.ok(getJson.case);
      assert.strictEqual(getJson.case.person_id, PERSON_A4471.id);

      // 2. PATCH case milestone (e.g. bail status changed to in_custody)
      const patchReq = new NextRequest("http://localhost:3000/api/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          bailStatus: "in_custody",
        }),
      });
      const patchRes = await casesPatchHandler(patchReq);
      assert.strictEqual(patchRes.status, 200);
      const patchJson = await patchRes.json();
      assert.strictEqual(patchJson.case.bail_status, "in_custody");
    });

    it("should list alerts and acknowledge alert via /api/alerts (GET, POST)", async () => {
      const repo = getRepository();

      // Seed a pending alert
      const createdAlert = await repo.createAlert({
        assessment_id: "55555555-5555-5555-5555-555555555555",
        person_id: PERSON_A4471.id,
        tier: "RED",
        sla_minutes: 30,
      });

      // 1. GET alerts
      const getReq = new NextRequest("http://localhost:3000/api/alerts?pending=true");
      const getRes = await alertsGetHandler(getReq);
      assert.strictEqual(getRes.status, 200);
      const getJson = await getRes.json();
      assert.ok(getJson.alerts.length >= 1);

      // 2. POST acknowledge alert
      const postReq = new NextRequest("http://localhost:3000/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: createdAlert.id,
          ackedBy: "counsellor_sarah",
          disposition: "contacted",
        }),
      });
      const postRes = await alertsPostHandler(postReq);
      assert.strictEqual(postRes.status, 200);
      const postJson = await postRes.json();
      assert.strictEqual(postJson.alert.acked_by, "counsellor_sarah");
      assert.strictEqual(postJson.alert.disposition, "contacted");
      assert.ok(postJson.alert.acked_at);

      // 3. Verify audit event was logged
      const auditEvents = await repo.listAuditEvents();
      const ackAudit = auditEvents.find(
        (e) => e.actor === "counsellor_sarah" && e.action === "ack_alert"
      );
      assert.ok(ackAudit, "Audit event must be logged on alert acknowledgment");
      assert.strictEqual(ackAudit.subject_id, createdAlert.id);
    });

    it("should process a calm check-in, assigning GREEN tier with zero alerts generated", async () => {
      const repo = getRepository();
      const alertsBefore = (await repo.listAlerts()).length;

      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A2301.id,
          consentId: CONSENT_A2301.id,
          channel: "chat",
          transcript: "sab theek hai abhi, koi pareshani nahi",
          structured: { q1: 0, q2: 0, q3: 0 },
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "ok");
      assert.strictEqual(json.tier, "GREEN");
      assert.ok(json.composite !== undefined && json.composite < 30);

      const alertsAfter = (await repo.listAlerts()).length;
      assert.strictEqual(alertsAfter, alertsBefore, "Zero alerts should be created for GREEN tier");
    });

    it("should trigger Pass 1 CRITICAL on negated crisis statements (fails safe invariant)", async () => {
      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: PERSON_A4471.id,
          consentId: CONSENT_A4471.id,
          channel: "chat",
          transcript: "I do not want to die",
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 200);

      const json: CheckInResponse = await res.json();
      assert.strictEqual(json.status, "critical");
      assert.strictEqual(json.tier, "CRITICAL");
      assert.strictEqual(json.triggerSource, "lexicon");
    });

    it("should return 403 Forbidden when personId does not exist in repository", async () => {
      const nonexistentId = "99999999-9999-9999-9999-999999999999";
      const req = new NextRequest("http://localhost:3000/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: nonexistentId,
          consentId: CONSENT_A4471.id,
          channel: "chat",
        }),
      });

      const res = await checkinHandler(req);
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.strictEqual(json.status, "forbidden");
    });
  });
});
