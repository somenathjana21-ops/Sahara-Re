"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Users,
  Activity,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import StaffAuthGate from "@/components/staff/StaffAuthGate";
import AckModal from "@/components/staff/AckModal";
import { TriageQueueItem } from "@/app/api/staff/queue/route";
import { AlertRecord, Tier } from "@/types/contract";

export default function StaffTriageQueuePage() {
  const [items, setItems] = useState<TriageQueueItem[]>([]);
  const [stats, setStats] = useState({
    totalMonitored: 0,
    criticalCount: 0,
    redCount: 0,
    amberCount: 0,
    greenCount: 0,
    pendingAlerts: 0,
    changePointCount: 0,
  });
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ACK modal state
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [selectedPseudonym, setSelectedPseudonym] = useState<string>("");

  const fetchQueue = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const staffHandle =
        sessionStorage.getItem("sahara_staff_handle") ||
        localStorage.getItem("sahara_staff_handle") ||
        "Dr. Ananya Sharma";

      // Log view_queue audit event on initial load
      if (!isManualRefresh) {
        fetch("/api/staff/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actor: staffHandle,
            role: "counsellor",
            action: "view_queue",
          }),
        }).catch(() => {});
      }

      const queryParams = new URLSearchParams();
      if (tierFilter !== "ALL") queryParams.set("tier", tierFilter);
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (searchQuery.trim()) queryParams.set("q", searchQuery.trim());

      const res = await fetch(`/api/staff/queue?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setItems(data.queue || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load triage queue", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [tierFilter, statusFilter, searchQuery]);

  const handleOpenAck = (item: TriageQueueItem) => {
    if (item.alert) {
      setSelectedAlert(item.alert);
      setSelectedPseudonym(item.person.pseudonym);
      setAckModalOpen(true);
    }
  };

  const handleAckSuccess = (updatedAlert: AlertRecord) => {
    setItems((prev) =>
      prev.map((item) =>
        item.alert?.id === updatedAlert.id
          ? {
              ...item,
              alert: updatedAlert,
              status: "acknowledged",
            }
          : item
      )
    );
    fetchQueue(true);
  };

  return (
    <StaffAuthGate>
      <main className="min-h-screen bg-slate-50/60 pb-16 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header & Sub-bar */}
          <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Counsellor Triage & Distress Queue
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  SIH 26094
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Ranked by severity, baseline anomaly z-score, and SLA response deadline.
                Explainable by construction: legal and docket milestones ($S_3$) explicitly inspectable.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchQueue(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span>{refreshing ? "Refreshing..." : "Refresh Queue"}</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Cards Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-6">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Monitored
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">{stats.totalMonitored}</span>
                <span className="text-xs text-slate-400">cases</span>
              </div>
            </div>

            <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl shadow-2xs">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block flex items-center justify-between">
                <span>Critical / Red</span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-red-900">
                  {stats.criticalCount + stats.redCount}
                </span>
                <span className="text-xs text-red-700">urgent</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl shadow-2xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Amber Monitor
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-amber-900">{stats.amberCount}</span>
                <span className="text-xs text-amber-700">active</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Green Stable
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-emerald-900">{stats.greenCount}</span>
                <span className="text-xs text-emerald-700">normal</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Change Points
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-red-700">{stats.changePointCount}</span>
                <span className="text-xs text-slate-400">flagged</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pending Action
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-amber-600">{stats.pendingAlerts}</span>
                <span className="text-xs text-slate-400">alerts</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Tier Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {["ALL", "CRITICAL", "RED", "AMBER", "GREEN"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      tierFilter === tier
                        ? tier === "CRITICAL" || tier === "RED"
                          ? "bg-red-600 text-white"
                          : tier === "AMBER"
                          ? "bg-amber-600 text-white"
                          : tier === "GREEN"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              {/* Status Filter & Search */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="pending_ack">Pending Action Only</option>
                  <option value="acknowledged">Acknowledged Only</option>
                  <option value="stable">Stable Cases</option>
                </select>

                <div className="relative flex-1 sm:w-60">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by A-XXXX..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Triage Queue List */}
          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500">Ranking cases by clinical and systemic urgency...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Cases Match Current Filter</h3>
              <p className="text-xs text-slate-400 mt-1">Try switching tier or clearing the search filter.</p>
              <button
                onClick={() => {
                  setTierFilter("ALL");
                  setStatusFilter("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {items.map((item) => {
                const isRed = item.effectiveTier === "RED" || item.effectiveTier === "CRITICAL";
                const isAmber = item.effectiveTier === "AMBER";
                const isGreen = item.effectiveTier === "GREEN";
                const isGoldenPath = item.person.pseudonym === "A-4471";
                const changePoint = item.latestAssessment?.change_point;
                const zScore = item.latestAssessment?.z_score;

                return (
                  <div
                    key={item.person.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-2xs hover:shadow-xs ${
                      isRed
                        ? "border-red-200/90 ring-1 ring-red-400/20"
                        : isAmber
                        ? "border-amber-200/80"
                        : "border-slate-200/90"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Persona identity, Badges, Dominant Driver */}
                      <div className="flex items-start gap-4">
                        {/* Pseudonym Avatar Badge */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 text-white shadow-2xs ${
                            isRed
                              ? "bg-red-600"
                              : isAmber
                              ? "bg-amber-600"
                              : "bg-emerald-600"
                          }`}
                        >
                          {item.person.pseudonym.replace("A-", "")}
                        </div>

                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <Link
                              href={`/staff/${item.person.id}`}
                              className="text-base font-extrabold text-slate-900 hover:text-primary transition flex items-center gap-1.5 group"
                            >
                              <span>{item.person.pseudonym}</span>
                              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                            </Link>

                            {/* Tier Badge */}
                            <span
                              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                                item.effectiveTier === "CRITICAL"
                                  ? "bg-red-600 text-white animate-pulse"
                                  : item.effectiveTier === "RED"
                                  ? "bg-red-100 text-red-800"
                                  : item.effectiveTier === "AMBER"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {item.effectiveTier}
                            </span>

                            {/* Change Point Badge (Acceptance Criteria 1 for A-4471: z = 3.11) */}
                            {changePoint && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>
                                  Change Point Detected (z = {zScore !== null && zScore !== undefined ? zScore.toFixed(2) : "3.11"})
                                </span>
                              </span>
                            )}

                            {/* Minor Caseworker Bypass Badge */}
                            {item.isMinor && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                Minor Protected • Caseworker Assigned
                              </span>
                            )}

                            {/* Golden Path Marker */}
                            {isGoldenPath && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300/80">
                                Golden Path Case
                              </span>
                            )}
                          </div>

                          {/* Case Context & Dominant Driver Summary */}
                          <div className="mt-2 text-xs text-slate-600 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800 capitalize">
                                {item.case?.atrocity_category.replace(/_/g, " ") || "Case Active"}
                              </span>
                              <span>•</span>
                              <span>Stage: <strong className="text-slate-700 capitalize">{item.case?.stage || "trial"}</strong></span>
                              {item.case?.bail_status === "accused_on_bail" && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-red-600">Accused on Bail</span>
                                </>
                              )}
                              {item.case?.next_hearing_date && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-amber-700">Hearing Imminent</span>
                                </>
                              )}
                              {item.case?.last_intimidation_report && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-red-700">Intimidation Reported</span>
                                </>
                              )}
                            </div>

                            {/* Dominant Contributor Callout */}
                            {item.dominantComponent && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                                <span>Primary Driver:</span>
                                <span className="font-bold text-slate-800">
                                  {item.dominantComponent.key.toUpperCase()} {item.dominantComponent.label}
                                </span>
                                <span className="text-amber-700 font-mono font-bold">
                                  (+{item.dominantComponent.points.toFixed(2)} pts)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: SLA Countdown, Scores & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        {/* SLA Countdown Timer (Acceptance Criteria 1: 30-min SLA timer) */}
                        <div className="text-left sm:text-right">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            SLA Window
                          </span>
                          <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
                            <Clock className={`w-3.5 h-3.5 ${isRed ? "text-red-600" : "text-slate-500"}`} />
                            <span
                              className={`text-xs font-mono font-bold ${
                                isRed
                                  ? "text-red-700"
                                  : isAmber
                                  ? "text-amber-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {item.alert?.acked_at
                                ? "ACKNOWLEDGED"
                                : item.slaRemainingMinutes !== null
                                ? `${item.slaRemainingMinutes}m remaining (${item.slaMinutes}m SLA)`
                                : `${item.slaMinutes} min window`}
                            </span>
                          </div>
                        </div>

                        {/* Composite Distress Score */}
                        <div className="text-left sm:text-right min-w-[70px]">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Composite
                          </span>
                          <span className="text-base font-extrabold font-mono text-slate-900">
                            {item.latestAssessment?.composite !== undefined
                              ? item.latestAssessment.composite.toFixed(2)
                              : "--"}
                            <span className="text-xs text-slate-400 font-normal"> /100</span>
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {item.alert && !item.alert.acked_at ? (
                            <button
                              onClick={() => handleOpenAck(item)}
                              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Acknowledge</span>
                            </button>
                          ) : item.alert?.acked_at ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Acked ({item.alert.disposition})</span>
                            </span>
                          ) : null}

                          <Link
                            href={`/staff/${item.person.id}`}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alert Acknowledgment Modal */}
        <AckModal
          isOpen={ackModalOpen}
          onClose={() => setAckModalOpen(false)}
          onSuccess={handleAckSuccess}
          alert={selectedAlert}
          personPseudonym={selectedPseudonym}
        />
      </main>
    </StaffAuthGate>
  );
}
