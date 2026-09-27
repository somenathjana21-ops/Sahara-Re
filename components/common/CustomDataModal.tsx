"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PresetPersona } from "@/lib/constants/personas";
import { CustomPersonRequest, PseudonymRegex } from "@/types/contract";

interface CustomDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: PresetPersona, hasConsent?: boolean) => void;
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

  // Matched existing user state
  const [matchedUser, setMatchedUser] = useState<{
    id: string;
    pseudonym: string;
    checkinsCount: number;
    missedCount: number;
    lastCheckin?: string;
  } | null>(null);
  const [matchedPersonId, setMatchedPersonId] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Legal Case Context fields
  const [hasCase, setHasCase] = useState(true);
  const [atrocityCategory, setAtrocityCategory] = useState("land_dispossession");
  const [customCategory, setCustomCategory] = useState("");
  const [customCaseDetails, setCustomCaseDetails] = useState("");
  const [otherPressureDetails, setOtherPressureDetails] = useState("");
  const [stage, setStage] = useState<"investigation" | "trial" | "rehabilitation" | "compensation">("trial");
  const [bailStatus, setBailStatus] = useState<"in_custody" | "accused_on_bail">("accused_on_bail");
  const [nextHearingWithin7d, setNextHearingWithin7d] = useState(true);
  const [intimidationWithin14d, setIntimidationWithin14d] = useState(false);
  const [reliefOverdue30d, setReliefOverdue30d] = useState(false);
  const [adjournmentsGte3, setAdjournmentsGte3] = useState(false);
  const [socialBoycott, setSocialBoycott] = useState(false);
  const [caseOpenGt365d, setCaseOpenGt365d] = useState(true);
  const [legalAidNeeded, setLegalAidNeeded] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lookup existing user when pseudonym is typed or updated
  useEffect(() => {
    const clean = pseudonym.trim();
    if (!clean || clean.length < 2) {
      setMatchedUser(null);
      setMatchedPersonId(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLookupLoading(true);
        const res = await fetch(`/api/persons?pseudonym=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.person) {
            setMatchedUser({
              id: data.person.id,
              pseudonym: data.person.pseudonym,
              checkinsCount: data.checkins?.length ?? data.person.checkin_count ?? 0,
              missedCount: data.person.missed_count ?? 0,
              lastCheckin:
                data.checkins && data.checkins.length > 0
                  ? data.checkins[data.checkins.length - 1].created_at
                  : undefined,
            });
            setMatchedPersonId(data.person.id);

            if (data.person.language === "en" || data.person.language === "hi") {
              setSelectedLanguage(data.person.language);
            }
            if (data.person.is_minor_flag !== undefined) {
              setIsMinor(data.person.is_minor_flag);
            }
            if (data.case) {
              setHasCase(true);
              const knownCategories = [
                "land_dispossession",
                "physical_assault",
                "caste_discrimination",
                "verbal_abuse",
                "social_boycott",
                "sexual_harassment",
                "witness_intimidation",
                "police_inaction",
                "retaliatory_case",
                "property_destruction",
                "denial_of_rights",
                "general_distress",
              ];
              if (knownCategories.includes(data.case.atrocity_category)) {
                setAtrocityCategory(data.case.atrocity_category);
              } else {
                setAtrocityCategory("other_custom");
                setCustomCategory(data.case.atrocity_category);
              }
              setStage(data.case.stage || "trial");
              setBailStatus(data.case.bail_status || "in_custody");
              setSocialBoycott(Boolean(data.case.social_boycott_flag));
              setIntimidationWithin14d(Boolean(data.case.last_intimidation_report));
              setNextHearingWithin7d(Boolean(data.case.next_hearing_date));
              setReliefOverdue30d(!data.case.relief_paid);
              setAdjournmentsGte3((data.case.adjournment_count || 0) >= 3);
              if (data.case.custom_case_details) {
                setCustomCaseDetails(data.case.custom_case_details);
              }
              if (data.case.other_pressure_details) {
                setOtherPressureDetails(data.case.other_pressure_details);
              }
            }
            return;
          }
        }
        setMatchedUser(null);
        setMatchedPersonId(null);
      } catch {
        setMatchedUser(null);
        setMatchedPersonId(null);
      } finally {
        setLookupLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [pseudonym]);

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

  const handleGenerateRandomId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setPseudonym(`A-${randomNum}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const cleanPseudonym = pseudonym.trim() || `A-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!PseudonymRegex.test(cleanPseudonym)) {
      setErrorMsg("Anonymous ID must start with 'A-' or 'U-' followed by 2-28 alphanumeric characters (e.g. A-9051 or U-1001). Real names or phone numbers are prohibited to protect your privacy.");
      setSaving(false);
      return;
    }

    try {
      const resolvedCategory =
        atrocityCategory === "other_custom"
          ? customCategory.trim() || "general_distress"
          : atrocityCategory;

      const payload: CustomPersonRequest = {
        id: matchedPersonId || (initialPersona?.isCustom ? initialPersona.id : undefined),
        pseudonym: cleanPseudonym,
        language: selectedLanguage,
        isMinor,
        consentGranted,
        checkinCount: matchedUser?.checkinsCount ?? 0,
        missedCount: matchedUser?.missedCount ?? 0,
        hasCase,
        caseData: hasCase
          ? {
              atrocityCategory: resolvedCategory,
              customCategory: atrocityCategory === "other_custom" ? customCategory.trim() : undefined,
              customCaseDetails: customCaseDetails.trim() || undefined,
              otherPressureDetails: otherPressureDetails.trim() || undefined,
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
      };

      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save check-in profile");
      }

      // If user chose a different language, sync app language
      if (selectedLanguage !== appLanguage) {
        setAppLanguage(selectedLanguage);
      }

      const isConsentActive = Boolean(data.consent && !data.consent.withdrawn_at);
      const newPresetPersona: PresetPersona = {
        id: data.person.id,
        consentId: data.consent.id,
        pseudonym: data.person.pseudonym,
        label: `${data.person.pseudonym} (Self-Directed Check-in)`,
        language: data.person.language,
        isMinor: data.person.is_minor_flag,
        s3Standing: data.s3Standing,
        isCustom: true,
      };

      onSave(newPresetPersona, isConsentActive);
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
                  "Share your situation confidentially at your own pace. No pre-set persona required."
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
                    placeholder="e.g. A-1911 or A-4471"
                    maxLength={20}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-primary text-xs font-mono font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomId}
                    title="Generate New Random ID"
                    className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Auto</span>
                  </button>
                </div>

                {/* Inline pseudonym format validation */}
                {pseudonym.trim().length > 0 && !PseudonymRegex.test(pseudonym.trim()) && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    Anonymous code must start with &apos;A-&apos; or &apos;U-&apos; (e.g. A-9051). Do not enter your real name.
                  </p>
                )}

                {/* Dynamic user match feedback */}
                {lookupLoading ? (
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Search className="w-3 h-3 animate-spin" />
                    <span>Checking record...</span>
                  </p>
                ) : matchedUser ? (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">
                        Welcome back! Matched existing record for {matchedUser.pseudonym}.
                      </span>
                      <span className="text-slate-600 block mt-0.5">
                        Your case details and check-in timeline have been automatically connected.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t(
                      "customModal.zeroPiiNotice",
                      "Strict Zero PII: Enter your anonymous code or generate a random one. Never enter your real name."
                    )}
                  </p>
                )}
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
                      "Safe diversion: Minors are connected directly with accredited human caseworkers."
                    )}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Court & Legal Case Context */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>{t("customModal.caseHeader", "2. Legal Case & Current Situation")}</span>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                <span className="text-slate-600 font-medium">Has Active Legal Case?</span>
                <input
                  type="checkbox"
                  checked={hasCase}
                  onChange={(e) => setHasCase(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Informational Guidance: How Case Context Drives Priority Caseworker Support */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>How Case Context Drives Priority Support (S3 Engine)</span>
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Adding legal docket milestones—such as court hearings within 7 days (+15), accused released on bail (+20), or recent intimidation reports (+25)—activates the deterministic S3 scoring engine. When S3 ≥ 60 or composite distress is elevated, the system automatically escalates your check-in to high-priority triage on the caseworker dashboard.
              </p>
            </div>

            {hasCase ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Case / Issue Category:
                    </label>
                    <select
                      value={atrocityCategory}
                      onChange={(e) => setAtrocityCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="land_dispossession">Land Dispossession / Encroachment / Property Grab</option>
                      <option value="physical_assault">Physical Assault / Bodily Harm / Violence</option>
                      <option value="caste_discrimination">Caste Discrimination / Atrocities Act / Public Humiliation</option>
                      <option value="verbal_abuse">Verbal Abuse / Threats / Criminal Intimidation</option>
                      <option value="social_boycott">Social Boycott / Community Ostracism / Economic Blockade</option>
                      <option value="sexual_harassment">Sexual Harassment / Gender-based Violence</option>
                      <option value="witness_intimidation">Witness Tampering / Pressure to Compromise or Withdraw</option>
                      <option value="police_inaction">Police Inaction / Refusal or Delay in Registering FIR</option>
                      <option value="retaliatory_case">False / Retaliatory Counter-Complaint Filed by Accused</option>
                      <option value="property_destruction">Destruction of Home, Crops, Livestock, or Livelihood</option>
                      <option value="denial_of_rights">Denial of Access to Public Water, Roads, or Common Land</option>
                      <option value="general_distress">General Legal Dispute / Court Litigation</option>
                      <option value="other_custom">Other (Fill in as per your situation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Case Stage:
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="investigation">Investigation (Police FIR / Preliminary Stage)</option>
                      <option value="trial">Trial (Court Hearings / Witness Examination)</option>
                      <option value="rehabilitation">Rehabilitation (Protective Custody / Resettlement)</option>
                      <option value="compensation">Compensation (Relief Claim / Victim Support Pending)</option>
                    </select>
                  </div>
                </div>

                {/* Option to specify custom category if "other_custom" is selected */}
                {atrocityCategory === "other_custom" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specify Your Situation / Case Type:
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Unlawful workplace dismissal, illegal eviction by landlord, etc."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                {/* Dedicated Option to Fill In as per the User */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Describe your legal situation or case in your own words (Optional):</span>
                  </label>
                  <textarea
                    value={customCaseDetails}
                    onChange={(e) => setCustomCaseDetails(e.target.value)}
                    placeholder="Share any specific details about what happened, upcoming hearings, threats, or what kind of legal assistance you need..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-primary leading-relaxed resize-y"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This provides context to help our counselors understand your legal background and pressures.
                  </p>
                </div>

                {/* Structural Stress Circumstances (NO Points Displayed) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="font-semibold text-xs text-slate-900 block">
                    Select any circumstances that apply to your current situation:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Bail Status */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={bailStatus === "accused_on_bail"}
                        onChange={(e) =>
                          setBailStatus(e.target.checked ? "accused_on_bail" : "in_custody")
                        }
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Accused person is currently on bail or residing nearby
                      </span>
                    </label>

                    {/* Next Hearing within 7 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={nextHearingWithin7d}
                        onChange={(e) => setNextHearingWithin7d(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Court hearing scheduled in the coming days (within 7 days)
                      </span>
                    </label>

                    {/* Intimidation report within last 14 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={intimidationWithin14d}
                        onChange={(e) => setIntimidationWithin14d(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Received threats, coercion, or intimidation within the last 14 days
                      </span>
                    </label>

                    {/* Relief overdue > 30 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={reliefOverdue30d}
                        onChange={(e) => setReliefOverdue30d(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Relief compensation under SC/ST Act is delayed or overdue
                      </span>
                    </label>

                    {/* High Adjournments */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={adjournmentsGte3}
                        onChange={(e) => setAdjournmentsGte3(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Case has faced multiple adjournments or prolonged delays
                      </span>
                    </label>

                    {/* Social Boycott */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={socialBoycott}
                        onChange={(e) => setSocialBoycott(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Facing village social boycott, isolation, or community pressure
                      </span>
                    </label>

                    {/* Case open > 365 days */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={caseOpenGt365d}
                        onChange={(e) => setCaseOpenGt365d(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Case has been ongoing for more than 1 year
                      </span>
                    </label>

                    {/* Legal Aid Needed */}
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={legalAidNeeded}
                        onChange={(e) => setLegalAidNeeded(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">
                        Need assistance finding free legal aid or connecting with a lawyer
                      </span>
                    </label>
                  </div>

                  {/* Option to fill in other pressures */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Other specific safety concerns or pressures you are facing (Optional):
                    </label>
                    <input
                      type="text"
                      value={otherPressureDetails}
                      onChange={(e) => setOtherPressureDetails(e.target.value)}
                      placeholder="e.g. Hostile neighbors, lack of transportation to court, harassment of family members..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
                {t(
                  "customModal.noCaseNotice",
                  "No active court case or legal dispute selected. Your check-in will focus purely on your personal emotional wellbeing and peace of mind."
                )}
              </div>
            )}
          </div>

          {/* Section 3: Voluntary Consent */}
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
                    "I voluntarily consent to confidential check-in support. My responses will never affect legal outcomes or compensation claims."
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
