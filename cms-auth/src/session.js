// Signed session tokens: base64url(JSON{email,exp}) + "." + base64url(HMAC-SHA256).

const enc = new TextEncoder();

function toBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// Strict decode; returns null on any malformed input.
function fromBase64Url(str) {
  if (typeof str !== "string" || !/^[A-Za-z0-9_-]+$/.test(str) || str.length % 4 === 1) return null;
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function importKey(secret, usages) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

export async function createSession(email, secret, nowSec, ttlSec = 28800) {
  const payload = toBase64Url(enc.encode(JSON.stringify({ email, exp: nowSec + ttlSec })));
  const key = await importKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(sig))}`;
}

// Returns {email} for a valid, unexpired token; null otherwise. Never throws.
export async function verifySession(token, secret, nowSec) {
  try {
    if (typeof token !== "string" || typeof secret !== "string" || !secret) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadPart, sigPart] = parts;
    const sig = fromBase64Url(sigPart);
    if (!sig) return null;

    const key = await importKey(secret, ["verify"]);
    // Constant-time signature check done by WebCrypto, not string comparison.
    const ok = await crypto.subtle.verify("HMAC", key, sig, enc.encode(payloadPart));
    if (!ok) return null;

    const bytes = fromBase64Url(payloadPart);
    if (!bytes) return null;
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data.email !== "string" || typeof data.exp !== "number") return null;
    if (!(nowSec < data.exp)) return null; // strict expiry (also rejects NaN)
    return { email: data.email };
  } catch {
    return null;
  }
}
