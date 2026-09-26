import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken, verifyPasscode } from "@/lib/auth/session";

/**
 * Staff Authentication API (/api/staff/auth)
 *
 * POST - Authenticate staff with passcode, return signed session token
 *
 * Security hardening:
 * - Constant-time passcode comparison (prevents timing attacks)
 * - No hardcoded fallback passcode (requires STAFF_PASSCODE env var)
 * - HMAC-signed session tokens (verifiable by middleware)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode, staffHandle } = body;

    if (!process.env.STAFF_PASSCODE) {
      console.error("[SAHARA] STAFF_PASSCODE environment variable is not set");
      return NextResponse.json(
        { error: "Staff authentication is not configured. Contact administrator." },
        { status: 503 }
      );
    }

    if (!passcode || !verifyPasscode(String(passcode))) {
      return NextResponse.json(
        { error: "Invalid staff passcode. Please check your credentials." },
        { status: 401 }
      );
    }

    const handle = (staffHandle && staffHandle.trim()) || "counsellor_on_duty";
    const sessionToken = generateSessionToken(handle, "counsellor");

    return NextResponse.json(
      {
        ok: true,
        staffHandle: handle,
        sessionToken,
        role: "counsellor",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
