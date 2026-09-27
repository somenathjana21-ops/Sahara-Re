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
  SlidersHorizontal,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CrisisHelplinesModal from "@/components/common/CrisisHelplinesModal";
import CustomDataModal from "@/components/common/CustomDataModal";
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

import { PRESET_PERSONAS, PresetPersona } from "@/lib/constants/personas";

export default function CheckinPage() {
  const { t, language } = useLanguage();

  // Active persona state
  const [personas, setPersonas] = useState<PresetPersona[]>(PRESET_PERSONAS);
  const [selectedPersona, setSelectedPersona] = useState<PresetPersona>(PRESET_PERSONAS[0]!);
  const [customPersona, setCustomPersona] = useState<PresetPersona | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState(true);
  const [consentLoading, setConsentLoading] = useState(false);

  // Self-report structured answers (S1)
  const [q1, setQ1] = useState<number | undefined>(undefined);
  const [q2, setQ2] = useState<number | undefined>(undefined);
  const [q3, setQ3] = useState<number | undefined>(undefined);
  const [s1SubmittedInSession, setS1SubmittedInSession] = useState(false);

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

  // Sync available persons from backend repository on mount
  useEffect(() => {
    async function loadPersons() {
      try {
        const res = await fetch("/api/persons");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.persons)) {
            setPersonas((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const existingPseudos = new Set(prev.map((p) => p.pseudonym));
              const extras: PresetPersona[] = [];
              for (const p of data.persons) {
                if (!existingIds.has(p.id) && !existingPseudos.has(p.pseudonym)) {
                  extras.push({
                    id: p.id,
                    consentId: p.consentId || p.id,
                    pseudonym: p.pseudonym,
                    label: `${p.pseudonym} — Self-Directed Profile`,
                    language: p.language,
                    isMinor: p.is_minor_flag,
                    s3Standing: p.s3Standing || 0,
                    isCustom: true,
                  });
                }
              }
              return [...prev, ...extras];
            });
          }
        }
      } catch {
        // Fallback to presets
      }
    }
    loadPersons();
  }, []);

  // Match Persona history & check-in timeline when selectedPersona changes
  useEffect(() => {
    let isMounted = true;
    setQ1(undefined);
    setQ2(undefined);
    setQ3(undefined);
    setS1SubmittedInSession(false);

    async function loadPersonaHistory() {
      try {
        const res = await fetch(`/api/persons?personId=${encodeURIComponent(selectedPersona.id)}`);
        if (!res.ok) {
          if (isMounted) {
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
          }
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        if (data.consent?.id) {
          setSelectedPersona((prev) => ({
            ...prev,
            consentId: data.consent.id,
            s3Standing: data.s3Standing !== undefined ? data.s3Standing : prev.s3Standing,
          }));
          setHasConsent(true);
        } else if (data.consent === null) {
          setHasConsent(false);
        }

        const checkins = data.checkins || [];

        if (checkins.length > 0) {
          // User has previous check-ins! Match with that day & history
          const msgs: ChatMessage[] = [];

          checkins.forEach((c: any, index: number) => {
            const dateStr = c.created_at
              ? new Date(c.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
              : `Day -${checkins.length - index}`;

            if (c.transcript) {
              msgs.push({
                id: `msg-prior-${c.id || index}`,
                sender: "user",
                text: c.transcript,
                timestamp: `${dateStr} • Prior Check-in`,
              });
            }
          });

          // Greeting matching return after missed check-in or regular interval
          const missedCount = data.person?.missed_count || 0;
          let returningText = "";

          if (missedCount > 0) {
            returningText =
              language === "hi"
                ? `नमस्ते ${selectedPersona.pseudonym}। हमें खुशी है कि आप पुनः जुड़े हैं। कृपया आराम से बताएं कि आज आप कैसा महसूस कर रहे हैं, हम सुनने के लिए उपस्थित हैं।`
                : `Welcome back, ${selectedPersona.pseudonym}. We noticed you were unable to check in recently. Please take your time, and share how you are doing today.`;
          } else {
            returningText =
              language === "hi"
                ? `नमस्ते ${selectedPersona.pseudonym}। सहारा में आपका पुनः स्वागत है। कृपया बताएं कि आज आपका दिन कैसा बीत रहा है।`
                : `Welcome back, ${selectedPersona.pseudonym}. Thank you for connecting again. How have you been feeling since we last connected?`;
          }

          msgs.push({
            id: `msg-welcome-returning-${Date.now()}`,
            sender: "sahara",
            text: returningText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });

          setMessages(msgs);
        } else {
          // First check-in
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
        }
      } catch (err) {
        if (isMounted) {
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
        }
      }
    }

    loadPersonaHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedPersona.id, language]);

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
          setSelectedPersona((prev): PresetPersona => ({
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

  // Submit S1 structured questions (q1, q2, q3)
  const handleSubmitS1Questions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (s1SubmittedInSession) return;
    if (q1 === undefined && q2 === undefined && q3 === undefined) {
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
        transcript: null,
        structured: Object.keys(structured).length > 0 ? structured : undefined,
        abandoned: false,
      };

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: CheckInResponse = await res.json();
      if (res.ok) {
        setS1SubmittedInSession(true);
      }

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
        setHelplineTriggerReason(
          language === "hi"
            ? "सिस्टम द्वारा अति-महत्वपूर्ण संकट इंटरलॉक सक्रिय किया गया"
            : "System Safety Interlock triggered Pass 1 Critical alert"
        );
        setIsHelplineModalOpen(true);
      } else {
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

  // Submit check-in (chat input only, or with S1 if not already submitted)
  const handleSubmitCheckin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) {
      return;
    }

    const currentText = inputVal.trim();
    const userMsgId = `user-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user message
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

    setSubmitting(true);

    try {
      // Only include S1 answers once in a session if they haven't been submitted yet
      let structured: StructuredCheckin | undefined = undefined;
      if (!s1SubmittedInSession && (q1 !== undefined || q2 !== undefined || q3 !== undefined)) {
        structured = {};
        if (q1 !== undefined) structured.q1 = q1;
        if (q2 !== undefined) structured.q2 = q2;
        if (q3 !== undefined) structured.q3 = q3;
        setS1SubmittedInSession(true);
      }

      // Extract recent dialogue history (both user and Havenline messages) so LLM has full context
      const chatHistory = messages
        .filter((m) => (m.sender === "user" || m.sender === "sahara") && m.text && m.text.trim().length > 0)
        .slice(-10)
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.text,
        }));

      const payload: CheckInRequest = {
        personId: selectedPersona.id,
        consentId: selectedPersona.consentId,
        channel: "chat",
        transcript: currentText,
        structured: structured,
        abandoned: false,
        history: chatHistory,
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
        setHelplineTriggerReason(
          language === "hi"
            ? "सिस्टम द्वारा अति-महत्वपूर्ण संकट इंटरलॉक सक्रिय किया गया"
            : "System Safety Interlock triggered Pass 1 Critical alert"
        );
        setIsHelplineModalOpen(true);
      } else {
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
    setS1SubmittedInSession(false);
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

      {/* Interactive Profile & Persona Mode Switcher */}
      <div className="p-4 mb-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
            <button
              type="button"
              onClick={() => {
                setSelectedPersona(PRESET_PERSONAS[0]!);
                setHasConsent(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !selectedPersona.isCustom
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t("checkin.tabPresetPersonas", "Preset Demo Personas")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (customPersona) {
                  setSelectedPersona(customPersona);
                  setHasConsent(true);
                } else {
                  setIsCustomModalOpen(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedPersona.isCustom
                  ? "bg-primary text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t("checkin.tabWithoutPersona", "Without Persona (Self-Directed)")}</span>
            </button>
          </div>

          {/* Legal Case Context Indicator (Zero Points Exposed) */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPersona.s3Standing > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {t("checkin.caseContextLinked", "Legal Case Context Linked")}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                <HeartHandshake className="w-3.5 h-3.5 text-slate-500" />
                <span>{t("checkin.generalCheckin", "General Wellbeing Check-in")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Controls based on selected mode */}
        {!selectedPersona.isCustom ? (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">
              {t("checkin.activePersona", "Active Persona Profile:")}
            </span>
            <select
              value={selectedPersona.id}
              onChange={(e) => {
                const p = personas.find((item) => item.id === e.target.value);
                if (p) {
                  setSelectedPersona(p);
                  setHasConsent(true);
                }
              }}
              className="flex-1 max-w-md px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-primary text-xs"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">Custom Profile:</span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-mono font-bold">
                {selectedPersona.pseudonym}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Lang: <strong>{selectedPersona.language.toUpperCase()}</strong>
              </span>
              {selectedPersona.isMinor && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    Minor (Caseworker Safe Routing)
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>{t("checkin.editCustomData", "Edit Profile & Case Data")}</span>
            </button>
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
        {!s1SubmittedInSession ? (
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>{t("checkin.s1Header", "Self-Report Wellbeing Scale (S1)")}</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setS1SubmittedInSession(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
                >
                  {t("checkin.skipS1", "Skip for this session")}
                </button>
                <span className="text-[11px] text-slate-400 font-medium">Optional</span>
              </div>
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

            {/* Submit S1 Questions Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSubmitS1Questions}
                disabled={
                  submitting ||
                  (q1 === undefined && q2 === undefined && q3 === undefined)
                }
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submitting
                    ? t("checkin.sending", "Processing...")
                    : t("checkin.submitS1Button", "Submit Self-Report Questions")}
                </span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                {t(
                  "checkin.submitS1Hint",
                  "Submits only the 3 wellbeing questions above. Chat input below can be submitted separately."
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-emerald-200/80 bg-emerald-50/20 shadow-2xs transition-all">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-100 mb-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {t("checkin.s1RecordedTitle", "Wellbeing Self-Report Recorded")}
                </h2>
                <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                  {t("checkin.s1OnceSession", "Recorded once for active session")}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {t(
                "checkin.s1RecordedDesc",
                "Your wellbeing scale responses have been submitted for this check-in session. Subsequent messages will focus entirely on your conversation with Havenline."
              )}
            </p>

            {/* Summary Chips */}
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">{t("checkin.q1Short", "Emotional Distress:")}</span>
                <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                  {q1 !== undefined ? `${q1} / 4` : t("checkin.skipped", "Skipped")}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">{t("checkin.q2Short", "Sleep & Rest:")}</span>
                <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                  {q2 !== undefined ? `${q2} / 4` : t("checkin.skipped", "Skipped")}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">{t("checkin.q3Short", "Safety Status:")}</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded font-mono text-[11px] ${
                    q3 === 4
                      ? "bg-rose-100 text-rose-800"
                      : q3 !== undefined
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {q3 !== undefined ? (q3 === 4 ? "Danger (4/4)" : `${q3} / 4`) : t("checkin.skipped", "Skipped")}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>{t("checkin.sessionStatus", "Session Status:")}</span>
              <span className="font-bold text-emerald-800 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("checkin.dialogueActive", "Dialogue in Progress")}
              </span>
            </div>
          </div>
        )}

        {/* Right Column: Conversational Dialogue Area */}
        <div className={`${!s1SubmittedInSession ? "lg:col-span-7" : "lg:col-span-8"} bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[580px] transition-all`}>
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
              disabled={submitting || !inputVal.trim()}
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

      {/* Custom User Data Modal (Allows checking in without a preset persona) */}
      <CustomDataModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        initialPersona={customPersona || undefined}
        onSave={(persona, isConsentActive) => {
          setCustomPersona(persona);
          setSelectedPersona(persona);
          setPersonas((prev) => {
            const idx = prev.findIndex(
              (p) => p.id === persona.id || p.pseudonym === persona.pseudonym
            );
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = persona;
              return updated;
            }
            return [...prev, persona];
          });
          setHasConsent(isConsentActive ?? true);
        }}
      />
    </div>
  );
}
