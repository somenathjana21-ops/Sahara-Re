"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage, SupportedLanguage } from "@/lib/i18n/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "toggle" | "dropdown" | "compact";
}

export default function LanguageSwitcher({
  className = "",
  variant = "toggle",
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const handleToggle = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  if (variant === "compact") {
    return (
      <button
        onClick={() => handleToggle(language === "en" ? "hi" : "en")}
        aria-label="Switch Language"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors ${className}`}
      >
        <Globe className="w-3.5 h-3.5 text-primary" />
        <span>{language === "en" ? "हिन्दी" : "English"}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium ${className}`}
    >
      <button
        type="button"
        onClick={() => handleToggle("en")}
        aria-pressed={language === "en"}
        className={`px-2.5 py-1 rounded-md transition-all ${
          language === "en"
            ? "bg-white text-slate-900 font-semibold shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleToggle("hi")}
        aria-pressed={language === "hi"}
        className={`px-2.5 py-1 rounded-md transition-all ${
          language === "hi"
            ? "bg-white text-slate-900 font-semibold shadow-2xs"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
