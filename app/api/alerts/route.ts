import { NextRequest, NextResponse } from "next/server";
import { AlertAckRequestSchema, AlertRecord } from "@/types/contract";
import { getRepository } from "@/lib/db/repository";

/**
 * Staff Alerts API (/api/alerts)
 *
 * GET  - List alerts sorted chronologically (latest first)
 * POST - Acknowledge alert, record staff handle & disposition, write audit log
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tierFilter = searchParams.get("tier");
    const pendingOnly = searchParams.get("pending") === "true";

    const repo = getRepository();
    let alerts = await repo.listAlerts();

    if (tierFilter) {
      alerts = alerts.filter((a) => a.tier === tierFilter);
    }

    if (pendingOnly) {
      alerts = alerts.filter((a) => a.disposition === "pending" || a.acked_at === null);
    }

    return NextResponse.json({ ok: true, alerts }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AlertAckRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid alert ack request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { alertId, ackedBy, disposition } = parsed.data;
    const repo = getRepository();

    const updatedAlert = await repo.acknowledgeAlert(alertId, ackedBy, disposition);

    if (!updatedAlert) {
      return NextResponse.json(
        { error: "Alert not found with provided ID" },
        { status: 404 }
      );
    }

    // Record immutable audit event
    await repo.createAuditEvent({
      actor: ackedBy,
      role: "counsellor",
      action: "ack_alert",
      subject_id: alertId,
    });

    return NextResponse.json({ ok: true, alert: updatedAlert }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 }
    );
  }
}
