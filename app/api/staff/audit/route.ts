import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/db/repository";

const AuditEventCreateSchema = z.object({
  actor: z.string().min(1).default("counsellor_staff"),
  role: z.enum(["counsellor", "operator", "admin"]).default("counsellor"),
  action: z.enum(["view_queue", "view_person", "ack_alert", "dispose"]),
  subject_id: z.string().nullable().optional(),
});

/**
 * Staff Audit Log API (/api/staff/audit)
 *
 * GET  - Retrieve immutable audit trail
 * POST - Record immutable staff audit event (view_queue, view_person, ack_alert, dispose)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const subjectId = searchParams.get("subject_id") || searchParams.get("subjectId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const repo = getRepository();
    let events = await repo.listAuditEvents();

    if (action) {
      events = events.filter((e) => e.action === action);
    }

    if (subjectId) {
      events = events.filter((e) => e.subject_id === subjectId);
    }

    return NextResponse.json(
      { ok: true, events: events.slice(0, limit) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list audit events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AuditEventCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid audit event payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { actor, role, action, subject_id } = parsed.data;
    const repo = getRepository();

    const event = await repo.createAuditEvent({
      actor,
      role,
      action,
      subject_id: subject_id ?? null,
    });

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record audit event" },
      { status: 500 }
    );
  }
}
