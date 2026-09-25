import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/db/repository";
import { CaseRecord } from "@/types/contract";

/**
 * Cases API (/api/cases)
 *
 * GET   - Query case docket by personId or pseudonym
 * PATCH - Update case milestones for simulation (e.g. court hearings, intimidation reports, bail)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");
    const pseudonym = searchParams.get("pseudonym");

    const repo = getRepository();

    if (personId) {
      const caseRecord = await repo.getCaseByPersonId(personId);
      if (!caseRecord) {
        return NextResponse.json({ error: "Case not found for person" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, case: caseRecord }, { status: 200 });
    }

    if (pseudonym) {
      const person = await repo.getPersonByPseudonym(pseudonym);
      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }
      const caseRecord = await repo.getCaseByPersonId(person.id);
      if (!caseRecord) {
        return NextResponse.json({ error: "Case not found for person" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, case: caseRecord }, { status: 200 });
    }

    // Default to Golden Path Persona A-4471 case
    const defaultPerson = await repo.getPersonByPseudonym("A-4471");
    if (defaultPerson) {
      const caseRecord = await repo.getCaseByPersonId(defaultPerson.id);
      return NextResponse.json({ ok: true, case: caseRecord }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Provide either personId or pseudonym" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve case docket", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { personId, ...updates } = body;

    if (!personId) {
      return NextResponse.json(
        { error: "personId is required to update case docket" },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const existingCase = await repo.getCaseByPersonId(personId);

    if (!existingCase) {
      return NextResponse.json(
        { error: "No case found for the specified personId" },
        { status: 404 }
      );
    }

    const updatedCase: CaseRecord = {
      ...existingCase,
      ...(updates.stage !== undefined ? { stage: updates.stage } : {}),
      ...(updates.nextHearingDate !== undefined
        ? { next_hearing_date: updates.nextHearingDate }
        : {}),
      ...(updates.next_hearing_date !== undefined
        ? { next_hearing_date: updates.next_hearing_date }
        : {}),
      ...(updates.adjournmentCount !== undefined
        ? { adjournment_count: updates.adjournmentCount }
        : {}),
      ...(updates.adjournment_count !== undefined
        ? { adjournment_count: updates.adjournment_count }
        : {}),
      ...(updates.bailStatus !== undefined ? { bail_status: updates.bailStatus } : {}),
      ...(updates.bail_status !== undefined ? { bail_status: updates.bail_status } : {}),
      ...(updates.reliefDueDate !== undefined
        ? { relief_due_date: updates.reliefDueDate }
        : {}),
      ...(updates.relief_due_date !== undefined
        ? { relief_due_date: updates.relief_due_date }
        : {}),
      ...(updates.reliefPaid !== undefined ? { relief_paid: updates.reliefPaid } : {}),
      ...(updates.relief_paid !== undefined ? { relief_paid: updates.relief_paid } : {}),
      ...(updates.socialBoycottFlag !== undefined
        ? { social_boycott_flag: updates.socialBoycottFlag }
        : {}),
      ...(updates.social_boycott_flag !== undefined
        ? { social_boycott_flag: updates.social_boycott_flag }
        : {}),
      ...(updates.lastIntimidationReport !== undefined
        ? { last_intimidation_report: updates.lastIntimidationReport }
        : {}),
      ...(updates.last_intimidation_report !== undefined
        ? { last_intimidation_report: updates.last_intimidation_report }
        : {}),
    };

    await repo.saveCase(updatedCase);

    return NextResponse.json({ ok: true, case: updatedCase }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update case docket", message: (error as Error).message },
      { status: 500 }
    );
  }
}
