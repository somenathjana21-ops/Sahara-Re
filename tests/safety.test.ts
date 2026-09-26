import { describe, it } from "node:test";
import assert from "node:assert";
import { checkInput, checkOutput } from "../lib/safety/interlock";
import { LEXICON_RULES, LEXICON_VERSION, REVIEWED_BY, normalizeText } from "../lib/safety/lexicon";
import { CRISIS_RESOURCES, REPLY_BANK, getCrisisResources, getStaticReply } from "../lib/safety/replies";

describe("Phase 2: Deterministic Safety Lexicon & Invariants", () => {
  it("should have review metadata and correct version tag", () => {
    assert.strictEqual(LEXICON_VERSION, "lexicon-v1.1.0");
    assert.ok(REVIEWED_BY.length > 0);
  });

  it("should enforce ZERO 'g' flags on all RegExp patterns in lexicon", () => {
    for (const rule of LEXICON_RULES) {
      assert.strictEqual(
        rule.pattern.global,
        false,
        `Rule ${rule.id} has illegal 'g' flag which causes stateful .test() bugs`
      );
    }
  });

  it("should correctly normalize English, Devanagari, and Romanised inputs", () => {
    assert.strictEqual(normalizeText("Don't Kill Myself!"), "dont kill myself");
    assert.strictEqual(normalizeText("जीना  नहीं   चाहता..."), "जीना नहीं चाहता");
    assert.strictEqual(normalizeText("Koi Rasta  Nahi?"), "koi rasta nahi");
  });
});

describe("Phase 2: 100% Recall on 40 Seeded Critical Phrases", () => {
  // 40 deterministic critical utterances across 4 categories and 3 language representations
  const SEEDED_CRITICAL_40: Array<{
    text: string;
    expectedCategory: "self_harm" | "hopelessness" | "immediate_danger" | "direct_request";
    language: "en" | "hi_dev" | "hi_rom";
  }> = [
    // ----------------------------------------------------
    // Category 1: Self-Harm Intent (14 phrases)
    // ----------------------------------------------------
    { text: "I want to kill myself tonight", expectedCategory: "self_harm", language: "en" },
    { text: "I just don't want to live anymore", expectedCategory: "self_harm", language: "en" },
    { text: "My family would be better off dead without me", expectedCategory: "self_harm", language: "en" },
    { text: "I am going to commit suicide", expectedCategory: "self_harm", language: "en" },
    { text: "I have decided to end my life", expectedCategory: "self_harm", language: "en" },
    { text: "I want to slit my wrist", expectedCategory: "self_harm", language: "en" },
    { text: "I took a rope to hang myself", expectedCategory: "self_harm", language: "en" },
    { text: "मैं अपनी जान देने जा रहा हूँ", expectedCategory: "self_harm", language: "hi_dev" },
    { text: "मुझे अब और जीना नहीं है", expectedCategory: "self_harm", language: "hi_dev" },
    { text: "मैं जहर खाकर मर जाना चाहता हूँ", expectedCategory: "self_harm", language: "hi_dev" },
    { text: "आज रात फांसी लगा लूंगा", expectedCategory: "self_harm", language: "hi_dev" },
    { text: "aaj jaan de dunga main", expectedCategory: "self_harm", language: "hi_rom" },
    { text: "mujhe ab jeena nahi hai", expectedCategory: "self_harm", language: "hi_rom" },
    { text: "marna chahta hoon ab main", expectedCategory: "self_harm", language: "hi_rom" },

    // ----------------------------------------------------
    // Category 2: Hopelessness + Finality (14 phrases)
    // ----------------------------------------------------
    { text: "There is absolutely no way out for me", expectedCategory: "hopelessness", language: "en" },
    { text: "Nothing is left for me in this world", expectedCategory: "hopelessness", language: "en" },
    { text: "I give up completely on this fight", expectedCategory: "hopelessness", language: "en" },
    { text: "I cannot take this anymore, I am broken", expectedCategory: "hopelessness", language: "en" },
    { text: "I cant go on living like this", expectedCategory: "hopelessness", language: "en" },
    { text: "Everything is completely hopeless", expectedCategory: "hopelessness", language: "en" },
    { text: "Please read this as my final note, goodbye everyone", expectedCategory: "hopelessness", language: "en" },
    { text: "अब कोई रास्ता नहीं बचा है हमारे लिए", expectedCategory: "hopelessness", language: "hi_dev" },
    { text: "मेरी हिम्मत टूट गई है अब", expectedCategory: "hopelessness", language: "hi_dev" },
    { text: "अब मुझसे यह अत्याचार बर्दाश्त नहीं होता", expectedCategory: "hopelessness", language: "hi_dev" },
    { text: "हमारा सब खत्म हो गया है", expectedCategory: "hopelessness", language: "hi_dev" },
    { text: "koi rasta nahi bacha ab", expectedCategory: "hopelessness", language: "hi_rom" },
    { text: "ab bardasht nahi hota mujhse", expectedCategory: "hopelessness", language: "hi_rom" },
    { text: "meri himmat toot gayi ab give up kar diya", expectedCategory: "hopelessness", language: "hi_rom" },

    // ----------------------------------------------------
    // Category 3: Immediate Danger (6 phrases)
    // ----------------------------------------------------
    { text: "They are here right now breaking in", expectedCategory: "immediate_danger", language: "en" },
    { text: "The accused is coming for me now with weapons", expectedCategory: "immediate_danger", language: "en" },
    { text: "They surrounded my house and will kill me", expectedCategory: "immediate_danger", language: "en" },
    { text: "वे लोग आ गए हैं मुझे जान से मार देंगे", expectedCategory: "immediate_danger", language: "hi_dev" },
    { text: "हथियार लेके घर घेर लिया है", expectedCategory: "immediate_danger", language: "hi_dev" },
    { text: "wo aa gaye hain hathiyar leke jaan se maar denge", expectedCategory: "immediate_danger", language: "hi_rom" },

    // ----------------------------------------------------
    // Category 4: Direct Request (6 phrases)
    // ----------------------------------------------------
    { text: "Please help me, I am in extreme distress", expectedCategory: "direct_request", language: "en" },
    { text: "Emergency SOS call the police right now", expectedCategory: "direct_request", language: "en" },
    { text: "Please rescue me and save me", expectedCategory: "direct_request", language: "en" },
    { text: "मदद करो मुझे तुरंत पुलिस बुलाओ", expectedCategory: "direct_request", language: "hi_dev" },
    { text: "कोई मदद करो मुझे बचा लो", expectedCategory: "direct_request", language: "hi_dev" },
    { text: "bachao mujhe please turant police bulao", expectedCategory: "direct_request", language: "hi_rom" },
  ];

  it("should have exactly 40 seeded critical phrases in the test matrix", () => {
    assert.strictEqual(SEEDED_CRITICAL_40.length, 40);
  });

  for (let i = 0; i < SEEDED_CRITICAL_40.length; i++) {
    const item = SEEDED_CRITICAL_40[i]!;
    it(`[Critical #${i + 1} / 40] [${item.language}] (${item.expectedCategory}) should trigger Pass 1 CRITICAL`, () => {
      const res = checkInput(item.text);
      assert.strictEqual(
        res.hit,
        true,
        `Expected phrase to trigger crisis match: "${item.text}"`
      );
      assert.strictEqual(
        res.category,
        item.expectedCategory,
        `Category mismatch for phrase "${item.text}". Expected ${item.expectedCategory}, got ${res.category}`
      );
    });
  }
});

