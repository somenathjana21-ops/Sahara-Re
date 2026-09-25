/**
 * PROJECT SAHARA — Two-Pass Safety Interlock
 *
 * Governing Principle:
 * "The interlock runs twice: on input before LLM, on output before human.
 *  Never remove the second."
 *
 * Pass 1 (checkInput):
 * - Evaluates raw transcript against deterministic crisis lexicon.
 * - On match: instant CRITICAL trigger, bypasses LLM entirely.
 * - Negation fails safe ("I don't want to die" still fires).
 *
 * Pass 2 (checkOutput):
 * - Evaluates LLM generated response against strict clinical & safety boundaries:
 *   1. No clinical advice or coping prescriptions
 *   2. No psychiatric diagnosis or labeling
 *   3. No false reassurance or dismissive cheer
 *   4. No outcome promises regarding legal cases/investigations
 *   5. No repeated or mirrored crisis terms
 *   6. Strict length limit (<= 320 chars) and max 1 question
 * - On violation: discards model output and substitutes immutable fallback_reply.
 */

import { Language } from "@/types/contract";
import {
  LEXICON_RULES,
  LexiconCategory,
  normalizeText,
} from "./lexicon";
import { getStaticReply } from "./replies";

// ==========================================
// Pass 1: Input Check Types & Implementation
// ==========================================

export interface Pass1Result {
  hit: boolean;
  category?: LexiconCategory;
  matchedRuleId?: string;
  matchedPattern?: string;
  description?: string;
  normalizedText: string;
}

/**
 * Deterministically checks user transcript for crisis indicators.
 * Bypasses all LLM calls if hit is true.
 */
export function checkInput(transcript: string | null | undefined): Pass1Result {
  if (!transcript || typeof transcript !== "string") {
    return {
      hit: false,
      normalizedText: "",
    };
  }

  const normalized = normalizeText(transcript);
  if (!normalized) {
    return {
      hit: false,
      normalizedText: "",
    };
  }

  for (const rule of LEXICON_RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        hit: true,
        category: rule.category,
        matchedRuleId: rule.id,
        matchedPattern: rule.pattern.source,
        description: rule.description,
        normalizedText: normalized,
      };
    }
  }

  return {
    hit: false,
    normalizedText: normalized,
  };
}

// ==========================================
// Pass 2: Output Check Types & Implementation
// ==========================================

export type Pass2ViolationReason =
  | "advice"
  | "diagnosis"
  | "false_reassurance"
  | "outcome_promise"
  | "crisis_term"
  | "excessive_length"
  | "multiple_questions";

export interface Pass2Result {
  passed: boolean;
  reason?: Pass2ViolationReason;
  violationDetail?: string;
  sanitizedReply: string;
}

interface BannedPatternRule {
  reason: Pass2ViolationReason;
  pattern: RegExp;
  detail: string;
}

/**
 * Banned patterns for Pass 2 (Zero 'g' flags allowed).
 */
