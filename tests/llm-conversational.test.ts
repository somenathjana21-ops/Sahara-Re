import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST as checkinHandler } from "@/app/api/checkin/route";
import { analyzeTranscript } from "@/lib/llm";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/llm/prompt";
import { resetRepository } from "@/lib/db/repository";
import { PERSON_A4471, CONSENT_A4471 } from "@/scripts/fixtures";
import { CheckInResponse } from "@/types/contract";

describe("LLM Conversational Control & Anti-Fixation Suite", () => {
  beforeEach(() => {
    resetRepository();
  });

  it("should build user prompt containing conversation history and reference themes", () => {
    const prompt = buildUserPrompt(
      "A bit",
      "en",
      [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello. How are you feeling today?" },
        { role: "user", content: "I am feeling better" },
        { role: "assistant", content: "I am glad to hear that. How has your sleep been?" },
      ]
    );

    assert.ok(prompt.includes("Conversation history so far:"));
    assert.ok(prompt.includes("User: I am feeling better"));
    assert.ok(prompt.includes("Havenline (You): I am glad to hear that. How has your sleep been?"));
    assert.ok(prompt.includes('Latest user message to respond to:\n"""A bit"""'));
    assert.ok(prompt.includes("Core intake themes for reference"));
  });

  it("should allow LLM conversational freedom and prevent repetitive questions in system prompt", () => {
    assert.ok(SYSTEM_PROMPT.includes("full conversational control"));
    assert.ok(SYSTEM_PROMPT.includes("NEVER repeat questions"));
    assert.ok(SYSTEM_PROMPT.includes("Do NOT use repetitive formulas"));
  });

  it("should generate varied, context-aware replies across multi-turn conversation", async () => {
    // Turn 1: Greeting
    const t1 = await analyzeTranscript({
      transcript: "Hi",
      language: "en",
    });
    assert.ok(t1.reply);
    assert.ok(!t1.reply.includes("How have you been feeling since we last spoke?"));

    // Turn 2: Better
    const t2 = await analyzeTranscript({
      transcript: "I am feeling better",
      language: "en",
      history: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: t1.reply },
      ],
    });
    assert.ok(t2.reply);
    assert.ok(t2.reply.toLowerCase().includes("better"));

    // Turn 3: "A bit" (in response to sleep/rest)
    const t3 = await analyzeTranscript({
      transcript: "A bit",
      language: "en",
      history: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: t1.reply },
        { role: "user", content: "I am feeling better" },
        { role: "assistant", content: t2.reply },
      ],
    });
    assert.ok(t3.reply);
    // Must NOT be the repetitive loop question
    assert.notStrictEqual(t3.reply, t1.reply);

    // Turn 4: "Very bad"
    const t4 = await analyzeTranscript({
      transcript: "Very bad",
      language: "en",
      history: [
        { role: "user", content: "A bit" },
        { role: "assistant", content: t3.reply },
      ],
    });
    assert.ok(t4.reply);
    assert.strictEqual(t4.s2Score, 65);

    // Turn 5: "Death"
    const t5 = await analyzeTranscript({
      transcript: "Death",
      language: "en",
      history: [
        { role: "user", content: "Very bad" },
        { role: "assistant", content: t4.reply },
      ],
    });
    assert.ok(t5.reply);
    assert.strictEqual(t5.s2Score, 85);
  });

  it("should return warm confirmation when structured S1 check-in is submitted without text transcript", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: PERSON_A4471.id,
        consentId: CONSENT_A4471.id,
        channel: "chat",
        transcript: null,
        structured: { q1: 2, q2: 2, q3: 1 },
      }),
    });

    const res = await checkinHandler(req);
    assert.strictEqual(res.status, 200);

    const json: CheckInResponse = await res.json();
    assert.ok(
      json.reply.includes("दर्ज") ||
        json.reply.includes("wellbeing ratings") ||
        json.reply.includes("recorded")
    );
    assert.notStrictEqual(
      json.reply,
      "Thank you for sharing your thoughts. Your responses are being recorded securely, and our team is monitoring your check-in."
    );
  });

  it("should accept history payload in POST /api/checkin", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: PERSON_A4471.id,
        consentId: CONSENT_A4471.id,
        channel: "chat",
        transcript: "A bit",
        history: [
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello. How are you doing today?" },
          { role: "user", content: "I am feeling better" },
          { role: "assistant", content: "I'm glad to hear that. How has your sleep been?" },
        ],
      }),
    });

    const res = await checkinHandler(req);
    assert.strictEqual(res.status, 200);
    const json: CheckInResponse = await res.json();
    assert.strictEqual(json.status, "ok");
    assert.ok(json.reply);
  });

  it("should detect primary intake completion in Stage 3 and forbid repeating energy/safety questions", () => {
    const history = [
      { role: "user" as const, content: "Hi" },
      { role: "assistant" as const, content: "Hi there, thanks for reaching out. How are you feeling today?" },
      { role: "user" as const, content: "am feeling better" },
      { role: "assistant" as const, content: "I'm glad to hear you're feeling better. Have you noticed any changes in your sleep or appetite lately?" },
      { role: "user" as const, content: "i am unable to eat much" },
      { role: "assistant" as const, content: "It sounds like eating has been tough for you right now. Not being able to get enough food can be draining. Would you like to share if this is affecting your energy during the day?" },
      { role: "user" as const, content: "a bit" },
      { role: "assistant" as const, content: "I hear that it's only a bit, and that can still feel draining. How are you feeling about your safety right now?" },
    ];

    const prompt = buildUserPrompt("its somewhat okay", "en", history);

    // Verify prompt detects Stage 3 completion and bans repeating intake questions
    assert.ok(prompt.includes("STAGE 3 GUIDANCE (PRIMARY INTAKE COMPLETE"));
    assert.ok(prompt.includes("DO NOT ask any further intake questions about sleep, eating, energy, or safety"));
    assert.ok(prompt.includes("DO NOT repeat any questions or phrases from earlier messages"));
    assert.ok(prompt.includes("HOLDING SPACE"));
  });

  it("should respond with considerate synthesis and holding space instead of repeating energy question on 'its somewhat okay'", async () => {
    const history = [
      { role: "user" as const, content: "Hi" },
      { role: "assistant" as const, content: "Hi there, thanks for reaching out. How are you feeling today?" },
      { role: "user" as const, content: "am feeling better" },
      { role: "assistant" as const, content: "I'm glad to hear you're feeling better. Have you noticed any changes in your sleep or appetite lately?" },
      { role: "user" as const, content: "i am unable to eat much" },
      { role: "assistant" as const, content: "It sounds like eating has been tough for you right now. Not being able to get enough food can be draining. Would you like to share if this is affecting your energy during the day?" },
      { role: "user" as const, content: "a bit" },
      { role: "assistant" as const, content: "Thank you for letting me know. Even slight disruptions can be wearing. Do you feel safe in your environment right now?" },
    ];

    const turn5 = await analyzeTranscript({
      transcript: "its somewhat okay",
      language: "en",
      history,
    });

    assert.ok(turn5.reply);
    // Strict Anti-Repetition: Must NOT re-ask about energy levels!
    assert.ok(
      !turn5.reply.toLowerCase().includes("energy levels during the day"),
      `Reply unexpectedly repeated energy question: ${turn5.reply}`
    );
    // Must demonstrate considerate synthesis of appetite/energy and holding space
    assert.ok(
      turn5.reply.toLowerCase().includes("gentle") ||
        turn5.reply.toLowerCase().includes("safe") ||
        turn5.reply.toLowerCase().includes("appetite") ||
        turn5.reply.toLowerCase().includes("here whenever")
    );
  });
});
