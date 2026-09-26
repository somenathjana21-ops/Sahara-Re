import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

/**
 * Zod schema for case mutation validation.
 * Accepts both camelCase and snake_case field names for convenience.
 */
const CasePatchSchema = z.object({
  personId: z.string().uuid("personId must be a valid UUID"),
  stage: z.enum(["investigation", "trial", "rehabilitation", "compensation"]).optional(),
  nextHearingDate: z.string().optional(),
  next_hearing_date: z.string().optional(),
  adjournmentCount: z.number().int().min(0).optional(),
  adjournment_count: z.number().int().min(0).optional(),
  bailStatus: z.enum(["in_custody", "accused_on_bail"]).optional(),
  bail_status: z.enum(["in_custody", "accused_on_bail"]).optional(),
  reliefDueDate: z.string().optional(),
  relief_due_date: z.string().optional(),
  reliefPaid: z.boolean().optional(),
  relief_paid: z.boolean().optional(),
  socialBoycottFlag: z.boolean().optional(),
  social_boycott_flag: z.boolean().optional(),
  lastIntimidationReport: z.string().optional(),
  last_intimidation_report: z.string().optional(),
}).strict();

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const parseResult = CasePatchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid case update payload", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { personId, ...updates } = parseResult.data;

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
      ...(updates.nextHearingDate ?? updates.next_hearing_date
        ? { next_hearing_date: updates.nextHearingDate ?? updates.next_hearing_date }
        : {}),
      ...(updates.adjournmentCount ?? updates.adjournment_count
        ? { adjournment_count: updates.adjournmentCount ?? updates.adjournment_count }
        : {}),
      ...(updates.bailStatus ?? updates.bail_status
        ? { bail_status: updates.bailStatus ?? updates.bail_status }
        : {}),
      ...(updates.reliefDueDate ?? updates.relief_due_date
        ? { relief_due_date: updates.reliefDueDate ?? updates.relief_due_date }
        : {}),
      ...((updates.reliefPaid ?? updates.relief_paid) !== undefined
        ? { relief_paid: updates.reliefPaid ?? updates.relief_paid }
        : {}),
      ...((updates.socialBoycottFlag ?? updates.social_boycott_flag) !== undefined
        ? { social_boycott_flag: updates.socialBoycottFlag ?? updates.social_boycott_flag }
        : {}),
      ...(updates.lastIntimidationReport ?? updates.last_intimidation_report
        ? { last_intimidation_report: updates.lastIntimidationReport ?? updates.last_intimidation_report }
        : {}),
    };

    await repo.saveCase(updatedCase);

    return NextResponse.json({ ok: true, case: updatedCase }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update case docket" },
      { status: 500 }
    );
  }
}
