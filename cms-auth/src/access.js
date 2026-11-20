// Verifies the Cloudflare Access JWT (Cf-Access-Jwt-Assertion) as defense in depth.
// Fails closed: every problem yields null and nothing here throws.

const B64URL = /^[A-Za-z0-9_-]*$/;

function b64uToBytes(s) {
  if (typeof s !== "string" || !B64URL.test(s) || s.length % 4 === 1) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function parseJsonPart(s) {
  const bytes = b64uToBytes(s);
  if (!bytes) return null;
  try {
    const v = JSON.parse(new TextDecoder().decode(bytes));
    return v !== null && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

export async function verifyAccessJwt(jwt, { teamDomain, aud, allowedEmails, nowSec, fetchFn = fetch } = {}) {
  try {
    if (typeof jwt !== "string" || typeof teamDomain !== "string" || !teamDomain) return null;
    if (typeof aud !== "string" || !aud) return null;
    if (!Array.isArray(allowedEmails) || !isNum(nowSec)) return null;

    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;

    const header = parseJsonPart(h);
    if (!header || header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) return null;
    const payload = parseJsonPart(p);
    if (!payload) return null;
    const sig = b64uToBytes(s);
    if (!sig || sig.length === 0) return null;

    // Cheap claim checks first, so junk tokens cost no subrequest. The
    // signature check below is still mandatory before anything is trusted.
    if (payload.iss !== `https://${teamDomain}`) return null;
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return null;
    if (!isNum(payload.exp) || !(payload.exp > nowSec)) return null;
    if (payload.nbf !== undefined && (!isNum(payload.nbf) || payload.nbf > nowSec)) return null;
    if (typeof payload.email !== "string") return null;
    const email = payload.email.trim().toLowerCase();
    if (!email || !allowedEmails.some((a) => typeof a === "string" && a.trim().toLowerCase() === email)) return null;

    const res = await fetchFn(`https://${teamDomain}/cdn-cgi/access/certs`);
    if (!res || !res.ok) return null;
    const certs = await res.json();
    if (!certs || !Array.isArray(certs.keys)) return null;
    // Select strictly by kid; never try other keys.
    const jwk = certs.keys.find((k) => k && k.kid === header.kid && k.kty === "RSA");
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, new TextEncoder().encode(`${h}.${p}`));
    if (valid !== true) return null;
    return { email };
  } catch {
    return null;
  }
}
