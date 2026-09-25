import { NextRequest, NextResponse } from "next/server";
import { ConsentRequestSchema, ConsentRecord } from "@/types/contract";
import { getRepository } from "@/lib/db/repository";

/**
 * Consent Management API (/api/consent)
 *
 * GET  - Check active consent status for a person
 * POST - Grant and persist a new consent record
 * DELETE - Voluntarily revoke consent immediately
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");

    if (!personId) {
      return NextResponse.json(
        { error: "personId query parameter is required" },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const consent = await repo.getActiveConsent(personId);

    return NextResponse.json({ ok: true, consent }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve consent", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ConsentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid consent request payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const person = await repo.getPerson(parsed.data.personId);
    if (!person) {
      return NextResponse.json(
        { error: "Person record not found" },
        { status: 404 }
      );
    }

    const consentRecord: ConsentRecord = {
      id: crypto.randomUUID(),
      person_id: parsed.data.personId,
      purpose: parsed.data.purpose,
      capture_method: parsed.data.captureMethod,
      granted_at: new Date().toISOString(),
      withdrawn_at: null,
    };

    await repo.saveConsent(consentRecord);

    return NextResponse.json({ ok: true, consent: consentRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record consent", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let personId = searchParams.get("personId");

    if (!personId) {
      try {
        const body = await request.json();
        personId = body.personId;
      } catch {
        // Body optional if provided in query param
      }
    }

    if (!personId) {
      return NextResponse.json(
        { error: "personId is required to revoke consent" },
        { status: 400 }
      );
    }

    const repo = getRepository();
    await repo.revokeConsent(personId);

    return NextResponse.json(
      { ok: true, message: "Consent successfully withdrawn" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to revoke consent", message: (error as Error).message },
      { status: 500 }
    );
  }
}
