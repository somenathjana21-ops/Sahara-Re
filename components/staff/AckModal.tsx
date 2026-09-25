"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, ShieldAlert, PhoneCall, ArrowUpRight, CheckCheck } from "lucide-react";
import { AlertDisposition, AlertRecord } from "@/types/contract";

interface AckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedAlert: AlertRecord) => void;
  alert: AlertRecord | null;
  personPseudonym: string;
}

export default function AckModal({
  isOpen,
  onClose,
  onSuccess,
  alert,
  personPseudonym,
}: AckModalProps) {
  const [ackedBy, setAckedBy] = useState("");
  const [disposition, setDisposition] = useState<AlertDisposition>("contacted");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedHandle =
        sessionStorage.getItem("sahara_staff_handle") ||
        localStorage.getItem("sahara_staff_handle") ||
        "";
      setAckedBy(savedHandle || "Dr. Ananya Sharma");
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackedBy.trim()) {
      setErrorMsg("Staff handle is required to acknowledge this alert.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alert.id,
          ackedBy: ackedBy.trim(),
          disposition,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to acknowledge alert");
        setSubmitting(false);
        return;
      }

      onSuccess(data.alert);
      onClose();
    } catch {
      setErrorMsg("Network error occurred while acknowledging alert");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Acknowledge Case Alert</h2>
              <p className="text-xs text-slate-500">
                Persona <span className="font-semibold text-slate-800">{personPseudonym}</span> • Tier {alert.tier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Staff Identifier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Counsellor / Operator Handle <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ackedBy}
              onChange={(e) => setAckedBy(e.target.value)}
              placeholder="e.g. Dr. Ananya Sharma or duty_counsellor"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Recorded in the immutable audit log as the accountable responder.
            </p>
          </div>

          {/* Disposition Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Action Disposition <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  disposition === "contacted"
                    ? "bg-emerald-50/60 border-primary text-slate-900 ring-1 ring-primary"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="disposition"
                  value="contacted"
                  checked={disposition === "contacted"}
                  onChange={() => setDisposition("contacted")}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                    <PhoneCall className="w-3.5 h-3.5 text-primary" />
                    <span>Contacted — Outreach Completed</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct outreach initiated via safe telephone / messaging channel; de-escalation protocol active.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  disposition === "escalated"
                    ? "bg-amber-50/60 border-amber-600 text-slate-900 ring-1 ring-amber-600"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="disposition"
                  value="escalated"
                  checked={disposition === "escalated"}
                  onChange={() => setDisposition("escalated")}
                  className="mt-1 accent-amber-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                    <span>Escalated — Emergency / Legal Mobile Unit</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Forwarded to field protection officer, emergency legal aid cell, or district crisis helpline.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  disposition === "no_action_needed"
                    ? "bg-slate-100 border-slate-400 text-slate-900 ring-1 ring-slate-400"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="disposition"
                  value="no_action_needed"
                  checked={disposition === "no_action_needed"}
                  onChange={() => setDisposition("no_action_needed")}
                  className="mt-1 accent-slate-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                    <CheckCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>No Action Needed — Docket Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Docket and recent trajectory reviewed; situation stable, victim has safe local support.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Caseworker / Clinical Rationale (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record brief rationale, victim response, or court date prep..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-primary hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Recording ACK..." : "Confirm Acknowledgment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
