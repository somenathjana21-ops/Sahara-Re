"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface QuickExitProps {
  className?: string;
  variant?: "pill" | "button" | "minimal";
}

export function executeQuickExit() {
  if (typeof window !== "undefined") {
    // Replace state and redirect immediately to eliminate browser back history
    window.location.replace("https://weather.com");
  }
}

export default function QuickExit({ className = "", variant = "pill" }: QuickExitProps) {
  const { t } = useLanguage();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" || event.code === "Escape") {
        event.preventDefault();
        executeQuickExit();
      }
    }

    // Registered on the bubbling phase so capture-phase modal interceptors
    // (e.g., CrisisHelplinesModal) can stop propagation and dismiss without triggering QuickExit.
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    executeQuickExit();
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleClick}
        title={t("common.quickExitDesc", "Instantly leave this site")}
        aria-label={t("common.quickExit", "Quick Exit")}
        className={`inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 transition-colors ${className}`}
      >
        <X className="w-3.5 h-3.5" />
        <span>{t("common.quickExit", "Quick Exit")}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={t("common.quickExitDesc", "Instantly leave this site")}
      aria-label={t("common.quickExit", "Quick Exit")}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 border border-rose-200/80 transition-colors text-xs cursor-pointer shadow-2xs ${className}`}
    >
      <X className="w-3.5 h-3.5 shrink-0" />
      <span className="font-semibold">{t("common.quickExit", "Quick Exit")}</span>
      <kbd className="text-[10px] font-mono px-1 rounded bg-white text-slate-600 border border-rose-200">
        ESC
      </kbd>
    </button>
  );
}
