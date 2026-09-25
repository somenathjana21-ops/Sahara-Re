"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  ShieldAlert,
  AlertTriangle,
  User,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Phone,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Scale,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CrisisHelplinesModal from "@/components/common/CrisisHelplinesModal";
import {
  CheckInRequest,
  CheckInResponse,
  StructuredCheckin,
  ResourceItem,
} from "@/types/contract";

interface ChatMessage {
  id: string;
  sender: "user" | "sahara" | "system";
  text: string;
  timestamp: string;
  tier?: string;
  resources?: ResourceItem[];
  isCritical?: boolean;
  isMinor?: boolean;
}

// Seed personas for seamless interactive testing & demonstration
const PRESET_PERSONAS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    consentId: "11111111-3333-1111-1111-111111111111",
    pseudonym: "A-4471",
    label: "A-4471 (Golden Path — Land Dispossession, Trial hearing in 6 days, Accused on bail)",
    language: "hi",
    isMinor: false,
    s3Standing: 90,
  },
  {
    id: "22222222-1111-2222-2222-222222222222",
    consentId: "22222222-3333-2222-2222-222222222222",
    pseudonym: "A-6218",
    label: "A-6218 (Minor Flag — Direct Caseworker Diversion, Zero automated scoring)",
    language: "hi",
    isMinor: true,
    s3Standing: 0,
  },
  {
    id: "33333333-1111-3333-3333-333333333333",
    consentId: "33333333-3333-3333-3333-333333333333",
    pseudonym: "A-2301",
    label: "A-2301 (Stable Control Persona — Green Tier Baseline)",
    language: "en",
    isMinor: false,
    s3Standing: 10,
  },
  {
    id: "44444444-1111-4444-4444-444444444444",
    consentId: "44444444-3333-4444-4444-444444444444",
    pseudonym: "A-7892",
    label: "A-7892 (Engagement Monotonicity — 3 Missed Check-ins, Amber Floor)",
    language: "hi",
    isMinor: false,
    s3Standing: 25,
  },
];

