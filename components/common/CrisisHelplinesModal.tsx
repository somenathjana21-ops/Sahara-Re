"use client";

import React, { useEffect } from "react";
import { Phone, ShieldAlert, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CrisisHelplinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: string;
}

export default function CrisisHelplinesModal({
  isOpen,
  onClose,
  triggerReason,
}: CrisisHelplinesModalProps) {
  const { t, language } = useLanguage();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Quick exit handles global redirect on Escape, but if modal is open,
        // user might want immediate exit anyway.
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const helplines = [
    {
      name:
        language === "hi"
          ? "राष्ट्रीय अत्याचार निवारण हेल्पलाइन (NHAA)"
          : "National Helpline Against Atrocities (NHAA)",
      number: "14566",
      desc:
        language === "hi"
          ? "एससी/एसटी अत्याचार संरक्षण, विधिक सहायता एवं तत्काल सुरक्षा हेतु 24/7 निःशुल्क सरकारी हेल्पलाइन।"
          : "24/7 toll-free assistance for SC/ST protection and legal atrocity support.",
      primary: true,
    },
    {
      name:
        language === "hi"
          ? "टेली-मानस मानसिक स्वास्थ्य हेल्पलाइन"
          : "Tele-MANAS Mental Health Counseling",
      number: "14416",
      desc:
        language === "hi"
          ? "मानसिक स्वास्थ्य, भावनात्मक संबल एवं तनाव प्रबंधन हेतु 24/7 निःशुल्क सरकारी मनोवैज्ञानिक परामर्श।"
          : "24/7 government psychological counseling and distress intervention.",
      primary: true,
    },
    {
      name:
        language === "hi"
          ? "किरण मानसिक स्वास्थ्य हेल्पलाइन"
          : "Kiran Mental Health Helpline",
      number: "1800-599-0019",
      desc:
        language === "hi"
          ? "मानसिक राहत और संकट प्रबंधन हेतु राष्ट्रीय सामाजिक न्याय अधिकारिता मंत्रालय सेवा।"
          : "National toll-free helpline for mental wellbeing and crisis support.",
      primary: false,
    },
    {
      name:
        language === "hi"
          ? "राष्ट्रीय आपातकालीन सहायता प्रणाली (पुलिस/सुरक्षा)"
          : "National Emergency Response Support",
      number: "112",
      desc:
        language === "hi"
          ? "पुलिस, चिकित्सा या जान के खतरे की स्थिति में तात्कालिक आपातकालीन सुरक्षा नंबर।"
          : "All-in-one emergency service for immediate police, fire, or medical dispatch.",
      primary: false,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <h2
                id="crisis-modal-title"
                className="text-lg font-bold text-slate-900 leading-snug"
              >
                {t("helplines.title", "Immediate 24/7 Crisis Helplines")}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {t(
                  "helplines.sub",
                  "These numbers are toll-free, operational 24/7, and completely confidential."
                )}
              </p>
              {triggerReason && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-100/80 text-rose-800 text-[11px] font-medium">
                  <AlertTriangle className="w-3 h-3 text-rose-700 shrink-0" />
                  <span>{triggerReason}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-rose-100/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Helplines List */}
        <div className="p-5 overflow-y-auto space-y-3.5">
          {helplines.map((item) => (
            <div
              key={item.number}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                item.primary
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </span>
                  {item.primary && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      24/7 Toll-Free
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <a
                href={`tel:${item.number.replace(/-/g, "")}`}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shrink-0 shadow-2xs ${
                  item.primary
                    ? "bg-primary hover:bg-emerald-800 text-white"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{item.number}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{t("common.safeConnection", "Safe connection")} • Zero logs</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
          >
            {language === "hi" ? "वापस जाएँ" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
