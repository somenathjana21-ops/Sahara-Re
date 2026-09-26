import crypto from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.STAFF_PASSCODE || "";

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against self to consume constant time, then return false
    const buf = Buffer.from(a);
    crypto.timingSafeEqual(buf, buf);
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Generate an HMAC-signed session token that can be verified by middleware.
 */
export function generateSessionToken(staffHandle: string, role: string): string {
  const payload = JSON.stringify({
    sub: staffHandle,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 hour expiry
  });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * Verify an HMAC-signed session token. Returns the parsed payload or null.
 */
export function verifySessionToken(
  token: string
): { sub: string; role: string; iat: number; exp: number } | null {
  if (!SESSION_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;
  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (!timingSafeEqual(signature, expectedSig)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Constant-time passcode comparison.
 */
export function verifyPasscode(provided: string): boolean {
  const expected = process.env.STAFF_PASSCODE;
  if (!expected) return false;
  return timingSafeEqual(String(provided), expected);
}