const BANNED_OUTPUT_RULES: readonly BannedPatternRule[] = Object.freeze([
  // 1. Clinical Advice & Prescriptions
  {
    reason: "advice",
    pattern: /\b(you\s+(should|must|ought\s+to|need\s+to)(\s+try)?)\b/i,
    detail: "Prescriptive 'you should / you must'",
  },
  {
    reason: "advice",
    pattern: /\b(try\s+(to|taking|breathing|exercising|going|doing|relaxing))\b/i,
    detail: "Action prescription 'try to / try breathing'",
  },
  {
    reason: "advice",
    pattern: /\b(i\s+(recommend|suggest|advise))\b/i,
    detail: "Clinical suggestion 'I recommend / suggest'",
  },
  {
    reason: "advice",
    pattern: /\b(what\s+helps\s+is|have\s+you\s+considered)\b/i,
    detail: "Unsolicited coping advice",
  },
  {
    reason: "advice",
    pattern: /\b(take\s+(a\s+walk|deep\s+breaths?)|make\s+sure\s+to)\b/i,
    detail: "Direct instruction / breathing prescription",
  },
  {
    reason: "advice",
    pattern: /\b(aapko\s+chahiye|koshish\s+(kijiye|karein)|saans\s+lene\s+ki\s+koshish)\b/i,
    detail: "Hindi advice prescription",
  },

  // 2. Psychiatric Diagnosis & Clinical Labeling
  {
    reason: "diagnosis",
    pattern: /\b(depress(ion|ed|ive)|anxiety\s+disorder|panic\s+disorder|ptsd|post-traumatic)\b/i,
    detail: "Psychiatric diagnostic terms (depression, PTSD, anxiety)",
  },
  {
    reason: "diagnosis",
    pattern: /\b(trauma\s+response|symptoms?\s+of|bipolar|schizophreni(a|c)|mental\s+illness)\b/i,
    detail: "Clinical diagnostic framing",
  },
  {
    reason: "diagnosis",
    pattern: /\b(avsaad|manasik\s+rog|chinta\s+rog|डिप्रेशन|अवसाद|मानसिक\s*बीमारी)\b/i,
    detail: "Hindi clinical diagnosis terms",
  },

  // 3. False Reassurance & Dismissive Cheer
  {
    reason: "false_reassurance",
    pattern: /\b(everything\s+(will\s+be|is\s+going\s+to\s+be)\s+(fine|okay|alright))\b/i,
    detail: "False reassurance 'everything will be fine'",
  },
  {
    reason: "false_reassurance",
    pattern: /\b(it\s+(will|is\s+going\s+to)\s+be\s+(fine|okay|alright))\b/i,
    detail: "False reassurance 'it will be okay'",
  },
  {
    reason: "false_reassurance",
    pattern: /\b(do(nt|\s+not)\s+worry|dont\s+be\s+afraid)\b/i,
    detail: "Dismissive 'don't worry'",
  },
  {
    reason: "false_reassurance",
    pattern: /\b(it\s+will\s+get\s+better|this\s+will\s+pass|things\s+will\s+improve)\b/i,
    detail: "Unsubstantiated promise of improvement",
  },
  {
    reason: "false_reassurance",
    pattern: /\b(i\s+understand\s+how\s+you\s+feel|i\s+know\s+what\s+you\s+are\s+going\s+through)\b/i,
    detail: "False empathy claim",
  },
  {
    reason: "false_reassurance",
    pattern: /\b(sab\s+(theek|thik)\s+ho\s+jayega|chinta\s+mat\s+karo|fikr\s+mat\s+karo|सब\s*ठीक\s*हो\s*जाएगा|चिंता\s*मत\s*करो)\b/i,
    detail: "Hindi false reassurance",
  },

  // 4. Legal / Outcome Promises
  {
    reason: "outcome_promise",
    pattern: /\b(the\s+police\s+will|your\s+case\s+will|you\s+will\s+receive)\b/i,
    detail: "Outcome promise regarding police or relief",
  },
  {
    reason: "outcome_promise",
    pattern: /\b(charges\s+will\s+be|court\s+will|justice\s+will\s+be|we\s+will\s+win)\b/i,
    detail: "Legal outcome guarantee",
  },
  {
    reason: "outcome_promise",
    pattern: /\b(police\s+karegi|faisla\s+aapke\s+haq\s+mein|muawza\s+mil\s+jayega|पुलिस\s*करेगी|न्याय\s*मिलेगा)\b/i,
    detail: "Hindi legal outcome promise",
  },
]);

/**
 * Sanitizes LLM reply. Returns sanitized fallback if any violation is detected.
 */
export function checkOutput(
  reply: string | null | undefined,
  language: Language = "en"
): Pass2Result {
  const fallback = getStaticReply("fallback_reply", language);

  if (!reply || typeof reply !== "string" || !reply.trim()) {
    return {
      passed: false,
      reason: "excessive_length",
      violationDetail: "Empty or invalid LLM reply",
      sanitizedReply: fallback,
    };
  }

  const trimmed = reply.trim();

  // Rule A: Max 320 characters
  if (trimmed.length > 320) {
    return {
      passed: false,
      reason: "excessive_length",
      violationDetail: `Length (${trimmed.length}) exceeded maximum 320 characters`,
      sanitizedReply: fallback,
    };
  }

  // Rule B: Maximum 1 question mark
  const questionMarksCount = (trimmed.match(/\?/g) || []).length;
  if (questionMarksCount > 1) {
    return {
      passed: false,
      reason: "multiple_questions",
      violationDetail: `Found ${questionMarksCount} questions, maximum 1 allowed`,
      sanitizedReply: fallback,
    };
  }

  // Rule C: Banned output patterns
  for (const rule of BANNED_OUTPUT_RULES) {
    if (rule.pattern.test(trimmed)) {
      return {
        passed: false,
        reason: rule.reason,
        violationDetail: rule.detail,
        sanitizedReply: fallback,
      };
    }
  }

  // Rule D: Mirroring/repeating crisis terms from input lexicon
  const normalized = normalizeText(trimmed);
  for (const lexRule of LEXICON_RULES) {
    if (lexRule.pattern.test(normalized)) {
      return {
        passed: false,
        reason: "crisis_term",
        violationDetail: `Echoed crisis phrase: ${lexRule.description}`,
        sanitizedReply: fallback,
      };
    }
  }

  return {
    passed: true,
    sanitizedReply: trimmed,
  };
}
