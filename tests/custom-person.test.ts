import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as personPostHandler, GET as personGetHandler } from "@/app/api/persons/route";
import { POST as checkinHandler } from "@/app/api/checkin/route";
import { getRepository, resetRepository } from "@/lib/db/repository";
import { CheckInResponse } from "@/types/contract";

describe("Custom User Check-in Suite (Without Persona)", () => {
  beforeEach(() => {
    resetRepository();
  });

  it("should create a custom user without a case (S3 = 0)", async () => {
    const req = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "U-1001",
        language: "en",
        isMinor: false,
        hasCase: false,
        consentGranted: true,
      }),
    });

    const res = await personPostHandler(req);
    assert.strictEqual(res.status, 201);
    const data = await res.json();

    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.person.pseudonym, "U-1001");
    assert.strictEqual(data.person.language, "en");
    assert.strictEqual(data.s3Standing, 0);
    assert.strictEqual(data.case, null);
    assert.ok(data.consent && data.consent.withdrawn_at === null);

    // Verify in repository
    const repo = getRepository();
    const repoPerson = await repo.getPerson(data.person.id);
    assert.ok(repoPerson);
    assert.strictEqual(repoPerson.pseudonym, "U-1001");
  });

  it("should create a custom user with specific case stress factors (S3 = 35)", async () => {
    const req = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "A-CustomBail",
        language: "hi",
        isMinor: false,
        hasCase: true,
        caseData: {
          atrocityCategory: "land_dispossession",
          stage: "trial",
          bailStatus: "accused_on_bail", // +20
          nextHearingDays: 5, // within 7 days (+15)
          adjournmentCount: 1, // <3 (0)
          reliefPaid: true, // (0)
          socialBoycott: false, // (0)
          caseOpenDaysAgo: 100, // <365 (0)
        },
        consentGranted: true,
      }),
    });

    const res = await personPostHandler(req);
    assert.strictEqual(res.status, 201);
    const data = await res.json();

    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.s3Standing, 35); // 20 + 15
    assert.ok(data.case);
    assert.strictEqual(data.case.bail_status, "accused_on_bail");
  });

  it("should execute full 10-step check-in pipeline with custom user data", async () => {
    // 1. Register custom user
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "U-PipelineTest",
        language: "en",
        isMinor: false,
        hasCase: true,
        caseData: {
          atrocityCategory: "physical_assault",
          stage: "trial",
          bailStatus: "accused_on_bail", // +20
          intimidationReportDaysAgo: 3, // +25
          nextHearingDays: 4, // +15
          // S3 = 60
        },
        consentGranted: true,
      }),
    });

    const createRes = await personPostHandler(createReq);
    const { person, consent, s3Standing } = await createRes.json();
    assert.strictEqual(s3Standing, 60);

    // 2. Submit check-in through pipeline
    const checkinReq = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: person.id,
        consentId: consent.id,
        channel: "chat",
        transcript: "feeling anxious about the hearing coming up",
        structured: { q1: 2, q2: 2, q3: 1 },
      }),
    });

    const checkinRes = await checkinHandler(checkinReq);
    assert.strictEqual(checkinRes.status, 200);

    const checkinJson: CheckInResponse = await checkinRes.json();
    assert.strictEqual(checkinJson.status, "ok");
    assert.ok(checkinJson.components);
    // S3 component in assessment must equal the user's custom case score
    assert.strictEqual(checkinJson.components.s3, 60);
    assert.ok(checkinJson.composite !== undefined && checkinJson.composite > 0);
  });

  it("should safeguard custom minor user with zero automated scoring", async () => {
    // 1. Register custom minor
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "U-MinorSafe",
        language: "en",
        isMinor: true,
        hasCase: false,
        consentGranted: true,
      }),
    });

    const createRes = await personPostHandler(createReq);
    const { person, consent } = await createRes.json();

    // 2. Submit checkin
    const checkinReq = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: person.id,
        consentId: consent.id,
        channel: "chat",
        transcript: "I need some help",
      }),
    });

    const checkinRes = await checkinHandler(checkinReq);
    assert.strictEqual(checkinRes.status, 200);
    const json: CheckInResponse = await checkinRes.json();

    // Must be diverted without scoring
    assert.strictEqual(json.status, "minor_routed");
    assert.strictEqual(json.tier, "GREEN");
    assert.strictEqual(json.components, undefined);

    const repo = getRepository();
    const assessments = await repo.getAssessmentsByPersonId(person.id);
    assert.strictEqual(assessments.length, 0, "Zero assessment rows must be written for minors");
  });

  it("should enforce consent gate on custom user without active consent", async () => {
    // Register without consent
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "U-NoConsent",
        language: "en",
        isMinor: false,
        hasCase: false,
        consentGranted: false,
      }),
    });

    const createRes = await personPostHandler(createReq);
    const { person, consent } = await createRes.json();

    const checkinReq = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: person.id,
        consentId: consent.id,
        channel: "chat",
        transcript: "hello",
      }),
    });

    const checkinRes = await checkinHandler(checkinReq);
    assert.strictEqual(checkinRes.status, 403);
    const json = await checkinRes.json();
    assert.strictEqual(json.status, "forbidden");
  });

  it("should update an existing custom person's details", async () => {
    // 1. Initial creation
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "U-UpdateTest",
        language: "en",
        hasCase: false,
        consentGranted: true,
      }),
    });
    const createRes = await personPostHandler(createReq);
    const { person } = await createRes.json();

    // 2. Update with new case details
    const updateReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: person.id,
        pseudonym: "U-UpdateTest-Modified",
        language: "hi",
        hasCase: true,
        caseData: {
          bailStatus: "accused_on_bail", // +20
          socialBoycott: true, // +10
        },
        consentGranted: true,
      }),
    });
    const updateRes = await personPostHandler(updateReq);
    assert.strictEqual(updateRes.status, 200);
    const updateJson = await updateRes.json();

    assert.strictEqual(updateJson.person.pseudonym, "U-UpdateTest-Modified");
    assert.strictEqual(updateJson.person.language, "hi");
    assert.strictEqual(updateJson.s3Standing, 30); // 20 + 10
  });

  it("should query custom person details via GET /api/persons?personId=...", async () => {
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "U-QueryGet",
        language: "en",
        hasCase: true,
        caseData: {
          bailStatus: "accused_on_bail",
        },
        consentGranted: true,
      }),
    });
    const createRes = await personPostHandler(createReq);
    const { person } = await createRes.json();

    const getReq = new NextRequest(`http://localhost:3000/api/persons?personId=${person.id}`);
    const getRes = await personGetHandler(getReq);
    assert.strictEqual(getRes.status, 200);

    const getJson = await getRes.json();
    assert.strictEqual(getJson.person.pseudonym, "U-QueryGet");
    assert.strictEqual(getJson.s3Standing, 20);
  });
});
