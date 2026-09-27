import { describe, it } from "node:test";
import assert from "node:assert";
import { scrubPII, containsPII } from "@/lib/safety/pii";

describe("PII Scrubber Unit Tests", () => {
  it("should return unchanged text when no PII is present", () => {
    const text = "Aaj mujhe bahut dar lag raha hai aur neend nahi aa rahi.";
    const result = scrubPII(text);
    assert.strictEqual(result.hasPII, false);
    assert.strictEqual(result.scrubbedText, text);
    assert.strictEqual(result.redactedTypes.length, 0);
    assert.strictEqual(containsPII(text), false);
  });

  it("should redact Indian mobile numbers in various formats", () => {
    const samples = [
      {
        input: "Please call me at 9876543210 immediately.",
        expected: "Please call me at [REDACTED_PHONE] immediately.",
      },
      {
        input: "My number is +91 98765 43210 please save it.",
        expected: "My number is [REDACTED_PHONE] please save it.",
      },
      {
        input: "Contact 09876-543210 for help.",
        expected: "Contact [REDACTED_PHONE] for help.",
      },
      {
        input: "Call +91-98765-43210",
        expected: "Call [REDACTED_PHONE]",
      },
    ];

    for (const s of samples) {
      const res = scrubPII(s.input);
      assert.strictEqual(res.hasPII, true);
      assert.ok(res.redactedTypes.includes("phone"));
      assert.strictEqual(res.scrubbedText, s.expected);
      assert.strictEqual(containsPII(s.input), true);
    }
  });

  it("should redact email addresses", () => {
    const text = "You can write to me at victim.support@example.org or test123_4@service.gov.in";
    const res = scrubPII(text);
    assert.strictEqual(res.hasPII, true);
    assert.ok(res.redactedTypes.includes("email"));
    assert.strictEqual(
      res.scrubbedText,
      "You can write to me at [REDACTED_EMAIL] or [REDACTED_EMAIL]"
    );
  });

  it("should redact Aadhaar card numbers (12 digits)", () => {
    const text = "Aadhaar number is 5432 1234 9876 shown on card.";
    const res = scrubPII(text);
    assert.strictEqual(res.hasPII, true);
    assert.ok(res.redactedTypes.includes("aadhaar"));
    assert.strictEqual(res.scrubbedText, "Aadhaar number is [REDACTED_AADHAAR] shown on card.");
  });

  it("should redact PAN cards", () => {
    const text = "My document ID is ABCDE1234F provided to court.";
    const res = scrubPII(text);
    assert.strictEqual(res.hasPII, true);
    assert.ok(res.redactedTypes.includes("pan_id"));
    assert.strictEqual(res.scrubbedText, "My document ID is [REDACTED_ID] provided to court.");
  });

  it("should redact formal FIR and court case reference numbers", () => {
    const text = "FIR No. 124/2023 was registered at PS City, Case: 452/2022.";
    const res = scrubPII(text);
    assert.strictEqual(res.hasPII, true);
    assert.ok(res.redactedTypes.includes("case_reference"));
    assert.strictEqual(
      res.scrubbedText,
      "[REDACTED_CASE_REF] was registered at PS City, [REDACTED_CASE_REF]."
    );
  });

  it("should handle mixed PII and maintain emotional context for scoring", () => {
    const text = "I am afraid, call 9876543210 or email test@court.in regarding FIR No 88/2024";
    const res = scrubPII(text);
    assert.strictEqual(res.hasPII, true);
    assert.ok(res.redactedTypes.includes("phone"));
    assert.ok(res.redactedTypes.includes("email"));
    assert.ok(res.redactedTypes.includes("case_reference"));
    assert.strictEqual(
      res.scrubbedText,
      "I am afraid, call [REDACTED_PHONE] or email [REDACTED_EMAIL] regarding [REDACTED_CASE_REF]"
    );
    // Emotion keyword "afraid" is preserved
    assert.ok(res.scrubbedText.includes("I am afraid"));
  });

  it("should gracefully handle null, undefined, and non-string inputs", () => {
    assert.strictEqual(scrubPII(null as any).scrubbedText, "");
    assert.strictEqual(scrubPII(undefined as any).scrubbedText, "");
    assert.strictEqual(containsPII(null as any), false);
  });
});
