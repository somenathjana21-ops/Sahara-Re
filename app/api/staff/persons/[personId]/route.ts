import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { ensureStaffTriageFixtures } from "@/lib/db/staff-seed";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await params;
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get("actor") || "counsellor_staff";
    const skipAudit = searchParams.get("skipAudit") === "true";

    const repo = getRepository();

    // Ensure initial demo fixtures exist
    await ensureStaffTriageFixtures(repo);

    const person = await repo.getPerson(personId);
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const caseRecord = await repo.getCaseByPersonId(person.id);
    const consent = await repo.getActiveConsent(person.id);
    const assessments = await repo.getAssessmentsByPersonId(person.id);
    const checkins = await repo.getCheckinsByPersonId(person.id);
    const allAlerts = await repo.listAlerts();
    const alerts = allAlerts.filter((a) => a.person_id === person.id);

    // Record immutable audit event for viewing person-level sensitive data (Acceptance Criteria 4)
    if (!skipAudit) {
      await repo.createAuditEvent({
        actor,
        role: "counsellor",
        action: "view_person",
        subject_id: person.id,
      });
    }

    // Retrieve recent audit history for this person
    const allAudit = await repo.listAuditEvents();
    const personAudit = allAudit.filter(
      (ev) => ev.subject_id === person.id || alerts.some((a) => a.id === ev.subject_id)
    );

    return NextResponse.json(
      {
        ok: true,
        person,
        case: caseRecord,
        consent,
        assessments,
        checkins,
        alerts,
        auditTrail: personAudit,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve person details", message: (error as Error).message },
      { status: 500 }
    );
  }
}
