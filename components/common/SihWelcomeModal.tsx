"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  MessageSquare,
  Activity,
  PhoneCall,
  Check,
  Copy,
  ArrowRight,
  X,
  ShieldCheck,
  ExternalLink,
  Info,
} from "lucide-react";

export default function SihWelcomeModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed this modal
    let timer: NodeJS.Timeout | undefined;
    try {
      const seen = localStorage.getItem("sahara_sih_guide_seen");
      if (!seen) {
        // Open automatically on initial load after brief delay
        timer = setTimeout(() => {
          setIsOpen(true);
        }, 400);
      }
    } catch {
      // In case localStorage is blocked
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Listen for custom trigger to reopen the guide modal
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-sih-guide-modal", handleOpen);
    return () => window.removeEventListener("open-sih-guide-modal", handleOpen);
  }, []);

  // Safe Escape key handler with capture-phase stopPropagation to avoid triggering QuickExit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, dontShowAgain]);

  const closeModal = useCallback(() => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("sahara_sih_guide_seen", "true");
      } catch {
        // Ignore
      }
    }
    setIsOpen(false);
  }, [dontShowAgain]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const handleNavigate = (url: string) => {
    closeModal();
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sih-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
      >
        {/* Top Gradient Ribbon & Hackathon Meta Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Smart India Hackathon 2025–2026
            </span>
            <span className="text-xs text-slate-300 font-mono">
              PS ID: <strong className="text-white">26094</strong>
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Team: <strong className="text-white">LexorTek</strong> (ID: 124874)
            </span>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close guide modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto px-5 sm:px-7 py-5 space-y-5 text-sm">
          {/* Welcome Title */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2
                id="sih-modal-title"
                className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
              >
                Welcome SIH Evaluators & Reviewers!
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              You are exploring the official working prototype for <strong>Project SAHARA</strong> (Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities).
            </p>
          </div>

          {/* Governing Principle Callout */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/90 text-emerald-950 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-semibold text-emerald-900 block mb-0.5">
                The Governing Principle of Project SAHARA:
              </span>
              <span className="italic text-emerald-800">
                &ldquo;The AI does not decide. It decides who a human looks at next, and why.&rdquo;
              </span>
            </div>
          </div>

          {/* Primary Action Card: Open Complete Web Guide */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Recommended First Step</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                SIH PPT Slide-by-Slide & App Guide
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-md">
                Detailed mapping of all 6 presentation slides directly to working code, mathematical proofs, and step-by-step web app usage instructions.
              </p>
            </div>
            <button
              onClick={() => handleNavigate("/guide")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shrink-0 cursor-pointer shadow-sm hover:shadow"
            >
              <span>Open SIH Guide</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Interactive Portals Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Instant Web Feature Navigation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Checkin Portal */}
              <button
                onClick={() => handleNavigate("/checkin")}
                className="text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition group cursor-pointer flex flex-col justify-between h-full min-w-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Live Chat
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5">
                    Text Check-in
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Try Golden Persona A-4471, S1 sliders, &amp; crisis word regex interlocks.
                  </div>
                </div>
              </button>

              {/* Staff Portal */}
              <button
                onClick={() => handleNavigate("/staff")}
                className="text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition group cursor-pointer flex flex-col justify-between h-full min-w-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800 group-hover:bg-blue-600 group-hover:text-white transition">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Counsellor
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5">
                    Triage Dashboard
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Inspect ranked queue, S1..S5 explainability chart, &amp; EWMA trajectory.
                  </div>
                </div>
              </button>

              {/* IVR Portal */}
              <button
                onClick={() => handleNavigate("/call")}
                className="text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition group cursor-pointer flex flex-col justify-between h-full min-w-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      IVRS 14566
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5">
                    Simulated Call
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Web Speech API voice simulation with pinned 0.00 acoustic weight.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Demo Credentials & Quick Test Keys */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">Counsellor Passcode:</span>
              <code className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900">
                APP111
              </code>
              <span className="text-slate-400">or</span>
              <code className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900">
                sahara2026
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard("APP111")}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
              >
                {copiedPasscode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Golden Persona: <strong className="text-slate-800">A-4471</strong></span>
              <span>•</span>
              <span>Quick Exit: <kbd className="font-mono bg-white px-1 border border-slate-300 rounded">ESC</kbd></span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
            />
            <span>Don&apos;t show this popup automatically on next visits</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 transition cursor-pointer"
            >
              Explore Website
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("/guide")}
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-emerald-800 text-white font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore SIH Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
