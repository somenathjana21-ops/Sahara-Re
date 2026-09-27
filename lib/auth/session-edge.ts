/**
 * Edge-compatible session token verification using Web Crypto API.
 * Used by middleware.ts (which runs in Edge runtime where node:crypto is unavailable).
 */

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.STAFF_PASSCODE || "";
}

async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64urlDecode(str: string): Uint8Array {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binaryStr = atob(padded);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Verify an HMAC-signed session token (edge-compatible).
 * Returns the parsed payload or null on failure.
 */
export async function verifySessionTokenEdge(
  token: string
): Promise<{ sub: string; role: string; iat: number; exp: number } | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const key = await getKey(secret);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadB64);
    const sigBuffer = base64urlDecode(signature);

    // Use Web Crypto verify for constant-time comparison
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer as unknown as BufferSource,
      data
    );
    if (!isValid) return null;

    const payloadStr = new TextDecoder().decode(base64urlDecode(payloadB64));
    const payload = JSON.parse(payloadStr);

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
