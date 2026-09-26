"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function BreathingWidget({ className = "" }: { className?: string }) {
  const { t } = useLanguage();

  const phases = [
    { key: "inhale", duration: 4, scale: "scale-110", ringOpacity: "opacity-100 bg-emerald-100" },
    { key: "hold", duration: 4, scale: "scale-110", ringOpacity: "opacity-60 bg-emerald-100" },
    { key: "exhale", duration: 4, scale: "scale-95", ringOpacity: "opacity-25 bg-emerald-50" },
    { key: "hold", duration: 4, scale: "scale-95", ringOpacity: "opacity-0 bg-transparent" },
  ];

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhaseIndex((p) => (p + 1) % phases.length);
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phases.length]);

  const currentPhase = phases[phaseIndex % phases.length]!;
  const phaseLabel =
    currentPhase.key === "inhale"
      ? t("breathing.inhale", "Inhale")
      : currentPhase.key === "exhale"
      ? t("breathing.exhale", "Exhale")
      : t("breathing.hold", "Hold");

  return (
    <div
      className={`bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between ${className}`}
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 mb-2">
          {t("breathing.title", "Need a moment to breathe first?")}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
          {t(
            "breathing.subtitle",
            "Take thirty seconds to calm your nervous system. There is no urgency to interact until you feel steady."
          )}
        </p>
      </div>

      {/* Visual Animation Box */}
      <div className="w-full py-8 px-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          fill="none"
          viewBox="0 0 400 200"
        >
          <path
            d="M0 100 C 100 60, 150 140, 250 100 C 350 60, 380 120, 400 100"
            fill="none"
            stroke="#206140"
            strokeWidth="3"
          />
        </svg>

        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Animated expansion ring */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ease-in-out ${currentPhase.ringOpacity}`}
          />

          {/* Core Breathing Circle */}
          <div
            className={`w-24 h-24 rounded-full bg-primary text-white flex flex-col items-center justify-center shadow-sm z-10 transition-transform duration-1000 ease-in-out ${currentPhase.scale}`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider">
              {phaseLabel}
            </span>
            <span className="text-xl font-bold mt-0.5">{secondsLeft}s</span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 z-10">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-700" />
                <span>{t("breathing.pause", "Pause")}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-700" />
                <span>{t("breathing.resume", "Resume")}</span>
              </>
            )}
          </button>
          <span className="text-slate-500 text-xs">
            {t("breathing.boxRhythm", "Box rhythm (4-4-4)")}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          {t(
            "breathing.gentleReminder",
            "Take all the time you need. Our team remains on the line whenever you are ready."
          )}
        </span>
      </div>
    </div>
  );
}
