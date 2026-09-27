"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Scale,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  Calendar,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PresetPersona } from "@/lib/constants/personas";
import { CustomPersonRequest } from "@/types/contract";

interface CustomDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: PresetPersona) => void;
  initialPersona?: PresetPersona;
}

export default function CustomDataModal({
  isOpen,
  onClose,
  onSave,
  initialPersona,
}: CustomDataModalProps) {
  const { t, language: appLanguage, setLanguage: setAppLanguage } = useLanguage();

  // Profile fields
  const [pseudonym, setPseudonym] = useState("A-9051");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">("en");
  const [isMinor, setIsMinor] = useState(false);
  const [consentGranted, setConsentGranted] = useState(true);

  // Legal Case Context (S3 factors)
  const [hasCase, setHasCase] = useState(true);
  const [atrocityCategory, setAtrocityCategory] = useState("land_dispossession");
  const [stage, setStage] = useState<"investigation" | "trial" | "rehabilitation" | "compensation">("trial");
  const [bailStatus, setBailStatus] = useState<"in_custody" | "accused_on_bail">("accused_on_bail");
  const [nextHearingWithin7d, setNextHearingWithin7d] = useState(true);
  const [intimidationWithin14d, setIntimidationWithin14d] = useState(false);
  const [reliefOverdue30d, setReliefOverdue30d] = useState(false);
  const [adjournmentsGte3, setAdjournmentsGte3] = useState(false);
  const [socialBoycott, setSocialBoycott] = useState(false);
  const [caseOpenGt365d, setCaseOpenGt365d] = useState(true);

  // Prior Baseline / History
  const [hasBaselineHistory, setHasBaselineHistory] = useState(false);
  const [baselineMean, setBaselineMean] = useState(28);
  const [missedCount, setMissedCount] = useState(0);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize with initialPersona if present
  useEffect(() => {
    if (initialPersona) {
      if (initialPersona.pseudonym && initialPersona.pseudonym !== "U-Custom") {
        setPseudonym(initialPersona.pseudonym);
      }
      if (initialPersona.language === "hi" || initialPersona.language === "en") {
        setSelectedLanguage(initialPersona.language);
      }
      if (initialPersona.isMinor !== undefined) {
        setIsMinor(initialPersona.isMinor);
      }
    }
  }, [initialPersona, isOpen]);

  // Handle ESC key to safely dismiss modal without triggering QuickExit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.code === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown, true);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time deterministic calculation of S3 preview score
  const calculatePreviewS3 = () => {
    if (!hasCase) return 0;
    let pts = 0;
    if (intimidationWithin14d) pts += 25;
    if (bailStatus === "accused_on_bail") pts += 20;
    if (nextHearingWithin7d) pts += 15;
    if (reliefOverdue30d) pts += 15;
    if (adjournmentsGte3) pts += 10;
    if (socialBoycott) pts += 10;
    if (caseOpenGt365d) pts += 5;
    return Math.min(100, pts);
  };

  const previewS3 = calculatePreviewS3();

  const handleGenerateRandomId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setPseudonym(`A-${randomNum}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const payload: CustomPersonRequest = {
        id: initialPersona?.isCustom ? initialPersona.id : undefined,
        pseudonym: pseudonym.trim() || `A-${Math.floor(1000 + Math.random() * 9000)}`,
        language: selectedLanguage,
        isMinor,
        consentGranted,
        hasCase,
        caseData: hasCase
          ? {
              atrocityCategory,
              stage,
              bailStatus,
              nextHearingDays: nextHearingWithin7d ? 5 : null,
              adjournmentCount: adjournmentsGte3 ? 4 : 1,
              reliefOverdueDays: reliefOverdue30d ? 45 : null,
              reliefPaid: !reliefOverdue30d,
              socialBoycott,
              intimidationReportDaysAgo: intimidationWithin14d ? 2 : null,
              caseOpenDaysAgo: caseOpenGt365d ? 400 : 90,
            }
          : undefined,
        baselineMean: hasBaselineHistory ? baselineMean : null,
        baselineVar: hasBaselineHistory ? 2.5 : null,
        checkinCount: hasBaselineHistory ? 2 : 0,
        missedCount: hasBaselineHistory ? missedCount : 0,
      };

      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create custom user profile");
      }

      // If user chose a different language, sync app language
      if (selectedLanguage !== appLanguage) {
        setAppLanguage(selectedLanguage);
      }

      const newPresetPersona: PresetPersona = {
        id: data.person.id,
        consentId: data.consent.id,
        pseudonym: data.person.pseudonym,
        label: `${data.person.pseudonym} (Custom User Data — ${data.s3Standing} pts S3)`,
        language: data.person.language,
        isMinor: data.person.is_minor_flag,
        s3Standing: data.s3Standing,
        isCustom: true,
      };

      onSave(newPresetPersona);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t("customModal.title", "Self-Directed Check-in (Without Persona)")}
              </h2>
              <p className="text-xs text-slate-500">
                {t(
                  "customModal.subtitle",
                  "Fill in your own details and case context. No pre-set persona required."
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Section 1: Anonymous Identity & Language */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t("customModal.identityHeader", "1. Anonymous Identity & Preferences")}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pseudonym */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("customModal.pseudonymLabel", "Anonymous Identifier (Pseudonym):")}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="e.g. A-4471 or User-1"
                    maxLength={20}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-primary text-xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomId}
                    title="Generate Random ID"
                    className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {t("customModal.zeroPiiNotice", "Strict Zero PII policy: Do not enter real names or contact details.")}
                </p>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("customModal.languageLabel", "Preferred Language:")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage("en")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all text-center ${
                      selectedLanguage === "en"
                        ? "bg-primary text-white border-primary shadow-2xs font-semibold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    English (EN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage("hi")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all text-center ${
                      selectedLanguage === "hi"
                        ? "bg-primary text-white border-primary shadow-2xs font-semibold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    हिन्दी (HI)
                  </button>
                </div>
              </div>
            </div>

            {/* Minor Safeguard */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">
                    {t("customModal.isMinorLabel", "I am under 18 years of age (Minor)")}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    {t(
                      "customModal.isMinorDesc",
                      "Project SAHARA safeguards minors by diverting directly to an accredited human caseworker without automated scoring."
                    )}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Court & Legal Case Context (S3 Score) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Scale className="w-4 h-4 text-amber-700" />
                <span>{t("customModal.caseHeader", "2. Legal Case Context (S3 Score Drivers)")}</span>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                <span className="text-slate-600 font-medium">Has Active Case?</span>
                <input
                  type="checkbox"
                  checked={hasCase}
                  onChange={(e) => setHasCase(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {hasCase ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Case / Atrocity Category:
                    </label>
                    <select
                      value={atrocityCategory}
                      onChange={(e) => setAtrocityCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="land_dispossession">Land Dispossession / Encroachment</option>
                      <option value="physical_assault">Physical Assault / Violence</option>
                      <option value="caste_discrimination">Caste Discrimination / Insult</option>
                      <option value="verbal_abuse">Verbal Abuse / Harassment</option>
                      <option value="social_boycott">Social Boycott / Ostracism</option>
                      <option value="general_distress">General Legal Dispute</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Case Stage:
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="investigation">Investigation (Police FIR)</option>
                      <option value="trial">Trial (Court Hearings)</option>
                      <option value="rehabilitation">Rehabilitation</option>
                      <option value="compensation">Compensation / Relief Claim</option>
                    </select>
                  </div>
                </div>

                {/* S3 Structural Stress Factors */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900">
                      Select Applicable Risk & Pressure Factors:
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Calculated S3: {previewS3} / 100 pts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Bail Status */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={bailStatus === "accused_on_bail"}
                        onChange={(e) =>
                          setBailStatus(e.target.checked ? "accused_on_bail" : "in_custody")
                        }
                        className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">Accused on Bail</span>
                        <span className="text-amber-700 font-bold ml-1.5">(+20 pts)</span>
                      </div>
                    </label>

                    {/* Next Hearing within 7 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={nextHearingWithin7d}
                        onChange={(e) => setNextHearingWithin7d(e.target.checked)}
                        className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">Hearing in ≤ 7 Days</span>
                        <span className="text-amber-700 font-bold ml-1.5">(+15 pts)</span>
                      </div>
                    </label>

                    {/* Intimidation report within last 14 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={intimidationWithin14d}
                        onChange={(e) => setIntimidationWithin14d(e.target.checked)}
                        className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">Threat / Intimidation ≤ 14d</span>
                        <span className="text-amber-700 font-bold ml-1.5">(+25 pts)</span>
                      </div>
                    </label>

                    {/* Relief overdue > 30 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={reliefOverdue30d}
                        onChange={(e) => setReliefOverdue30d(e.target.checked)}
                        className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">Relief Overdue &gt; 30 Days</span>
                        <span className="text-amber-700 font-bold ml-1.5">(+15 pts)</span>
                      </div>
                    </label>

                    {/* High Adjournments */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={adjournmentsGte3}
                        onChange={(e) => setAdjournmentsGte3(e.target.checked)}
                        className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">≥ 3 Adjournments</span>
                        <span className="text-amber-700 font-bold ml-1.5">(+10 pts)</span>
                      </div>
                    </label>

                    {/* Social Boycott */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={socialBoycott}
                        onChange={(e) => setSocialBoycott(e.target.checked)}
                        className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">Village Social Boycott</span>
                        <span className="text-amber-700 font-bold ml-1.5">(+10 pts)</span>
                      </div>
                    </label>

                    {/* Case open > 365 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={caseOpenGt365d}
                        onChange={(e) => setCaseOpenGt365d(e.target.checked)}
                        className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900">Protracted Case (Open &gt; 1 Year)</span>
                        <span className="text-amber-700 font-bold ml-1.5">(+5 pts)</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                {t(
                  "customModal.noCaseNotice",
                  "No active legal case reported. S3 case distress score will be 0 points, focusing analysis on emotional dialogue (S2) and self-report (S1)."
                )}
              </div>
            )}
          </div>

          {/* Section 3: Check-in History & Baseline (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <History className="w-4 h-4 text-primary" />
                <span>{t("customModal.historyHeader", "3. Prior History & Baseline")}</span>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                <span className="text-slate-600 font-medium">Prior History?</span>
                <input
                  type="checkbox"
                  checked={hasBaselineHistory}
                  onChange={(e) => setHasBaselineHistory(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {hasBaselineHistory ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prior Baseline Distress (μ):
                  </label>
                  <select
                    value={baselineMean}
                    onChange={(e) => setBaselineMean(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs"
                  >
                    <option value={20}>Low Distress (μ = 20)</option>
                    <option value={28}>Moderate Distress (μ = 28)</option>
                    <option value={40}>Elevated Distress (μ = 40)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Missed Check-ins (S4 Driver):
                  </label>
                  <select
                    value={missedCount}
                    onChange={(e) => setMissedCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs"
                  >
                    <option value={0}>0 Missed (On track)</option>
                    <option value={1}>1 Missed (+25 S4 pts)</option>
                    <option value={2}>2 Missed (+50 S4 pts)</option>
                    <option value={3}>3 Missed (Amber Floor)</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {t(
                  "customModal.firstTimeNotice",
                  "First-time check-in: Baseline will be established upon first contact."
                )}
              </p>
            )}
          </div>

          {/* Section 4: Voluntary Consent */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-xs text-slate-900 block">
                  {t("customModal.consentCheckLabel", "Voluntary Consent Granted")}
                </span>
                <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                  {t(
                    "customModal.consentCheckDesc",
                    "I voluntarily consent to confidential distress monitoring. Answers will never affect legal outcomes or compensation claims."
                  )}
                </span>
              </div>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold text-xs cursor-pointer transition-colors"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? t("common.saving", "Saving...") : t("customModal.applyButton", "Apply & Start Check-in")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
