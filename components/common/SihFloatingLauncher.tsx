"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, BookOpen, Layers, X, HelpCircle, ArrowUpRight } from "lucide-react";

export default function SihFloatingLauncher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // If already on /guide, we can keep the launcher minimal or hide the guide link
  const isGuidePage = pathname === "/guide";

  const triggerWelcomeModal = () => {
    window.dispatchEvent(new CustomEvent("open-sih-guide-modal"));
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Expanded Quick Menu */}
      {isOpen && (
        <div className="mb-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 text-xs text-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>SIH Evaluator Tools</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Smart India Hackathon 2025–2026 (PS 26094). Explore PPT slide mappings and live testing workflows.
          </p>

          <div className="space-y-1.5">
            <Link
              href="/guide"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-900 font-semibold hover:bg-emerald-100 transition"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>Open Full SIH Guide</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
            </Link>

            <button
              type="button"
              onClick={triggerWelcomeModal}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Show Quick-Start Popup</span>
              </div>
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Passcode: <strong className="font-mono text-slate-600">APP111</strong></span>
            <span>Persona: <strong className="font-mono text-slate-600">A-4471</strong></span>
          </div>
        </div>
      )}

      {/* Floating Action Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="SIH PPT Guide & Evaluator Tour"
        className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-700 cursor-pointer active:scale-95"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span>SIH PPT Guide</span>
        <span className="hidden sm:inline text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-500/30">
          PS 26094
        </span>
      </button>
    </div>
  );
}
