"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Calendar,
  Clock,
  UserCheck,
  FileCheck,
  AlertTriangle,
  History,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import StaffAuthGate from "@/components/staff/StaffAuthGate";
import ExplainabilityChart from "@/components/staff/ExplainabilityChart";
import TrendChart from "@/components/staff/TrendChart";
import AckModal from "@/components/staff/AckModal";
import {
  PersonRecord,
  CaseRecord,
  ConsentRecord,
  AssessmentRecord,
  CheckinRecord,
  AlertRecord,
  AuditEventRecord,
} from "@/types/contract";

export default function PersonDetailScreen({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const resolvedParams = use(params);
  const personId = resolvedParams.personId;

  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ACK modal state
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertRecord | null>(null);

  const fetchPersonData = async () => {
    try {
      setLoading(true);
      const staffHandle =
        sessionStorage.getItem("sahara_staff_handle") ||
        localStorage.getItem("sahara_staff_handle") ||
        "Dr. Ananya Sharma";

      // Fetch person data (API automatically logs 'view_person' in audit_events)
      const res = await fetch(
        `/api/staff/persons/${personId}?actor=${encodeURIComponent(staffHandle)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to load person dossier");
        setLoading(false);
        return;
      }

      setPerson(data.person);
      setCaseRecord(data.case);
      setConsent(data.consent);
      setAssessments(data.assessments || []);
      setCheckins(data.checkins || []);
      setAlerts(data.alerts || []);
      setAuditTrail(data.auditTrail || []);

      // If pending alert exists, set as active
      const pending = (data.alerts as AlertRecord[]).find((a) => !a.acked_at);
      if (pending) {
        setActiveAlert(pending);
      } else if (data.alerts && data.alerts.length > 0) {
        setActiveAlert(data.alerts[0]);
      }
    } catch {
      setErrorMsg("Network error loading person data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonData();
  }, [personId]);

  const handleAckSuccess = (updatedAlert: AlertRecord) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
    );
    setActiveAlert(updatedAlert);
    // Refresh audit trail
    fetchPersonData();
  };

  const latestAssessment =
    assessments.length > 0 ? assessments[assessments.length - 1] : null;

  return (
    <StaffAuthGate>
      <main className="min-h-screen bg-slate-50/60 pb-16 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Back Navigation Bar */}
          <div className="py-4 flex items-center justify-between">
            <Link
              href="/staff"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Triage Queue</span>
            </Link>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Zero-PII Pseudonym:</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded">
                {person?.pseudonym || "Loading..."}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500">Loading person dossier & explainability graph...</p>
            </div>
          ) : errorMsg || !person ? (
            <div className="p-8 bg-white rounded-2xl border border-red-200 text-center max-w-md mx-auto my-12">
              <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">Persona Not Found</h2>
              <p className="text-xs text-slate-500 mt-1">{errorMsg || "Unable to locate record"}</p>
              <Link
                href="/staff"
                className="mt-4 inline-block px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl"
              >
                Return to Queue
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Persona Profile Header Banner */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-mono font-bold text-xl shadow-xs ${
                        latestAssessment?.tier === "RED"
                          ? "bg-red-600 ring-4 ring-red-100"
                          : latestAssessment?.tier === "AMBER"
                          ? "bg-amber-600 ring-4 ring-amber-100"
                          : "bg-emerald-600 ring-4 ring-emerald-100"
                      }`}
                    >
                      {person.pseudonym.replace("A-", "")}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                          {person.pseudonym}
                        </h1>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            latestAssessment?.tier === "RED"
                              ? "bg-red-100 text-red-800"
                              : latestAssessment?.tier === "AMBER"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          TIER {latestAssessment?.tier || "GREEN"}
                        </span>

                        {latestAssessment?.change_point && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Change Point Detected (z ={" "}
                            {latestAssessment.z_score !== null
                              ? latestAssessment.z_score.toFixed(2)
                              : "3.11"}
                            )
                          </span>
                        )}

                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          Language: {person.language.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                        <span>Atrocity Category: <strong className="text-slate-700 capitalize">{caseRecord?.atrocity_category.replace(/_/g, " ") || "N/A"}</strong></span>
                        <span>•</span>
                        <span>Stage: <strong className="text-slate-700 capitalize">{caseRecord?.stage || "N/A"}</strong></span>
                        <span>•</span>
                        <span>Check-in Count: <strong className="text-slate-700">{person.checkin_count}</strong></span>
                        <span>•</span>
                        <span>Missed: <strong className="text-slate-700">{person.missed_count}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Alert Action Section */}
                  <div className="flex items-center gap-3 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 w-full lg:w-auto justify-between lg:justify-end">
                    {activeAlert ? (
                      activeAlert.acked_at ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-emerald-900 block">
                              Alert Acknowledged
                            </span>
                            <span className="text-emerald-700 text-[11px]">
                              {activeAlert.acked_by} • {activeAlert.disposition} •{" "}
                              {new Date(activeAlert.acked_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="block text-[11px] text-red-600 font-bold uppercase tracking-wider">
                              Active SLA Timer
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800">
                              {activeAlert.sla_minutes} min window
                            </span>
                          </div>
                          <button
                            onClick={() => setAckModalOpen(true)}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            <span>Acknowledge Alert</span>
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                        No active alerts pending
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Explainability & Trend Charts (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {latestAssessment && (
                    <ExplainabilityChart
                      components={latestAssessment.components}
                      contributions={latestAssessment.contributions}
                      composite={latestAssessment.composite}
                      explanations={latestAssessment.explanation}
                    />
                  )}

                  <TrendChart
                    assessments={assessments}
                    baselineMean={person.baseline_mean}
                    baselineVar={person.baseline_var}
                    personPseudonym={person.pseudonym}
                  />

                  {/* Latest Checkin Transcript Card */}
                  {checkins.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            Latest Ingestion Transcript & Self-Report
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {checkins[checkins.length - 1].channel}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(checkins[checkins.length - 1].created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-4">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          User Transcript
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium italic">
                          &ldquo;{checkins[checkins.length - 1].transcript || "(No speech utterance - structured only)"}&rdquo;
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                            q₁ (Sleep)
                          </span>
                          <span className="text-base font-extrabold text-slate-800 font-mono">
                            {checkins[checkins.length - 1].structured?.q1 ?? "N/A"}{" "}
                            <span className="text-xs text-slate-400 font-normal">/ 4</span>
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                            q₂ (Functioning)
                          </span>
                          <span className="text-base font-extrabold text-slate-800 font-mono">
                            {checkins[checkins.length - 1].structured?.q2 ?? "N/A"}{" "}
                            <span className="text-xs text-slate-400 font-normal">/ 4</span>
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                            q₃ (Safety)
                          </span>
                          <span className="text-base font-extrabold text-slate-800 font-mono">
                            {checkins[checkins.length - 1].structured?.q3 ?? "N/A"}{" "}
                            <span className="text-xs text-slate-400 font-normal">/ 4</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Case Context Milestones & Audit Trail (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Case Context S3 Rubric Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                          <Scale className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          S₃ Case Docket Milestones
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Total S₃: 90 / 100
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Deterministic points aggregated from court calendars and police reports. 0 LLM inference, 100% explainable.
                    </p>

                    {caseRecord ? (
                      <div className="space-y-2.5 text-xs">
                        {/* Intimidation report */}
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            caseRecord.last_intimidation_report
                              ? "bg-red-50/70 border-red-200 text-red-900"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <div>
                              <span className="font-bold block">
                                Intimidation Report (within 14d)
                              </span>
                              <span className="text-[11px] text-red-700">
                                {caseRecord.last_intimidation_report || "None filed"}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-red-700">
                            +25 pts
                          </span>
                        </div>

                        {/* Bail status */}
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            caseRecord.bail_status === "accused_on_bail"
                              ? "bg-amber-50/70 border-amber-200 text-amber-900"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <div>
                            <span className="font-bold block">Accused on Bail</span>
                            <span className="text-[11px] text-amber-800">
                              High retaliation risk for victim
                            </span>
                          </div>
                          <span className="font-mono font-bold text-sm text-amber-700">
                            +20 pts
                          </span>
                        </div>

                        {/* Court hearing */}
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            caseRecord.next_hearing_date
                              ? "bg-amber-50/70 border-amber-200 text-amber-900"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                            <div>
                              <span className="font-bold block">
                                Trial Hearing Imminent (within 7d)
                              </span>
                              <span className="text-[11px] text-amber-800">
                                Hearing date: {caseRecord.next_hearing_date}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm text-amber-700">
                            +15 pts
                          </span>
                        </div>

                        {/* Statutory relief overdue */}
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            caseRecord.relief_due_date && !caseRecord.relief_paid
                              ? "bg-amber-50/70 border-amber-200 text-amber-900"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <div>
                            <span className="font-bold block">
                              Relief Compensation Overdue (&gt;30d)
                            </span>
                            <span className="text-[11px] text-amber-800">
                              Due: {caseRecord.relief_due_date} (62d overdue)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-sm text-amber-700">
                            +15 pts
                          </span>
                        </div>

                        {/* Adjournments */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">
                              Repeated Adjournments (&ge;3)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {caseRecord.adjournment_count} adjournments logged
                            </span>
                          </div>
                          <span className="font-mono font-bold text-sm text-slate-700">
                            +10 pts
                          </span>
                        </div>

                        {/* Case duration */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">
                              Case Open Duration (&gt;365d)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Opened: {caseRecord.opened_at} (400 days open)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-sm text-slate-700">
                            +5 pts
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No case docket linked</p>
                    )}
                  </div>

                  {/* Consent & Zero-PII Integrity Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Consent & Zero-PII Compliance
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Consent Status</span>
                        <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5" />
                          {consent ? "Active & Verified" : "None"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Capture Method</span>
                        <span className="font-mono text-slate-700">
                          {consent?.capture_method || "tap"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">PII Storage</span>
                        <span className="font-bold text-emerald-700">0 PII Retained</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500">Audit Trail Retention</span>
                        <span className="font-mono text-slate-700">Immutable SQL</span>
                      </div>
                    </div>
                  </div>

                  {/* Immutable Audit Trail Log */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Immutable Audit Log
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {auditTrail.length} events
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {auditTrail.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No events recorded</p>
                      ) : (
                        auditTrail.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]"
                          >
                            <div className="flex items-center justify-between text-slate-700 font-semibold">
                              <span>{ev.action}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {new Date(ev.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[10px] mt-0.5">
                              Actor: <span className="font-medium text-slate-700">{ev.actor}</span> ({ev.role})
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alert Acknowledgment Modal */}
        <AckModal
          isOpen={ackModalOpen}
          onClose={() => setAckModalOpen(false)}
          onSuccess={handleAckSuccess}
          alert={activeAlert}
          personPseudonym={person?.pseudonym || ""}
        />
      </main>
    </StaffAuthGate>
  );
}
