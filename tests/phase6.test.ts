import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { GET as queueGetHandler } from "@/app/api/staff/queue/route";
import { GET as personGetHandler } from "@/app/api/staff/persons/[personId]/route";
import {
  POST as authPostHandler,
  DELETE as authDeleteHandler,
} from "@/app/api/staff/auth/route";
import {
  GET as auditGetHandler,
  POST as auditPostHandler,
} from "@/app/api/staff/audit/route";
import {
  GET as alertsGetHandler,
  POST as alertsPostHandler,
} from "@/app/api/alerts/route";
import { getRepository, resetRepository } from "@/lib/db/repository";
import { ensureStaffTriageFixtures } from "@/lib/db/staff-seed";
import { PERSON_A4471, PERSON_A6218, PERSON_A7892, PERSON_A2301 } from "@/scripts/fixtures";

describe("Phase 6: Counsellor Triage Dashboard Suite", () => {
  beforeEach(async () => {
    resetRepository();
    const repo = getRepository();
    await ensureStaffTriageFixtures(repo);
  });

  // =========================================================================
  // Gate 1: Staff Access Gate & Passcode Authentication
  // =========================================================================
  describe("Staff Access Gate & Passcode Verification", () => {
    let originalPasscode: string | undefined;

    // The hardened auth route requires STAFF_PASSCODE env var (no fallback)
    it("setup: set STAFF_PASSCODE for testing", () => {
      originalPasscode = process.env.STAFF_PASSCODE;
      process.env.STAFF_PASSCODE = "sahara2026";
    });

    it("should reject invalid passcode with HTTP 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: "wrongpasscode", staffHandle: "counsellor_1" }),
      });

      const res = await authPostHandler(req);
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.ok(json.error.includes("Invalid staff passcode"));
    });

    it("should accept valid passcode ('sahara2026') and return session credentials", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: "sahara2026",
          staffHandle: "Dr. Ananya Sharma",
        }),
      });

      const res = await authPostHandler(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.ok, true);
      assert.strictEqual(json.staffHandle, "Dr. Ananya Sharma");
      assert.ok(json.sessionToken);

      const cookie = res.cookies.get("sahara_session");
      assert.ok(cookie, "Auth response must set sahara_session cookie");
      assert.strictEqual(cookie.value, json.sessionToken);
    });

    it("should clear session cookie on DELETE /api/staff/auth", async () => {
      const res = await authDeleteHandler();
      assert.strictEqual(res.status, 200);
      const cookie = res.cookies.get("sahara_session");
      assert.ok(cookie);
      assert.strictEqual(cookie.value, "");
    });

    it("teardown: restore original STAFF_PASSCODE", () => {
      if (originalPasscode !== undefined) {
        process.env.STAFF_PASSCODE = originalPasscode;
      } else {
        delete process.env.STAFF_PASSCODE;
      }
    });
  });

  // =========================================================================
  // Gate 2: Acceptance Criteria 1 - Triage Queue Ranking & Persona A-4471
  // =========================================================================
  describe("Acceptance Criteria 1: Triage Queue Ranking & Persona A-4471", () => {
    it("should list persona A-4471 in RED tier with Change Point badge (z = 3.11) and 30-minute SLA timer", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/queue");
      const res = await queueGetHandler(req);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.ok, true);
      assert.ok(Array.isArray(json.queue));

      // Find A-4471 in queue
      const itemA4471 = json.queue.find(
        (i: any) => i.person.pseudonym === "A-4471"
      );
      assert.ok(itemA4471, "Persona A-4471 must be present in triage queue");

      // Verify Tier is RED
      assert.strictEqual(itemA4471.effectiveTier, "RED");

      // Verify Change Point is true
      assert.strictEqual(itemA4471.latestAssessment.change_point, true);

      // Verify z-score is 3.11
      assert.strictEqual(itemA4471.latestAssessment.z_score, 3.11);

      // Verify 30-minute SLA timer
      assert.strictEqual(itemA4471.slaMinutes, 30);
      assert.strictEqual(itemA4471.alert?.sla_minutes, 30);

      // Verify dominant component is S3 (Case Context)
      assert.strictEqual(itemA4471.dominantComponent.key, "s3");
      assert.strictEqual(itemA4471.dominantComponent.points, 22.5);
    });

    it("should sort triage queue prioritizing RED / CRITICAL before AMBER before GREEN", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/queue");
      const res = await queueGetHandler(req);
      const json = await res.json();

      const queue = json.queue;
      assert.ok(queue.length >= 3);

      // A-4471 (RED, Change Point) must be at index 0 (top priority)
      assert.strictEqual(queue[0].person.pseudonym, "A-4471");
      assert.strictEqual(queue[0].effectiveTier, "RED");

      // Later items should be lower tiers
      const tiers = queue.map((q: any) => q.effectiveTier);
      const redIdx = tiers.indexOf("RED");
      const amberIdx = tiers.indexOf("AMBER");
      const greenIdx = tiers.indexOf("GREEN");

      if (redIdx !== -1 && amberIdx !== -1) {
        assert.ok(redIdx < amberIdx, "RED tier must appear before AMBER tier");
      }
      if (amberIdx !== -1 && greenIdx !== -1) {
        assert.ok(amberIdx < greenIdx, "AMBER tier must appear before GREEN tier");
      }
    });

    it("should provide summary statistics with counts of monitored, urgent, and change points", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/queue");
      const res = await queueGetHandler(req);
      const json = await res.json();

      assert.ok(json.stats);
      assert.ok(json.stats.totalMonitored >= 4);
      assert.ok(json.stats.redCount >= 1);
      assert.ok(json.stats.changePointCount >= 1);
      assert.ok(json.stats.pendingAlerts >= 1);
    });
  });

  // =========================================================================
  // Gate 3: Acceptance Criteria 2 - Person Detail & S3 Dominance
  // =========================================================================
  describe("Acceptance Criteria 2: Component Breakdown & S3 Dominance", () => {
    it("should display exact component breakdown for A-4471: S3 dominant (22.50) > S1 (17.50) > S2 (13.75)", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/staff/persons/${PERSON_A4471.id}`
      );
      const res = await personGetHandler(req, {
        params: Promise.resolve({ personId: PERSON_A4471.id }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.ok, true);

      // Retrieve latest assessment
      const assessments = json.assessments;
      assert.ok(assessments.length > 0);
      const latest = assessments[assessments.length - 1];

      // Exact component raw scores
      assert.deepStrictEqual(latest.components, {
        s1: 50,
        s2: 55,
        s3: 90,
        s4: 0,
        s5: null,
      });

      // Exact point contributions
      assert.strictEqual(latest.contributions.s1, 17.5);
      assert.strictEqual(latest.contributions.s2, 13.75);
      assert.strictEqual(latest.contributions.s3, 22.5);
      assert.strictEqual(latest.contributions.s4, 0);
      assert.strictEqual(latest.contributions.s5, 0);

      // Total Composite
      assert.strictEqual(latest.composite, 53.75);

      // Core Invariant: S3 is strictly greater than S1 and S2
      assert.ok(
        latest.contributions.s3 > latest.contributions.s1,
        `S3 contribution (${latest.contributions.s3}) must be larger than S1 (${latest.contributions.s1})`
      );
      assert.ok(
        latest.contributions.s3 > latest.contributions.s2,
        `S3 contribution (${latest.contributions.s3}) must be larger than S2 (${latest.contributions.s2})`
      );

      // S5 weight is strictly 0.00
      assert.strictEqual(latest.contributions.s5, 0);
    });

    it("should return complete legal docket milestones for S3 inspection", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/staff/persons/${PERSON_A4471.id}`
      );
      const res = await personGetHandler(req, {
        params: Promise.resolve({ personId: PERSON_A4471.id }),
      });

      const json = await res.json();
      const caseRec = json.case;
      assert.ok(caseRec);
      assert.strictEqual(caseRec.bail_status, "accused_on_bail");
      assert.strictEqual(caseRec.adjournment_count, 4);
      assert.ok(caseRec.next_hearing_date);
      assert.ok(caseRec.last_intimidation_report);
      assert.strictEqual(caseRec.relief_paid, false);
    });
  });

  // =========================================================================
  // Gate 4: Acceptance Criteria 3 - Alert Acknowledgment Workflow & Audit
  // =========================================================================
  describe("Acceptance Criteria 3: Alert Acknowledgment Workflow", () => {
    it("should require staff handle and record timestamp and disposition in alerts and audit_events", async () => {
      const repo = getRepository();
      const alerts = await repo.listAlerts();
      const alertA4471 = alerts.find((a) => a.person_id === PERSON_A4471.id);
      assert.ok(alertA4471, "Alert for A-4471 must exist");

      // Verify alert is unacknowledged initially
      assert.strictEqual(alertA4471.acked_at, null);
      assert.strictEqual(alertA4471.acked_by, null);

      // 1. Attempt ACK without staff handle -> should fail with 400
      const invalidReq = new NextRequest("http://localhost:3000/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alertA4471.id,
          ackedBy: "", // Missing
          disposition: "contacted",
        }),
      });
      const invalidRes = await alertsPostHandler(invalidReq);
      assert.strictEqual(invalidRes.status, 400);

      // 2. Perform valid ACK with staff handle
      const staffHandle = "counsellor_priya_sharma";
      const validReq = new NextRequest("http://localhost:3000/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alertA4471.id,
          ackedBy: staffHandle,
          disposition: "contacted",
        }),
      });

      const validRes = await alertsPostHandler(validReq);
      assert.strictEqual(validRes.status, 200);

      const json = await validRes.json();
      assert.strictEqual(json.ok, true);
      assert.strictEqual(json.alert.acked_by, staffHandle);
      assert.strictEqual(json.alert.disposition, "contacted");
      assert.ok(json.alert.acked_at);

      // 3. Verify in database that alert was updated
      const updatedAlert = (await repo.listAlerts()).find((a) => a.id === alertA4471.id);
      assert.ok(updatedAlert);
      assert.strictEqual(updatedAlert.acked_by, staffHandle);
      assert.strictEqual(updatedAlert.disposition, "contacted");
      assert.ok(updatedAlert.acked_at);

      // 4. Verify immutable audit event recorded
      const auditEvents = await repo.listAuditEvents();
      const ackAudit = auditEvents.find(
        (ev) => ev.action === "ack_alert" && ev.subject_id === alertA4471.id
      );
      assert.ok(ackAudit, "Audit event for ack_alert must be created");
      assert.strictEqual(ackAudit.actor, staffHandle);
      assert.strictEqual(ackAudit.role, "counsellor");
      assert.ok(ackAudit.created_at);
    });

    it("should accept all standard dispositions ('contacted', 'escalated', 'no_action_needed')", async () => {
      const repo = getRepository();
      const alerts = await repo.listAlerts();
      const amberAlert = alerts.find((a) => a.person_id === PERSON_A7892.id);

      if (amberAlert) {
        const req = new NextRequest("http://localhost:3000/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alertId: amberAlert.id,
            ackedBy: "duty_supervisor",
            disposition: "escalated",
          }),
        });

        const res = await alertsPostHandler(req);
        assert.strictEqual(res.status, 200);
        const json = await res.json();
        assert.strictEqual(json.alert.disposition, "escalated");
      }
    });
  });

  // =========================================================================
  // Gate 5: Acceptance Criteria 4 - Audit Logging on Person Detail View
  // =========================================================================
  describe("Acceptance Criteria 4: Person Read Audit Logging", () => {
    it("should create a view_person audit event when reading any person detail screen", async () => {
      const repo = getRepository();
      const auditBefore = (await repo.listAuditEvents()).filter(
        (ev) => ev.action === "view_person" && ev.subject_id === PERSON_A4471.id
      ).length;

      const actorHandle = "Dr. Rajesh K";
      const req = new NextRequest(
        `http://localhost:3000/api/staff/persons/${PERSON_A4471.id}?actor=${encodeURIComponent(actorHandle)}`
      );

      const res = await personGetHandler(req, {
        params: Promise.resolve({ personId: PERSON_A4471.id }),
      });
      assert.strictEqual(res.status, 200);

      // Verify audit event was created
      const auditAfter = (await repo.listAuditEvents()).filter(
        (ev) => ev.action === "view_person" && ev.subject_id === PERSON_A4471.id
      );

      assert.strictEqual(
        auditAfter.length,
        auditBefore + 1,
        "Reading person detail screen must create a view_person audit event"
      );

      const latestEvent = auditAfter[0]!; // repo sorts latest first
      assert.strictEqual(latestEvent.actor, actorHandle);
      assert.strictEqual(latestEvent.action, "view_person");
      assert.strictEqual(latestEvent.subject_id, PERSON_A4471.id);
    });

    it("should list and filter audit events via GET /api/staff/audit", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/audit?action=view_person");
      const res = await auditGetHandler(req);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.ok, true);
      assert.ok(Array.isArray(json.events));
      for (const ev of json.events) {
        assert.strictEqual(ev.action, "view_person");
      }
    });
  });
});