describe("Phase 2: Negation Handling & Safe-Fail Invariant", () => {
  it("should trigger CRITICAL on negated crisis statements (fails safe)", () => {
    const negationCases = [
      "I do not want to die",
      "I don't want to kill myself today",
      "It is not like I want to die",
      "Mujhe marna nahi hai",
      "jeena nahi chahta aisa bilkul nahi hai",
    ];

    for (const phrase of negationCases) {
      const res = checkInput(phrase);
      assert.strictEqual(
        res.hit,
        true,
        `Negation phrase must still fire crisis trigger: "${phrase}"`
      );
    }
  });

  it("should NOT trigger CRITICAL on benign neutral statements", () => {
    const benignCases = [
      "I went to the market yesterday.",
      "The court date was scheduled for next month.",
      "I ate dinner and rested for a while.",
      "kal hum gaon gaye the aur sab theek tha",
      "आज मौसम अच्छा है और हम घर पर हैं",
    ];

    for (const phrase of benignCases) {
      const res = checkInput(phrase);
      assert.strictEqual(
        res.hit,
        false,
        `Benign phrase falsely triggered crisis match: "${phrase}"`
      );
    }
  });
});

describe("Phase 2: Pass 2 LLM Output Sanitization", () => {
  it("should reject prescriptive clinical advice and substitute fallback", () => {
    const adviceSamples = [
      "You should try taking deep breaths right now.",
      "I recommend that you go for a walk outside.",
      "What helps is exercising and doing yoga daily.",
      "Aapko chahiye ki thoda dhyan lagayein aur aaram karein.",
    ];

    for (const sample of adviceSamples) {
      const res = checkOutput(sample, "en");
      assert.strictEqual(res.passed, false);
      assert.strictEqual(res.reason, "advice");
      assert.strictEqual(res.sanitizedReply, REPLY_BANK.en.fallback_reply);
    }
  });

  it("should reject psychiatric diagnoses and substitute fallback", () => {
    const diagnosisSamples = [
      "It seems like you are suffering from clinical depression.",
      "These are classic symptoms of post-traumatic stress disorder (PTSD).",
      "You might have severe anxiety disorder based on this.",
      "lagta hai aapko avsaad ya manasik bimari ke lakshan hain.",
    ];

    for (const sample of diagnosisSamples) {
      const res = checkOutput(sample, "en");
      assert.strictEqual(res.passed, false);
      assert.strictEqual(res.reason, "diagnosis");
      assert.strictEqual(res.sanitizedReply, REPLY_BANK.en.fallback_reply);
    }
  });

  it("should reject false reassurance and dismissive cheer", () => {
    const reassuranceSamples = [
      "Don't worry, everything will be fine very soon.",
      "It is going to be okay, trust the process.",
      "I understand how you feel completely.",
      "Chinta mat karo sab theek ho jayega jaldi.",
    ];

    for (const sample of reassuranceSamples) {
      const res = checkOutput(sample, "en");
      assert.strictEqual(res.passed, false);
      assert.strictEqual(res.reason, "false_reassurance");
      assert.strictEqual(res.sanitizedReply, REPLY_BANK.en.fallback_reply);
    }
  });

  it("should reject legal outcome promises", () => {
    const promiseSamples = [
      "The police will arrest the accused tomorrow morning.",
      "We will win this case and justice will be served.",
      "You will receive your compensation next week for sure.",
    ];

    for (const sample of promiseSamples) {
      const res = checkOutput(sample, "en");
      assert.strictEqual(res.passed, false);
      assert.strictEqual(res.reason, "outcome_promise");
      assert.strictEqual(res.sanitizedReply, REPLY_BANK.en.fallback_reply);
    }
  });

  it("should reject echoed crisis phrases from lexicon", () => {
    const echoedSamples = [
      "I heard you say that you want to kill myself.",
      "You mentioned that there is no way out for you.",
      "aapne kaha ki koi rasta nahi bacha.",
    ];

    for (const sample of echoedSamples) {
      const res = checkOutput(sample, "en");
      assert.strictEqual(res.passed, false);
      assert.strictEqual(res.reason, "crisis_term");
      assert.strictEqual(res.sanitizedReply, REPLY_BANK.en.fallback_reply);
    }
  });

  it("should reject output exceeding 320 characters", () => {
    const longText = "A".repeat(325);
    const res = checkOutput(longText, "en");
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.reason, "excessive_length");
  });

  it("should reject output containing more than one question mark", () => {
    const multiQuestion = "How are you feeling today? Did you get any sleep last night?";
    const res = checkOutput(multiQuestion, "en");
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.reason, "multiple_questions");
  });

  it("should pass compliant and supportive responses untouched", () => {
    const compliantResponse = "I hear you, and I am listening carefully. How has your rest been over the past day?";
    const res = checkOutput(compliantResponse, "en");
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.sanitizedReply, compliantResponse);
  });

  it("should return Hindi fallback when language is 'hi'", () => {
    const badReply = "You should try breathing exercises.";
    const res = checkOutput(badReply, "hi");
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.sanitizedReply, REPLY_BANK.hi.fallback_reply);
  });
});

