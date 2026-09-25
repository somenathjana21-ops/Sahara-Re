import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import enLocale from "../locales/en.json";
import hiLocale from "../locales/hi.json";
import { CRISIS_RESOURCES, REPLY_BANK } from "../lib/safety/replies";
import { POST as checkinHandler } from "../app/api/checkin/route";
import { PERSON_A4471, CONSENT_A4471 } from "../scripts/fixtures";
import { NextRequest } from "next/server";
import { CheckInRequest } from "../types/contract";

describe("Phase 5: Localization & Dictionary Integrity", () => {
  it("should have matching key hierarchies between English and Hindi locales", () => {
    const enSections = Object.keys(enLocale).sort();
    const hiSections = Object.keys(hiLocale).sort();

    assert.deepEqual(
      enSections,
      hiSections,
      "Top-level locale keys should be identical in en and hi"
    );

    for (const section of enSections) {
      const enKeys = Object.keys((enLocale as any)[section]).sort();
      const hiKeys = Object.keys((hiLocale as any)[section]).sort();
      assert.deepEqual(
        enKeys,
        hiKeys,
        `Subkeys under section '${section}' must match exactly in en and hi`
      );
    }
  });

  it("should contain official emergency numbers (14566, 14416, 1800-599-0019, 112) in both locales", () => {
    const requiredNumbers = ["14566", "14416", "1800-599-0019", "112"];

    for (const num of requiredNumbers) {
      const enJson = JSON.stringify(enLocale);
      const hiJson = JSON.stringify(hiLocale);
      assert.ok(
        enJson.includes(num.replace(/-/g, "")) || enJson.includes(num),
        `English locale missing helpline number ${num}`
      );
      assert.ok(
        hiJson.includes(num.replace(/-/g, "")) || hiJson.includes(num),
        `Hindi locale missing helpline number ${num}`
      );
    }
  });

  it("should match official consent notice in both languages", () => {
    assert.equal(
      enLocale.checkin.consentNoticeText,
      REPLY_BANK.en.consent_notice,
      "English consent notice text should match Reply Bank"
    );
    assert.equal(
      hiLocale.checkin.consentNoticeText,
      REPLY_BANK.hi.consent_notice,
      "Hindi consent notice text should match Reply Bank"
    );
  });
});

describe("Phase 5: Quick Exit & Safety Invariants", () => {
  it("should define ESC quick exit targeting https://weather.com", () => {
    const quickExitFile = fs.readFileSync(
      path.resolve(process.cwd(), "components/common/QuickExit.tsx"),
      "utf8"
    );
    assert.ok(
      quickExitFile.includes("https://weather.com"),
      "QuickExit must target https://weather.com"
    );
    assert.ok(
      quickExitFile.includes("window.location.replace"),
      "QuickExit must use window.location.replace to purge history"
    );
    assert.ok(
      quickExitFile.includes("Escape"),
      "QuickExit must listen for Escape key"
    );
  });
});

describe("Phase 5: 4-4-4 Grounding Box Breathing Cadence", () => {
  it("should verify 4-4-4 box breathing specifications in component", () => {
    const breathingFile = fs.readFileSync(
      path.resolve(process.cwd(), "components/common/BreathingWidget.tsx"),
      "utf8"
    );
    assert.ok(
      breathingFile.includes("inhale"),
      "Breathing widget must feature inhale phase"
    );
    assert.ok(
      breathingFile.includes("hold"),
      "Breathing widget must feature hold phase"
    );
    assert.ok(
      breathingFile.includes("exhale"),
      "Breathing widget must feature exhale phase"
    );
    assert.ok(
      breathingFile.includes("4-4-4"),
      "Breathing widget must specify 4-4-4 cadence"
    );
  });
});

