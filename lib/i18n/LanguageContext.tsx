"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";

export type SupportedLanguage = "en" | "hi";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, fallback?: string) => string;
}

const dictionaries: Record<SupportedLanguage, any> = { en, hi };

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (path: string, fallback?: string) => fallback || path,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sahara_lang") as SupportedLanguage | null;
      if (stored === "en" || stored === "hi") {
        setLangState(stored);
      }
    } catch {
      // Ignore localStorage errors in SSR or restricted iframe
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLangState(lang);
    try {
      localStorage.setItem("sahara_lang", lang);
    } catch {
      // Ignore
    }
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: any = dictionaries[language];
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }

    if (current && typeof current === "string") {
      return current;
    }

    // Fallback to English dictionary
    let enFallback: any = dictionaries.en;
    for (const key of keys) {
      if (enFallback && typeof enFallback === "object" && key in enFallback) {
        enFallback = enFallback[key];
      } else {
        enFallback = undefined;
        break;
      }
    }

    if (enFallback && typeof enFallback === "string") {
      return enFallback;
    }

    return fallback ?? path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
