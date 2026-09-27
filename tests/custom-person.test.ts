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

  it("should support extended legal case options and custom user fill-in details", async () => {
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "A-CaseDetailTest",
        language: "hi",
        hasCase: true,
        caseData: {
          atrocityCategory: "sexual_harassment",
          customCaseDetails: "FIR filed against village landlord; receiving threats to withdraw statement.",
          otherPressureDetails: "Advocate requested police escort during hearings; family faced social pressure.",
          stage: "investigation",
          bailStatus: "accused_on_bail", // +20
          intimidationReportDaysAgo: 5, // +25
        },
        consentGranted: true,
      }),
    });

    const createRes = await personPostHandler(createReq);
    assert.strictEqual(createRes.status, 201);
    const data = await createRes.json();

    assert.strictEqual(data.case.atrocity_category, "sexual_harassment");
    assert.strictEqual(
      data.case.custom_case_details,
      "FIR filed against village landlord; receiving threats to withdraw statement."
    );
    assert.strictEqual(
      data.case.other_pressure_details,
      "Advocate requested police escort during hearings; family faced social pressure."
    );
    assert.strictEqual(data.s3Standing, 45); // 20 + 25
  });

  it("should match Persona A-1911 by pseudonym, link prior check-in history & baseline, and evaluate second check-in", async () => {
    // 1. Look up A-1911 by pseudonym
    const getReq = new NextRequest("http://localhost:3000/api/persons?pseudonym=A-1911");
    const getRes = await personGetHandler(getReq);
    assert.strictEqual(getRes.status, 200);

    const data = await getRes.json();
    assert.strictEqual(data.person.pseudonym, "A-1911");
    assert.strictEqual(data.person.baseline_mean, 32.5);
    assert.strictEqual(data.person.checkin_count, 1);
    assert.strictEqual(data.person.missed_count, 1); // Checked in, then didn't (1 missed)
    assert.ok(data.checkins && data.checkins.length === 1);
    assert.strictEqual(
      data.checkins[0].transcript,
      "Feeling tense about the investigation, hoping things stay peaceful."
    );

    // 2. A-1911 performs next check-in
    const checkinReq = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: data.person.id,
        consentId: data.consent.id,
        channel: "chat",
        transcript: "Hearing date is approaching and pressure is increasing",
        structured: { q1: 3, q2: 3, q3: 1 },
      }),
    });

    const checkinRes = await checkinHandler(checkinReq);
    assert.strictEqual(checkinRes.status, 200);

    const checkinJson = await checkinRes.json();
    assert.strictEqual(checkinJson.status, "ok");

    // Check that baseline was updated in repo
    const repo = getRepository();
    const updatedPerson = await repo.getPerson(data.person.id);
    assert.ok(updatedPerson);
    assert.strictEqual(updatedPerson.checkin_count, 2, "Checkin count must increment from 1 to 2");
    assert.ok(updatedPerson.baseline_mean !== null);
  });

  it("should record prior history and baseline when user checks in, and match them on next visit without exposing points", async () => {
    // 1. First visit: Register user A-5521
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "A-5521",
        language: "en",
        hasCase: true,
        caseData: {
          atrocityCategory: "denial_of_rights",
          customCaseDetails: "Barred from using the public community well",
          stage: "trial",
          bailStatus: "in_custody",
        },
        consentGranted: true,
      }),
    });

    const createRes = await personPostHandler(createReq);
    const { person, consent } = await createRes.json();
    assert.strictEqual(person.checkin_count, 0);

    // 2. A-5521 submits first check-in (establishing baseline)
    const checkin1Req = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: person.id,
        consentId: consent.id,
        channel: "chat",
        transcript: "Things are somewhat difficult today",
        structured: { q1: 2, q2: 2, q3: 1 },
      }),
    });

    const checkin1Res = await checkinHandler(checkin1Req);
    assert.strictEqual(checkin1Res.status, 200);

    // 3. User leaves, then returns next day: looked up by pseudonym
    const lookupReq = new NextRequest("http://localhost:3000/api/persons?pseudonym=A-5521");
    const lookupRes = await personGetHandler(lookupReq);
    assert.strictEqual(lookupRes.status, 200);

    const lookupData = await lookupRes.json();
    assert.strictEqual(lookupData.person.pseudonym, "A-5521");
    assert.strictEqual(lookupData.person.checkin_count, 1);
    assert.ok(lookupData.person.baseline_mean !== null, "Prior baseline must be recorded");
    assert.strictEqual(lookupData.checkins.length, 1);
    assert.strictEqual(lookupData.checkins[0].transcript, "Things are somewhat difficult today");

    // 4. They submit another check-in (matched with previous session)
    const checkin2Req = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: lookupData.person.id,
        consentId: lookupData.consent.id,
        channel: "chat",
        transcript: "Feeling more anxious today",
        structured: { q1: 3, q2: 3, q3: 1 },
      }),
    });

    const checkin2Res = await checkinHandler(checkin2Req);
    assert.strictEqual(checkin2Res.status, 200);

    const repo = getRepository();
    const finalPerson = await repo.getPerson(lookupData.person.id);
    assert.strictEqual(finalPerson?.checkin_count, 2);
  });

  it("should return consent details in GET /api/persons list and allow check-in without toggling consent", async () => {
    // 1. Create a self-directed persona
    const createReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "A-9901",
        language: "en",
        isMinor: false,
        hasCase: false,
        consentGranted: true,
      }),
    });
    const createRes = await personPostHandler(createReq);
    assert.strictEqual(createRes.status, 201);
    const { person, consent } = await createRes.json();

    // 2. Query the list of persons via GET /api/persons
    const listReq = new NextRequest("http://localhost:3000/api/persons");
    const listRes = await personGetHandler(listReq);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.persons));

    const found = listData.persons.find((p: any) => p.id === person.id);
    assert.ok(found, "Newly created persona must be present in GET /api/persons list");
    assert.strictEqual(found.consentId, consent.id, "consentId must match active consent record, not person.id");
    assert.strictEqual(found.hasConsent, true, "hasConsent must be true");

    // 3. Immediate check-in with this persona must succeed without 403
    const checkinReq = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: found.id,
        consentId: found.consentId,
        channel: "chat",
        transcript: "Checking in for the first time",
        structured: { q1: 1, q2: 1, q3: 0 },
        abandoned: false,
      }),
    });
    const checkinRes = await checkinHandler(checkinReq);
    assert.strictEqual(checkinRes.status, 200);
    const checkinData = await checkinRes.json();
    assert.strictEqual(checkinData.status, "ok");
  });

  it("should reject real names and non-synthetic identifiers as pseudonyms (HTTP 400)", async () => {
    const invalidPseudonyms = [
      "Ramesh Sharma",
      "John Doe",
      "victim@test.org",
      "9876543210",
      "A", // too short
      "X-1001", // must start with A- or U-
    ];

    for (const name of invalidPseudonyms) {
      const req = new NextRequest("http://localhost:3000/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudonym: name,
          language: "en",
          hasCase: false,
          consentGranted: true,
        }),
      });

      const res = await personPostHandler(req);
      assert.strictEqual(res.status, 400, `Expected HTTP 400 for invalid pseudonym '${name}'`);
      const body = await res.json();
      assert.ok(body.error.includes("Invalid custom person payload"));
      assert.ok(body.details.pseudonym);
    }
  });

  it("should automatically redact phone numbers, emails, and case numbers in transcripts before persistence", async () => {
    // 1. Create a valid person
    const personReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "A-ScrubTest",
        language: "en",
        hasCase: false,
        consentGranted: true,
      }),
    });
    const personRes = await personPostHandler(personReq);
    assert.strictEqual(personRes.status, 201);
    const { person, consent } = await personRes.json();

    // 2. Submit checkin containing multiple real PII elements
    const checkinReq = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: person.id,
        consentId: consent.id,
        channel: "chat",
        transcript:
          "My mobile is 9876543210, reach me at victim@help.org regarding FIR No. 441/2024. I am feeling tense.",
        structured: { q1: 2, q2: 2, q3: 1 },
        abandoned: false,
      }),
    });
    const checkinRes = await checkinHandler(checkinReq);
    assert.strictEqual(checkinRes.status, 200);

    // 3. Verify in repository that stored checkin transcript has 0 PII
    const repo = getRepository();
    const storedCheckins = await repo.getCheckinsByPersonId(person.id);
    assert.strictEqual(storedCheckins.length, 1);
    const stored = storedCheckins[0]!;

    assert.ok(stored.transcript);
    assert.ok(!stored.transcript.includes("9876543210"), "Phone number must NOT be persisted in DB");
    assert.ok(!stored.transcript.includes("victim@help.org"), "Email must NOT be persisted in DB");
    assert.ok(!stored.transcript.includes("441/2024"), "FIR number must NOT be persisted in DB");
    assert.ok(stored.transcript.includes("[REDACTED_PHONE]"), "Must contain REDACTED_PHONE placeholder");
    assert.ok(stored.transcript.includes("[REDACTED_EMAIL]"), "Must contain REDACTED_EMAIL placeholder");
    assert.ok(stored.transcript.includes("[REDACTED_CASE_REF]"), "Must contain REDACTED_CASE_REF placeholder");
    assert.ok(stored.transcript.includes("I am feeling tense"), "Emotional distress text must be preserved");
  });

  it("should scrub PII from custom case details before saving to repository", async () => {
    const personReq = new NextRequest("http://localhost:3000/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: "A-CaseScrub",
        language: "hi",
        hasCase: true,
        caseData: {
          atrocityCategory: "land_dispossession",
          stage: "investigation",
          customCaseDetails: "Call IO officer at 09876-543210 or email police@station.in about Case: 881/2023",
          otherPressureDetails: "Threats received via phone +91 98765 43210",
        },
        consentGranted: true,
      }),
    });

    const res = await personPostHandler(personReq);
    assert.strictEqual(res.status, 201);
    const data = await res.json();

    assert.ok(!data.case.custom_case_details.includes("09876-543210"));
    assert.ok(!data.case.custom_case_details.includes("police@station.in"));
    assert.ok(!data.case.custom_case_details.includes("881/2023"));
    assert.ok(data.case.custom_case_details.includes("[REDACTED_PHONE]"));
    assert.ok(data.case.custom_case_details.includes("[REDACTED_EMAIL]"));
    assert.ok(data.case.custom_case_details.includes("[REDACTED_CASE_REF]"));

    assert.ok(!data.case.other_pressure_details.includes("98765 43210"));
    assert.ok(data.case.other_pressure_details.includes("[REDACTED_PHONE]"));
  });
});