describe("Phase 2: Static Reply Bank & Crisis Resources", () => {
  it("should provide official 24/7 helpline resources for both English and Hindi", () => {
    const enResources = getCrisisResources("en");
    const hiResources = getCrisisResources("hi");

    assert.strictEqual(enResources.length, 4);
    assert.strictEqual(hiResources.length, 4);

    const enNumbers = enResources.map((r) => r.number);
    assert.ok(enNumbers.includes("14566"), "Must contain NHAA 14566");
    assert.ok(enNumbers.includes("14416"), "Must contain Tele-MANAS 14416");
    assert.ok(enNumbers.includes("1800-599-0019"), "Must contain Kiran 1800-599-0019");
    assert.ok(enNumbers.includes("112"), "Must contain National Emergency 112");
  });

  it("should provide all mandatory static replies in both languages", () => {
    const keys: (keyof typeof REPLY_BANK.en)[] = [
      "consent_notice",
      "crisis_immediate",
      "fallback_reply",
      "llm_unavailable",
      "closing_low",
      "closing_med",
      "minor_detected",
      "wrong_person",
    ];

    for (const key of keys) {
      const enText = getStaticReply(key, "en");
      const hiText = getStaticReply(key, "hi");

      assert.ok(enText && enText.length > 10, `Missing English text for ${key}`);
      assert.ok(hiText && hiText.length > 10, `Missing Hindi text for ${key}`);
    }
  });
});
