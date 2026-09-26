import { NextRequest, NextResponse } from "next/server";
import { verifySessionTokenEdge } from "@/lib/auth/session-edge";

/**
 * Next.js Edge Middleware — Server-side authentication gate.
 *
 * Protects staff-only API routes by verifying HMAC-signed session tokens
 * from the Authorization header or sahara_session cookie.
 *
 * Protected routes:
 * - /api/staff/queue
 * - /api/staff/audit
 * - /api/staff/persons/*
 * - /api/alerts
 * - /api/cases (PATCH only — GET remains public for consent checks)
 *
 * Unprotected routes:
 * - /api/staff/auth (login endpoint itself)
 * - /api/checkin (public check-in pipeline)
 * - /api/consent (public consent management)
 * - All frontend pages (auth gating done client-side)
 */

const PROTECTED_PATHS = [
  "/api/staff/queue",
  "/api/staff/audit",
  "/api/staff/persons",
  "/api/alerts",
];

/**
 * Extract session token from request.
 * Checks Authorization: Bearer <token> header first, then cookie fallback.
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookie = request.cookies.get("sahara_session");
  return cookie?.value ?? null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth endpoint itself
  if (pathname === "/api/staff/auth") {
    return NextResponse.next();
  }

  // Check if this path requires authentication
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // /api/cases PATCH requires auth, but GET does not
  if (pathname === "/api/cases" && request.method === "PATCH") {
    return enforceAuth(request);
  }

  if (isProtected) {
    return enforceAuth(request);
  }

  return NextResponse.next();
}

async function enforceAuth(request: NextRequest): Promise<NextResponse> {
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required. Please login via /api/staff/auth." },
      { status: 401 }
    );
  }

  const payload = await verifySessionTokenEdge(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired session. Please re-authenticate." },
      { status: 401 }
    );
  }

  // Attach staff identity to request headers for downstream route handlers
  const response = NextResponse.next();
  response.headers.set("x-staff-handle", payload.sub);
  response.headers.set("x-staff-role", payload.role);
  return response;
}

export const config = {
  matcher: [
    "/api/staff/:path*",
    "/api/alerts/:path*",
    "/api/cases/:path*",
  ],
};
