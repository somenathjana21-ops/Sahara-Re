import { NextRequest, NextResponse } from "next/server";
import {
  CustomPersonRequestSchema,
  PersonRecord,
  CaseRecord,
  ConsentRecord,
} from "@/types/contract";
import { getRepository } from "@/lib/db/repository";
import { computeS3 } from "@/lib/scoring/s3";

/**
 * Custom Persons API (/api/persons)
 *
 * Enables dynamic registration and configuration of direct users without needing
 * a predefined persona. Allows the user to fill in their own identity, language,
 * minor status, baseline history, and legal case docket context (which determines S3).
 */

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parseResult = CustomPersonRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid custom person payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const repo = getRepository();

    // Determine or generate person UUID
    const personId = data.id || crypto.randomUUID();

    // Check if person already exists (mutation vs creation)
    const existingPerson = await repo.getPerson(personId);

    const personRecord: PersonRecord = {
      id: personId,
      pseudonym: data.pseudonym?.trim() || existingPerson?.pseudonym || `A-${Math.floor(1000 + Math.random() * 9000)}`,
      language: data.language,
      is_minor_flag: data.isMinor,
      baseline_mean: data.baselineMean !== undefined ? data.baselineMean : (existingPerson?.baseline_mean ?? null),
      baseline_var: data.baselineVar !== undefined ? data.baselineVar : (existingPerson?.baseline_var ?? null),
      checkin_count: data.checkinCount ?? existingPerson?.checkin_count ?? 0,
      missed_count: data.missedCount ?? existingPerson?.missed_count ?? 0,
      created_at: existingPerson?.created_at || new Date().toISOString(),
    };

    await repo.savePerson(personRecord);

    // Handle voluntary consent
    const existingConsent = await repo.getActiveConsent(personId);
    let consentRecord: ConsentRecord;

    if (existingConsent && data.consentGranted) {
      consentRecord = existingConsent;
    } else {
      consentRecord = {
        id: existingConsent?.id || crypto.randomUUID(),
        person_id: personId,
        purpose: "distress_monitoring",
        capture_method: "tap",
        granted_at: new Date().toISOString(),
        withdrawn_at: data.consentGranted ? null : new Date().toISOString(),
      };
      await repo.saveConsent(consentRecord);
    }

    // Handle case docket details if user reported having a case
    let caseRecord: CaseRecord | null = null;
    let s3Score = 0;
    let s3Details = {
      score: 0,
      standingPoints: 0,
      timeWindowedPoints: 0,
      totalPoints: 0,
      capped: false,
      conditions: [] as any[],
      reasons: ["No active legal case context recorded"],
    };

    if (data.hasCase && data.caseData) {
      const cd = data.caseData;
      const existingCase = await repo.getCaseByPersonId(personId);

      // Resolve relative date offsets to YYYY-MM-DD strings
      let nextHearingDate: string | null = null;
      if (typeof cd.nextHearingDays === "number") {
        nextHearingDate = new Date(Date.now() + cd.nextHearingDays * 86400000).toISOString().split("T")[0]!;
      } else if (cd.nextHearingDate !== undefined) {
        nextHearingDate = cd.nextHearingDate;
      }

      let lastIntimidationReport: string | null = null;
      if (typeof cd.intimidationReportDaysAgo === "number") {
        lastIntimidationReport = new Date(Date.now() - cd.intimidationReportDaysAgo * 86400000).toISOString().split("T")[0]!;
      } else if (cd.lastIntimidationReport !== undefined) {
        lastIntimidationReport = cd.lastIntimidationReport;
      }

      let reliefDueDate: string | null = null;
      let reliefPaid = cd.reliefPaid ?? true;
      if (typeof cd.reliefOverdueDays === "number") {
        reliefDueDate = new Date(Date.now() - cd.reliefOverdueDays * 86400000).toISOString().split("T")[0]!;
        reliefPaid = false;
      } else if (cd.reliefDueDate !== undefined) {
        reliefDueDate = cd.reliefDueDate;
      }

      let openedAt = new Date(Date.now() - (cd.caseOpenDaysAgo ?? 100) * 86400000).toISOString().split("T")[0]!;
      if (cd.openedAt) {
        openedAt = cd.openedAt;
      }

      caseRecord = {
        id: existingCase?.id || crypto.randomUUID(),
        person_id: personId,
        atrocity_category: cd.atrocityCategory || "general_distress",
        stage: cd.stage || "trial",
        next_hearing_date: nextHearingDate,
        adjournment_count: cd.adjournmentCount ?? 0,
        bail_status: cd.bailStatus || "in_custody",
        relief_due_date: reliefDueDate,
        relief_paid: reliefPaid,
        social_boycott_flag: cd.socialBoycott ?? false,
        last_intimidation_report: lastIntimidationReport,
        opened_at: openedAt,
      };

      await repo.saveCase(caseRecord);

      // Deterministic S3 score computation
      const computed = computeS3(caseRecord);
      s3Score = computed.score;
      s3Details = computed;
    }

    return NextResponse.json(
      {
        ok: true,
        person: personRecord,
        consent: consentRecord,
        case: caseRecord,
        s3Standing: s3Score,
        s3Details,
      },
      { status: existingPerson ? 200 : 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create or update custom person",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");
    const repo = getRepository();

    if (personId) {
      const person = await repo.getPerson(personId);
      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }
      const caseRecord = await repo.getCaseByPersonId(person.id);
      const consent = await repo.getActiveConsent(person.id);
      const s3Details = caseRecord ? computeS3(caseRecord) : null;

      return NextResponse.json(
        {
          ok: true,
          person,
          case: caseRecord,
          consent,
          s3Standing: s3Details ? s3Details.score : 0,
          s3Details,
        },
        { status: 200 }
      );
    }

    const persons = await repo.listPersons();
    return NextResponse.json({ ok: true, persons }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve persons", message: (error as Error).message },
      { status: 500 }
    );
  }
}