export default function CheckinPage() {
  const { t, language } = useLanguage();

  // Active persona state
  const [selectedPersona, setSelectedPersona] = useState(PRESET_PERSONAS[0]);
  const [hasConsent, setHasConsent] = useState(true);
  const [consentLoading, setConsentLoading] = useState(false);

  // Self-report structured answers (S1)
  const [q1, setQ1] = useState<number | undefined>(undefined);
  const [q2, setQ2] = useState<number | undefined>(undefined);
  const [q3, setQ3] = useState<number | undefined>(undefined);

  // Chat message thread
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Instant emergency helpline modal
  const [isHelplineModalOpen, setIsHelplineModalOpen] = useState(false);
  const [helplineTriggerReason, setHelplineTriggerReason] = useState<string | undefined>(
    undefined
  );

  // Auto-scroll chat to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: "msg-welcome",
        sender: "sahara",
        text: t(
          "checkin.systemWelcome",
          "Hello. Thank you for connecting today. Please take your time, and share only what you feel comfortable sharing. We are here to support you."
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [selectedPersona, language]);

  // Handle Talk to a Person (Emergency Helpline)
  // Acceptance Criterion 3: Immediately renders crisis helplines locally without network delay
  const handleTalkToPersonClick = () => {
    setHelplineTriggerReason(
      language === "hi"
        ? "उपयोगकर्ता द्वारा 'किसी व्यक्ति से बात करें' बटन का अनुरोध किया गया"
        : "Direct request via 'Talk to a Person' panic button"
    );
    setIsHelplineModalOpen(true);
  };

  // Toggle consent for testing 403 Forbidden branch
  const handleConsentToggle = async () => {
    setConsentLoading(true);
    try {
      if (hasConsent) {
        // Revoke consent
        await fetch("/api/consent", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId: selectedPersona.id }),
        });
        setHasConsent(false);
      } else {
        // Grant consent
        const res = await fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: selectedPersona.id,
            purpose: "distress_monitoring",
            captureMethod: "tap",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedPersona((prev) => ({
            ...prev,
            consentId: data.consent.id,
          }));
          setHasConsent(true);
        }
      }
    } catch (e) {
      console.error("Consent toggle error:", e);
    } finally {
      setConsentLoading(false);
    }
  };

  // Submit check-in
  const handleSubmitCheckin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() && q1 === undefined && q2 === undefined && q3 === undefined) {
      return;
    }

    const currentText = inputVal.trim();
    const userMsgId = `user-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user message if text was entered
    if (currentText) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: "user",
          text: currentText,
          timestamp: nowTime,
        },
      ]);
      setInputVal("");
    }

    // Check if q3 was set to 4 locally to warn or trigger modal
    if (q3 === 4) {
      setHelplineTriggerReason(
        language === "hi"
          ? "आत्म-मूल्यांकन Q3 (सुरक्षा स्थिति) में 'खतरा / असुरक्षित' दर्ज किया गया"
          : "Self-report Q3 indicated imminent danger ('No, not safe')"
      );
      setIsHelplineModalOpen(true);
    }

    setSubmitting(true);

    try {
      const structured: StructuredCheckin = {};
      if (q1 !== undefined) structured.q1 = q1;
      if (q2 !== undefined) structured.q2 = q2;
      if (q3 !== undefined) structured.q3 = q3;

      const payload: CheckInRequest = {
        personId: selectedPersona.id,
        consentId: selectedPersona.consentId,
        channel: "chat",
        transcript: currentText || null,
        structured: Object.keys(structured).length > 0 ? structured : undefined,
        abandoned: false,
      };

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: CheckInResponse = await res.json();

      if (res.status === 403 || data.status === "forbidden") {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: "system",
            text:
              data.reply ||
              (language === "hi"
                ? "सहमति के बिना चेक-इन संसाधित नहीं किया जा सकता। कृपया ऊपर स्वैच्छिक सहमति की पुष्टि करें।"
                : "Check-in cannot be processed without active consent. Please grant voluntary consent above."),
            timestamp: nowTime,
          },
        ]);
        setHasConsent(false);
      } else if (data.status === "minor_routed") {
        setMessages((prev) => [
          ...prev,
          {
            id: `sahara-${Date.now()}`,
            sender: "sahara",
            text: data.reply,
            timestamp: nowTime,
            isMinor: true,
            resources: data.resources,
          },
        ]);
      } else if (data.status === "critical") {
        // Instant crisis triggered by lexicon or Q3
        setMessages((prev) => [
          ...prev,
          {
            id: `sahara-${Date.now()}`,
            sender: "sahara",
            text: data.reply,
            timestamp: nowTime,
            tier: "CRITICAL",
            isCritical: true,
            resources: data.resources,
          },
        ]);
        // Also open helplines modal
        setHelplineTriggerReason(
          language === "hi"
            ? "सिस्टम द्वारा अति-महत्वपूर्ण संकट इंटरलॉक सक्रिय किया गया"
            : "System Safety Interlock triggered Pass 1 Critical alert"
        );
        setIsHelplineModalOpen(true);
      } else {
        // Standard normal response
        setMessages((prev) => [
          ...prev,
          {
            id: `sahara-${Date.now()}`,
            sender: "sahara",
            text: data.reply,
            timestamp: nowTime,
            tier: data.tier,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "system",
          text:
            language === "hi"
              ? "नेटवर्क अनुरोध में त्रुटि हुई। कृपया पुनः प्रयास करें या आपातकालीन हेल्पलाइन पर सीधे संपर्क करें।"
              : "Unable to connect to check-in service. Please try again or call emergency helplines directly.",
          timestamp: nowTime,
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-welcome-new",
        sender: "sahara",
        text: t(
          "checkin.systemWelcome",
          "Hello. Thank you for connecting today. Please take your time, and share only what you feel comfortable sharing. We are here to support you."
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setQ1(undefined);
    setQ2(undefined);
    setQ3(undefined);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
      {/* Top Bar: Title & Direct Human Referral Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t("checkin.pageTitle", "Confidential Check-in")}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t(
              "checkin.pageSubtitle",
              "A calm, voluntary space to reflect on how you are feeling today."
            )}
          </p>
        </div>

        {/* Talk to a Person Button (Instant Local Modal Render) */}
        <button
          onClick={handleTalkToPersonClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-sm font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <Phone className="w-4 h-4 text-rose-700 animate-pulse" />
          <span>{t("checkin.panicButton", "Talk to a Person (Emergency Helplines)")}</span>
        </button>
      </div>

      {/* Interactive Persona Selector (for Demo & Evaluation) */}
      <div className="p-3.5 mb-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700">
            {t("checkin.activePersona", "Active Persona Profile:")}
          </span>
          <select
            value={selectedPersona.id}
            onChange={(e) => {
              const p = PRESET_PERSONAS.find((item) => item.id === e.target.value);
              if (p) setSelectedPersona(p);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-primary text-xs"
          >
            {PRESET_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Docket Pressure Badge */}
        {selectedPersona.s3Standing > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            <Scale className="w-3.5 h-3.5 text-amber-700" />
            <span>
              {t("checkin.caseContextBanner", "Case Docket Context (S3 Standing Score)")}:{" "}
              <strong>{selectedPersona.s3Standing} pts</strong>
            </span>
          </div>
        )}
      </div>

      {/* Voluntary Consent Notice Banner */}
      <div
        className={`p-4 mb-6 rounded-2xl border transition-all ${
          hasConsent
            ? "bg-emerald-50/60 border-emerald-200 text-slate-800"
            : "bg-amber-50 border-amber-200 text-slate-900"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {hasConsent ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  {t("checkin.consentBannerTitle", "Voluntary Consent Notice")}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hasConsent
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-200 text-amber-900"
                  }`}
                >
                  {hasConsent
                    ? t("checkin.consentActive", "Consent Granted (Active)")
                    : t("checkin.consentRevoked", "Consent Revoked")}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t(
                  "checkin.consentNoticeText",
                  "This check-in is completely voluntary. Your answers help us understand your wellbeing and will never affect your compensation, relief claim, or court proceedings."
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleConsentToggle}
            disabled={consentLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
              hasConsent
                ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                : "bg-primary hover:bg-emerald-800 text-white border-primary"
            }`}
          >
            {hasConsent
              ? t("checkin.consentButtonRevoke", "Withdraw / Revoke Consent")
              : t("checkin.consentButtonGrant", "I Agree & Consent to Check-in")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: S1 Structured Wellbeing Scale (Questions q1, q2, q3) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t("checkin.s1Header", "Self-Report Wellbeing Scale (S1)")}</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Optional</span>
          </div>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            {t(
              "checkin.s1Explanation",
              "Answering these questions is optional. They help us gauge how you are coping today."
            )}
          </p>

          <div className="space-y-5">
            {/* Question 1: Overall distress */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                {t(
                  "checkin.q1Title",
                  "1. Overall distress or emotional pressure today:"
                )}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQ1(q1 === val ? undefined : val)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      q1 === val
                        ? "bg-primary text-white border-primary shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-0.5">
                <span>{t("checkin.q1Opt0", "0 — Calm")}</span>
                <span>{t("checkin.q1Opt4", "4 — Overwhelming")}</span>
              </div>
            </div>

            {/* Question 2: Sleep and rest */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                {t(
                  "checkin.q2Title",
                  "2. Sleep and physical rest over the past day:"
                )}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQ2(q2 === val ? undefined : val)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      q2 === val
                        ? "bg-primary text-white border-primary shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-0.5">
                <span>{t("checkin.q2Opt0", "0 — Restful")}</span>
                <span>{t("checkin.q2Opt4", "4 — No sleep")}</span>
              </div>
            </div>

            {/* Question 3: Safety (CRITICAL Trigger when set to 4) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-900 mb-1">
                {t(
                  "checkin.q3Title",
                  "3. Do you feel safe where you are right now?"
                )}
              </label>
              <p className="text-[11px] text-rose-700 mb-2.5 font-medium">
                {t(
                  "checkin.q3SafetyWarning",
                  "Important: Answering 'No' indicates danger and will trigger immediate priority support."
                )}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQ3(q3 === val ? undefined : val)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      q3 === val
                        ? val === 4
                          ? "bg-rose-700 text-white border-rose-800 shadow-2xs"
                          : "bg-primary text-white border-primary shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 px-0.5">
                <span>{t("checkin.q3Opt0", "0 — Completely safe")}</span>
                <span className="text-rose-700 font-bold">
                  {t("checkin.q3Opt4", "4 — NOT safe / Danger")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Conversational Dialogue Area */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[580px]">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-slate-900">
                {t("checkin.chatHeader", "Dialogue & Thoughts")}
              </span>
            </div>
            <button
              onClick={clearChat}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t("checkin.clearChat", "Clear Conversation")}</span>
            </button>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{msg.text}</span>
                  </div>
                );
              }

              if (msg.sender === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] bg-primary text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs">
                      <p>{msg.text}</p>
                      <span className="block text-[10px] text-emerald-200 text-right mt-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              }

              // Assistant / Havenline message
              return (
                <div key={msg.id} className="flex justify-start">
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm leading-relaxed border shadow-2xs ${
                      msg.isCritical
                        ? "bg-rose-50 border-rose-200 text-slate-900"
                        : msg.isMinor
                        ? "bg-blue-50 border-blue-200 text-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {/* Header tag */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-xs text-primary">Havenline</span>
                      {msg.tier && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            msg.tier === "CRITICAL" || msg.tier === "RED"
                              ? "bg-rose-100 text-rose-800"
                              : msg.tier === "AMBER"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          Tier: {msg.tier}
                        </span>
                      )}
                    </div>

                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Resources list if crisis triggered */}
                    {msg.resources && msg.resources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-rose-200/80 space-y-2">
                        <span className="block font-bold text-xs text-rose-800">
                          {t("checkin.resourcesTitle", "Immediate Emergency Helplines (24/7 Toll-Free)")}:
                        </span>
                        <div className="space-y-1.5">
                          {msg.resources.map((r, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-white border border-rose-200 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block">{r.name}</span>
                                <span className="text-[11px] text-slate-500">{r.description}</span>
                              </div>
                              <a
                                href={`tel:${r.number}`}
                                className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shrink-0 ml-2"
                              >
                                {r.number}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="block text-[10px] text-slate-400 mt-1.5">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input & Submit */}
          <form
            onSubmit={handleSubmitCheckin}
            className="p-3.5 border-t border-slate-100 bg-white rounded-b-2xl flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={t(
                "checkin.inputPlaceholder",
                "Type how you are feeling or what happened today..."
              )}
              disabled={submitting}
              className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-primary focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={
                submitting ||
                (!inputVal.trim() && q1 === undefined && q2 === undefined && q3 === undefined)
              }
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? t("checkin.sending", "Processing...")
                  : t("checkin.sendButton", "Submit Check-in")}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Emergency Helplines Modal (Renders without network delay) */}
      <CrisisHelplinesModal
        isOpen={isHelplineModalOpen}
        onClose={() => setIsHelplineModalOpen(false)}
        triggerReason={helplineTriggerReason}
      />
    </div>
  );
}