describe("Phase 5: Zero-Delay Crisis Helplines Delivery", () => {
  it("should immediately supply crisis resources for both English and Hindi without network latency", () => {
    const enRes = CRISIS_RESOURCES.en;
    const hiRes = CRISIS_RESOURCES.hi;

    assert.equal(enRes.length, 4, "Must have 4 critical resources in EN");
    assert.equal(hiRes.length, 4, "Must have 4 critical resources in HI");

    const nhaaEn = enRes.find((r) => r.number === "14566");
    const telemanasEn = enRes.find((r) => r.number === "14416");
    assert.ok(nhaaEn, "NHAA 14566 present");
    assert.ok(telemanasEn, "Tele-MANAS 14416 present");

    const nhaaHi = hiRes.find((r) => r.number === "14566");
    const telemanasHi = hiRes.find((r) => r.number === "14416");
    assert.ok(nhaaHi, "NHAA 14566 present in Hindi");
    assert.ok(telemanasHi, "Tele-MANAS 14416 present in Hindi");
  });
});

describe("Phase 5: Check-in API Pipeline Integration", () => {
  function createJsonRequest(body: any): NextRequest {
    return new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("should process text check-in and render assistant response", async () => {
    const payload: CheckInRequest = {
      personId: PERSON_A4471.id,
      consentId: CONSENT_A4471.id,
      channel: "chat",
      transcript: "neend theek nahi aayi par main sambhal raha hoon",
      structured: { q1: 2, q2: 2, q3: 1 },
      abandoned: false,
    };

    const res = await checkinHandler(createJsonRequest(payload));
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, "ok");
    assert.ok(data.reply && data.reply.length > 0, "Response must include reply message");
    assert.ok(data.tier, "Response must have assigned tier");
    assert.ok(data.checkinId, "Must return checkinId");
    assert.ok(data.assessmentId, "Must return assessmentId");
  });

  it("should process simulated call turn and evaluate paralinguistic audio metrics", async () => {
    const payload: CheckInRequest = {
      personId: PERSON_A4471.id,
      consentId: CONSENT_A4471.id,
      channel: "call_sim",
      transcript: "main bol raha hoon, thoda sa darr lag raha hai",
      audioMetrics: {
        pitchVariabilityPct: 45,
        speechRateDeviationPct: 20,
        pauseRatioPct: 30,
      },
      abandoned: false,
    };

    const res = await checkinHandler(createJsonRequest(payload));
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, "ok");
    assert.ok(data.reply, "Must return audio reply text");
    // Verify acoustic weight S5 remains strictly 0.00
    if (data.contributions) {
      assert.equal(data.contributions.s5, 0, "Audio acoustic contribution S5 must be locked to 0.00");
    }
  });

  it("should trigger immediate CRITICAL tier on Keypad '0' panic input", async () => {
    const payload: CheckInRequest = {
      personId: PERSON_A4471.id,
      consentId: CONSENT_A4471.id,
      channel: "call_sim",
      keypadDigit: "0",
      transcript: "[Keypad 0 pressed for direct human referral]",
      abandoned: false,
    };

    const res = await checkinHandler(createJsonRequest(payload));
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, "critical");
    assert.equal(data.tier, "CRITICAL");
    assert.equal(data.triggerSource, "panic_key");
    assert.ok(data.resources && data.resources.length > 0, "Must return emergency crisis resources");
  });

  it("should trigger deterministic CRITICAL when self-report q3 is 4 ('No, not safe')", async () => {
    const payload: CheckInRequest = {
      personId: PERSON_A4471.id,
      consentId: CONSENT_A4471.id,
      channel: "chat",
      transcript: "checking in",
      structured: { q1: 1, q2: 1, q3: 4 }, // q3 = 4 triggers panic
      abandoned: false,
    };

    const res = await checkinHandler(createJsonRequest(payload));
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, "critical");
    assert.equal(data.tier, "CRITICAL");
    assert.equal(data.triggerSource, "self_report_q3");
    assert.ok(data.resources && data.resources.length > 0, "Must return crisis resources for q3=4");
  });
});
