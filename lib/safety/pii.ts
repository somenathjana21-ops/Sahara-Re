/**
 * PROJECT SAHARA — PII & Anonymity Scrubber
 *
 * Enforces Zero-PII by detecting and redacting personal identifiers:
 * - Indian mobile numbers & international phone numbers
 * - Indian Aadhaar (UIDAI 12-digit) numbers
 * - Email addresses
 * - Indian Permanent Account Numbers (PAN)
 * - Formal FIR / Court docket case reference numbers (e.g., FIR No. 124/2023)
 *
 * Runs server-side before persisting transcripts/case details or transmitting to LLMs.
 */

export interface ScrubResult {
  scrubbedText: string;
  hasPII: boolean;
  redactedTypes: string[];
}

// Stateless pattern creators to avoid JavaScript RegExp lastIndex statefulness issues with /g flags
export const PII_PATTERNS = {
  // 1. Email Addresses
  email: () => /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,

  // 2. Indian Mobile Numbers (+91 / 0 prefix optional, 10 digits starting with 6, 7, 8, 9)
  // Supports various delimiters: "9876543210", "+91 98765 43210", "09876-543210", "+91-98765-43210"
  indianPhone: () => /(?:(?:\+91|91|0)[\s-]?)?[6-9](?:[\s-]?\d){9}\b/g,

  // International Phone Numbers in E.164 or spaced format (min 8, max 15 digits with leading '+')
  intlPhone: () => /\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g,

  // 3. Aadhaar Numbers: 12 digits (often 4-4-4 spaced or dashed, starts with 2-9)
  aadhaar: () => /\b[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}\b|\b[2-9]\d{11}\b/g,

  // 4. Indian PAN Numbers: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
  pan: () => /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi,

  // 5. Formal FIR / CNR / Police Case Numbers
  // Targets explicit references: "FIR No 123/2024", "Case No: 452/2022", "CNR: DLHC010012342023"
  caseRef: () => /\b(?:FIR|fir)\s*(?:no\.?|number|#)?\s*[:#]?\s*[0-9]+[0-9/A-Za-z_-]{2,16}\b|\bCNR\s*[:#]?\s*[A-Za-z0-9]{16}\b|\b(?:case|case\s+no\.?|case\s+number)\s*[:#]\s*[0-9]+[0-9/A-Za-z_-]{2,16}\b/gi,
};

/**
 * Scrubs any personal identifying information from the input text,
 * replacing matches with standardized redaction tokens.
 */
export function scrubPII(text: string | null | undefined): ScrubResult {
  if (!text || typeof text !== "string") {
    return {
      scrubbedText: text ?? "",
      hasPII: false,
      redactedTypes: [],
    };
  }

  let scrubbed = text;
  const redactedTypes: string[] = [];

  // Redact Emails
  const emailRegex = PII_PATTERNS.email();
  if (emailRegex.test(scrubbed)) {
    redactedTypes.push("email");
    scrubbed = scrubbed.replace(PII_PATTERNS.email(), "[REDACTED_EMAIL]");
  }

  // Redact Aadhaar (test before phone to prevent partial phone matches on 12-digit strings)
  const aadhaarRegex = PII_PATTERNS.aadhaar();
  if (aadhaarRegex.test(scrubbed)) {
    redactedTypes.push("aadhaar");
    scrubbed = scrubbed.replace(PII_PATTERNS.aadhaar(), "[REDACTED_AADHAAR]");
  }

  // Redact Indian Mobile Numbers
  const indianPhoneRegex = PII_PATTERNS.indianPhone();
  if (indianPhoneRegex.test(scrubbed)) {
    redactedTypes.push("phone");
    scrubbed = scrubbed.replace(PII_PATTERNS.indianPhone(), "[REDACTED_PHONE]");
  }

  // Redact International Phones
  const intlPhoneRegex = PII_PATTERNS.intlPhone();
  if (intlPhoneRegex.test(scrubbed)) {
    if (!redactedTypes.includes("phone")) redactedTypes.push("phone");
    scrubbed = scrubbed.replace(PII_PATTERNS.intlPhone(), "[REDACTED_PHONE]");
  }

  // Redact PAN Cards
  const panRegex = PII_PATTERNS.pan();
  if (panRegex.test(scrubbed)) {
    redactedTypes.push("pan_id");
    scrubbed = scrubbed.replace(PII_PATTERNS.pan(), "[REDACTED_ID]");
  }

  // Redact Case / FIR numbers
  const caseRefRegex = PII_PATTERNS.caseRef();
  if (caseRefRegex.test(scrubbed)) {
    redactedTypes.push("case_reference");
    scrubbed = scrubbed.replace(PII_PATTERNS.caseRef(), "[REDACTED_CASE_REF]");
  }

  return {
    scrubbedText: scrubbed,
    hasPII: redactedTypes.length > 0,
    redactedTypes,
  };
}

/**
 * Checks whether text contains any identifiable PII without modifying it.
 */
export function containsPII(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  return (
    PII_PATTERNS.email().test(text) ||
    PII_PATTERNS.indianPhone().test(text) ||
    PII_PATTERNS.intlPhone().test(text) ||
    PII_PATTERNS.aadhaar().test(text) ||
    PII_PATTERNS.pan().test(text) ||
    PII_PATTERNS.caseRef().test(text)
  );
}
