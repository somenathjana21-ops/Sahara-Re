import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode, staffHandle } = body;

    const expectedPasscode = process.env.STAFF_PASSCODE || "sahara2026";

    if (!passcode || passcode !== expectedPasscode) {
      return NextResponse.json(
        { error: "Invalid staff passcode. Please check your credentials." },
        { status: 401 }
      );
    }

    const handle = (staffHandle && staffHandle.trim()) || "counsellor_on_duty";

    return NextResponse.json(
      {
        ok: true,
        staffHandle: handle,
        sessionToken: `staff_${Date.now()}`,
        role: "counsellor",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}
