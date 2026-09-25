"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  ShieldAlert,
  Send,
  Sparkles,
  Info,
  Scale,
  Activity,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import CrisisHelplinesModal from "@/components/common/CrisisHelplinesModal";
import {
  CheckInRequest,
  CheckInResponse,
  AudioMetrics,
  ResourceItem,
} from "@/types/contract";

const PRESET_PERSONAS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    consentId: "11111111-3333-1111-1111-111111111111",
    pseudonym: "A-4471",
    label: "A-4471 (Golden Path — Land Dispossession, Trial in 6d, Bail)",
    language: "hi",
    s3Standing: 90,
  },
  {
    id: "22222222-1111-2222-2222-222222222222",
    consentId: "22222222-3333-2222-2222-222222222222",
    pseudonym: "A-6218",
    label: "A-6218 (Minor Flag — Caseworker Referral, Zero score)",
    language: "hi",
    s3Standing: 0,
  },
  {
    id: "33333333-1111-3333-3333-333333333333",
    consentId: "33333333-3333-3333-3333-333333333333",
    pseudonym: "A-2301",
    label: "A-2301 (Stable Control Persona)",
    language: "en",
    s3Standing: 10,
  },
];

export default function CallPage() {
  const { t, language } = useLanguage();

  const [selectedPersona, setSelectedPersona] = useState(PRESET_PERSONAS[0]);

  // Telephony call state: 'idle' | 'calling' | 'connected' | 'ended'
  const [callState, setCallState] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [systemAudioReply, setSystemAudioReply] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  // Paralinguistic Audio Feature Extraction (S5) state
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    pitchVariabilityPct: 42,
    speechRateDeviationPct: 18,
    pauseRatioPct: 24,
  });

  // Emergency helplines modal
  const [isHelplineModalOpen, setIsHelplineModalOpen] = useState(false);
  const [helplineTriggerReason, setHelplineTriggerReason] = useState<string | undefined>(
    undefined
  );

  // Web Speech recognition instance ref
  const recognitionRef = useRef<any>(null);

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callState === "connected") {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Format call duration MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Text-to-Speech synthesis helper
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  };

  // Web Speech API STT initialization
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.info("Web SpeechRecognition not supported in this browser. Fallback typing enabled.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "hi" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Start Call handler
  const handleStartCall = () => {
    setCallState("calling");
    setSystemAudioReply(null);
    setTranscript("");

    // Simulate ring/connection delay
    setTimeout(() => {
      setCallState("connected");
      const greeting =
        language === "hi"
          ? "नमस्ते। सहारा हेल्पलाइन में आपका स्वागत है। कृपया आराम से अपनी बात कहें, हम सुन रहे हैं।"
          : "Hello. Welcome to Project SAHARA Havenline. Please take your time and speak freely. We are listening.";
      setSystemAudioReply(greeting);
      speakText(greeting);
      startSpeechRecognition();
    }, 1500);
  };

  // End Call handler
  const handleEndCall = () => {
    stopSpeechRecognition();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCallState("ended");
    setIsSpeaking(false);
  };

  // Keypad press handler
  // Acceptance Criterion 3: Pressing keypad 0 on /call immediately renders crisis helplines locally without network delay
  const handleKeypadPress = async (digit: string) => {
    setLastKeyPressed(digit);

    // KEYPAD '0' EMERGENCY HANDLER: Instant local modal render!
    if (digit === "0") {
      setHelplineTriggerReason(
        language === "hi"
          ? "कीपैड आपातकालीन '0' कुंजी दबाई गई (सीधा मानवीय संपर्क)"
          : "Keypad Emergency '0' pressed for direct human helpline referral"
      );
      // Immediately open modal locally without awaiting network
      setIsHelplineModalOpen(true);
    }

    // If call is active, optionally post the keypad event to pipeline
    if (callState === "connected") {
      try {
        const payload: CheckInRequest = {
          personId: selectedPersona.id,
          consentId: selectedPersona.consentId,
          channel: "call_sim",
          keypadDigit: digit,
          transcript: transcript ? `[Keypad ${digit}] ${transcript}` : `[Keypad ${digit}]`,
          abandoned: false,
          audioMetrics,
        };

        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data: CheckInResponse = await res.json();
          setSystemAudioReply(data.reply);
          speakText(data.reply);
          if (data.status === "critical") {
            setIsHelplineModalOpen(true);
          }
        }
      } catch (e) {
        console.error("Keypad pipeline error:", e);
      }
    }
  };

  // Send spoken turn to the pipeline
  // Acceptance Criterion 4: Simulated speech check-ins post to /api/checkin and render response messages
  const handleSendSpokenTurn = async () => {
    if (!transcript.trim()) return;

    try {
      const payload: CheckInRequest = {
        personId: selectedPersona.id,
        consentId: selectedPersona.consentId,
        channel: "call_sim",
        transcript: transcript.trim(),
        abandoned: false,
        audioMetrics,
      };

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: CheckInResponse = await res.json();
      setSystemAudioReply(data.reply);
      speakText(data.reply);

      if (data.status === "critical") {
        setHelplineTriggerReason(
          language === "hi"
            ? "ध्वनि चेक-इन में संकट इंटरलॉक सक्रिय हुआ"
            : "Voice check-in triggered safety interlock CRITICAL tier"
        );
        setIsHelplineModalOpen(true);
      }
    } catch (e) {
      console.error("Spoken turn submission error:", e);
    }
  };

  const keypadButtons = [
    { num: "1", sub: "" },
    { num: "2", sub: "ABC" },
    { num: "3", sub: "DEF" },
    { num: "4", sub: "GHI" },
    { num: "5", sub: "JKL" },
    { num: "6", sub: "MNO" },
    { num: "7", sub: "PQRS" },
    { num: "8", sub: "TUV" },
    { num: "9", sub: "WXYZ" },
    { num: "*", sub: "" },
    { num: "0", sub: "HELP", emergency: true },
    { num: "#", sub: "" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
      {/* Prominent Simulated Voice Disclaimer Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <span className="font-bold block mb-0.5">
            {language === "hi"
              ? "सिम्युलेटेड वॉयस इंटरफेस सूचना"
              : "Simulated Telephony Interface Notice"}
          </span>
          <p className="text-amber-800 leading-relaxed font-normal">
            {t(
              "call.bannerNotice",
              "Simulated Voice Interface for Demonstration & Accessibility (Web Speech API). Not connected to actual telecom carrier."
            )}
          </p>
        </div>
      </div>

      {/* Title & Keypad 0 Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t("call.pageTitle", "Simulated Voice Call (IVRS)")}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t(
              "call.pageSubtitle",
              "Interactive telephony interface demonstration with automated speech recognition and keypad triage."
            )}
          </p>
        </div>

        {/* Persona Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Persona:</span>
          <select
            value={selectedPersona.id}
            onChange={(e) => {
              const p = PRESET_PERSONAS.find((item) => item.id === e.target.value);
              if (p) setSelectedPersona(p);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-primary text-xs"
          >
            {PRESET_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Keypad 0 Shortcut Alert Ribbon */}
      <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-700" />
          <span>
            {t(
              "call.press0Banner",
              "Keypad Shortcut: Press '0' at any moment to connect directly to human crisis helplines."
            )}
          </span>
        </div>
        <button
          onClick={() => handleKeypadPress("0")}
          className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] cursor-pointer"
        >
          {language === "hi" ? "कीपैड '0' दबाएँ" : "Press Keypad '0'"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Simulated Phone Handset & Dialpad */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col items-center">
          {/* Phone Screen Display */}
          <div className="w-full bg-slate-900 text-white rounded-2xl p-5 mb-6 shadow-inner flex flex-col items-center">
            {/* Call Status Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  callState === "connected"
                    ? "bg-emerald-400 animate-pulse"
                    : callState === "calling"
                    ? "bg-amber-400 animate-ping"
                    : "bg-slate-400"
                }`}
              />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                {callState === "connected"
                  ? t("call.callStatusConnected", "Call Active").replace(
                      "{time}",
                      formatTime(callDuration)
                    )
                  : callState === "calling"
                  ? t("call.callStatusCalling", "Connecting...")
                  : callState === "ended"
                  ? t("call.callStatusEnded", "Call Ended")
                  : t("call.callStatusIdle", "Line Ready (On Hook)")}
              </span>
            </div>

            <span className="text-xl font-bold tracking-tight text-white mb-1">
              Project SAHARA Havenline
            </span>
            <span className="text-xs text-slate-400">14566 / 14416 Toll-Free</span>

            {/* Speaking / Audio Visualizer Wave */}
            {callState === "connected" && (
              <div className="mt-4 flex items-center gap-1.5 h-6">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isSpeaking
                        ? "bg-emerald-400 animate-pulse"
                        : isListening
                        ? "bg-blue-400 animate-bounce"
                        : "bg-slate-600"
                    }`}
                    style={{ height: `${h * 4}px` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Call Primary Actions: Start / End Call */}
          <div className="w-full flex items-center justify-center gap-4 mb-6">
            {callState !== "connected" && callState !== "calling" ? (
              <button
                onClick={handleStartCall}
                className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <PhoneCall className="w-5 h-5 text-white" />
                <span>{t("call.startCall", "Start Voice Call")}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                    isMuted
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <PhoneOff className="w-5 h-5 text-white" />
                  <span>{t("call.endCall", "End Call")}</span>
                </button>
              </>
            )}
          </div>

          {/* Interactive Telephone Keypad */}
          <div className="w-full">
            <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              {t("call.keypadTitle", "Interactive Keypad")}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {keypadButtons.map((btn) => (
                <button
                  key={btn.num}
                  type="button"
                  onClick={() => handleKeypadPress(btn.num)}
                  className={`h-14 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    btn.emergency
                      ? "bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 ring-2 ring-rose-200"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900 active:scale-95"
                  }`}
                >
                  <span className="text-lg font-bold leading-none">{btn.num}</span>
                  {btn.sub && (
                    <span
                      className={`text-[9px] uppercase tracking-wider font-semibold mt-0.5 ${
                        btn.emergency ? "text-rose-700" : "text-slate-400"
                      }`}
                    >
                      {btn.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Audio Transcript, Voice Responses, and Paralinguistic S5 Metrics */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Transcript & Speech Recognition Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span>{t("call.liveTranscript", "Call Transcript (Speech-to-Text):")}</span>
              </h2>
              {isListening && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  {t("call.transcribing", "Listening...")}
                </span>
              )}
            </div>

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t(
                "call.transcriptPlaceholder",
                "Your spoken words will appear here as you speak during an active call..."
              )}
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-primary focus:bg-white transition-all resize-none leading-relaxed"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {language === "hi"
                  ? "यदि ब्राउज़र स्पीच काम न करे, तो आप टाइप करके भी परीक्षण कर सकते हैं।"
                  : "If browser speech is unavailable, you can also edit or type directly."}
              </span>

              <button
                type="button"
                onClick={handleSendSpokenTurn}
                disabled={!transcript.trim()}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t("call.sendCallTurn", "Send Spoken Turn to Pipeline")}</span>
              </button>
            </div>
          </div>

          {/* System Audio Response Output */}
          {systemAudioReply && (
            <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 shadow-2xs animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {t("call.systemVoiceReply", "SAHARA Audio Response:")}
                </span>
                <button
                  onClick={() => speakText(systemAudioReply)}
                  className="text-xs font-semibold text-primary hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Audio</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                {systemAudioReply}
              </p>
            </div>
          )}

          {/* Paralinguistic Audio Feature Extraction (S5) & Invariant Warning */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>
                  {t(
                    "call.acousticMetricsTitle",
                    "Paralinguistic Audio Feature Extraction (S5)"
                  )}
                </span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Weight: 0.00 (Pinned)
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-normal">
              {t(
                "call.acousticDisclaimer",
                "Note: Audio acoustic score weight is strictly pinned to 0.00 to prevent biometric, dialect, and acoustic bias."
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">
                  {t("call.pitchVar", "Pitch Variability Deviation:")}
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  {audioMetrics.pitchVariabilityPct}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">
                  {t("call.speechRate", "Speech Rate Deviation:")}
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  {audioMetrics.speechRateDeviationPct}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">
                  {t("call.pauseRatio", "Pause / Hesitation Ratio:")}
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  {audioMetrics.pauseRatioPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Helplines Modal (Opened locally by Keypad '0' with zero delay) */}
      <CrisisHelplinesModal
        isOpen={isHelplineModalOpen}
        onClose={() => setIsHelplineModalOpen(false)}
        triggerReason={helplineTriggerReason}
      />
    </div>
  );
}
