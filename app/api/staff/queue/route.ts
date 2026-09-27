import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { ensureStaffTriageFixtures } from "@/lib/db/staff-seed";
import { AlertRecord, AssessmentRecord, CaseRecord, PersonRecord, Tier } from "@/types/contract";

export interface TriageQueueItem {
  person: PersonRecord;
  case: CaseRecord | null;
  latestAssessment: AssessmentRecord | null;
  alert: AlertRecord | null;
  effectiveTier: Tier;
  dominantComponent: {
    key: "s1" | "s2" | "s3" | "s4" | "s5";
    label: string;
    points: number;
    raw: number | null;
  } | null;
  slaMinutes: number;
  slaRemainingMinutes: number | null;
  isOverdue: boolean;
  isMinor: boolean;
  status: "pending_ack" | "acknowledged" | "stable" | "minor_routed";
}

const TIER_PRIORITY: Record<Tier, number> = {
  CRITICAL: 4,
  RED: 3,
  AMBER: 2,
  GREEN: 1,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tierFilter = searchParams.get("tier");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("q")?.toLowerCase();

    const repo = getRepository();

    const persons = await repo.listPersons();
    const alerts = await repo.listAlerts();

    const items: TriageQueueItem[] = [];

    for (const person of persons) {
      const caseRecord = await repo.getCaseByPersonId(person.id);
      const assessments = await repo.getAssessmentsByPersonId(person.id);
      const latestAssessment = assessments.length > 0 ? (assessments[assessments.length - 1] ?? null) : null;

      // Find active pending or latest alert for this person
      const personAlerts = alerts.filter((a) => a.person_id === person.id);
      const alert = personAlerts.find((a) => a.acked_at === null) ?? (personAlerts[0] ?? null);

      const effectiveTier: Tier = alert
        ? alert.tier
        : latestAssessment
        ? latestAssessment.tier
        : "GREEN";

      // Dominant contributor calculation
      let dominantComponent: TriageQueueItem["dominantComponent"] = null;
      if (latestAssessment?.contributions) {
        const c = latestAssessment.contributions;
        const comps = latestAssessment.components;
        const entries: Array<{ key: "s1" | "s2" | "s3" | "s4" | "s5"; label: string; points: number; raw: number | null }> = [
          { key: "s1", label: "Self-Report Survey", points: c.s1, raw: comps.s1 },
          { key: "s2", label: "Linguistic Sentiment", points: c.s2, raw: comps.s2 },
          { key: "s3", label: "Legal Docket & Case Context", points: c.s3, raw: comps.s3 },
          { key: "s4", label: "Engagement Monotonicity", points: c.s4, raw: comps.s4 },
          { key: "s5", label: "Paralinguistic Acoustic", points: c.s5, raw: comps.s5 },
        ];
        // Sort descending by points
        entries.sort((a, b) => b.points - a.points);
        dominantComponent = entries[0] ?? null;
      }

      // SLA Calculations
      let slaMinutes = alert?.sla_minutes ?? (effectiveTier === "RED" ? 30 : effectiveTier === "CRITICAL" ? 15 : 240);
      let slaRemainingMinutes: number | null = null;
      let isOverdue = false;

      if (alert && alert.acked_at === null) {
        const createdAt = new Date(alert.created_at).getTime();
        const deadline = createdAt + alert.sla_minutes * 60 * 1000;
        const diffMs = deadline - Date.now();
        slaRemainingMinutes = Math.round(diffMs / (60 * 1000));
        if (slaRemainingMinutes < 0) {
          isOverdue = true;
        }
      }

      // Status determination
      let status: TriageQueueItem["status"] = "stable";
      if (person.is_minor_flag) {
        status = "minor_routed";
      } else if (alert) {
        status = alert.acked_at ? "acknowledged" : "pending_ack";
      } else if (effectiveTier === "RED" || effectiveTier === "CRITICAL") {
        status = "pending_ack";
      }

      items.push({
        person,
        case: caseRecord,
        latestAssessment,
        alert,
        effectiveTier,
        dominantComponent,
        slaMinutes,
        slaRemainingMinutes,
        isOverdue,
        isMinor: person.is_minor_flag,
        status,
      });
    }

    // Sort Queue by:
    // 1. Tier Severity: CRITICAL -> RED -> AMBER -> GREEN
    // 2. Change Point: Change Point true comes before false
    // 3. Pending ACK before Acknowledged
    // 4. Composite score descending
    items.sort((a, b) => {
      const tierDiff = TIER_PRIORITY[b.effectiveTier] - TIER_PRIORITY[a.effectiveTier];
      if (tierDiff !== 0) return tierDiff;

      const cpA = a.latestAssessment?.change_point ? 1 : 0;
      const cpB = b.latestAssessment?.change_point ? 1 : 0;
      if (cpB !== cpA) return cpB - cpA;

      const pendingA = a.status === "pending_ack" ? 1 : 0;
      const pendingB = b.status === "pending_ack" ? 1 : 0;
      if (pendingB !== pendingA) return pendingB - pendingA;

      const scoreA = a.latestAssessment?.composite ?? 0;
      const scoreB = b.latestAssessment?.composite ?? 0;
      return scoreB - scoreA;
    });

    // Apply Filters
    let filtered = items;
    if (tierFilter && tierFilter !== "ALL") {
      filtered = filtered.filter((i) => i.effectiveTier === tierFilter);
    }

    if (statusFilter && statusFilter !== "ALL") {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.person.pseudonym.toLowerCase().includes(search) ||
          i.case?.atrocity_category.toLowerCase().includes(search)
      );
    }

    // Summary Statistics
    const stats = {
      totalMonitored: items.length,
      criticalCount: items.filter((i) => i.effectiveTier === "CRITICAL").length,
      redCount: items.filter((i) => i.effectiveTier === "RED").length,
      amberCount: items.filter((i) => i.effectiveTier === "AMBER").length,
      greenCount: items.filter((i) => i.effectiveTier === "GREEN").length,
      pendingAlerts: items.filter((i) => i.status === "pending_ack").length,
      changePointCount: items.filter((i) => i.latestAssessment?.change_point).length,
    };

    return NextResponse.json(
      {
        ok: true,
        stats,
        queue: filtered,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch triage queue" },
      { status: 500 }
    );
  }
}
