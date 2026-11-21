// Verifies the Cloudflare Access JWT (Cf-Access-Jwt-Assertion) as defense in depth.
// Fails closed and never throws: checkAccessJwt returns {email} or {reason} (a short
// code for logs, never the token), verifyAccessJwt returns {email} or null.

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

const deny = (reason) => ({ reason });

// Reason codes: config, no_jwt, bad_jwt, bad_alg, unknown_kid, bad_sig, bad_iss, bad_aud,
// expired, email_not_allowed, certs_fetch_failed.
export async function checkAccessJwt(jwt, opts) {
  try {
    const { teamDomain, aud, allowedEmails, nowSec, fetchFn = fetch } = opts ?? {};
    if (typeof teamDomain !== "string" || !teamDomain) return deny("config");
    if (typeof aud !== "string" || !aud) return deny("config");
    if (!Array.isArray(allowedEmails) || !isNum(nowSec)) return deny("config");

    if (typeof jwt !== "string" || !jwt) return deny("no_jwt");
    const parts = jwt.split(".");
    if (parts.length !== 3) return deny("bad_jwt");
    const [h, p, s] = parts;

    const header = parseJsonPart(h);
    if (!header) return deny("bad_jwt");
    if (header.alg !== "RS256") return deny("bad_alg");
    if (typeof header.kid !== "string" || !header.kid) return deny("bad_jwt");
    const payload = parseJsonPart(p);
    if (!payload) return deny("bad_jwt");
    const sig = b64uToBytes(s);
    if (!sig || sig.length === 0) return deny("bad_jwt");

    // Cheap claim checks first, so junk tokens cost no subrequest. The
    // signature check below is still mandatory before anything is trusted.
    if (payload.iss !== `https://${teamDomain}`) return deny("bad_iss");
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return deny("bad_aud");
    if (!isNum(payload.exp) || !(payload.exp > nowSec)) return deny("expired");
    if (payload.nbf !== undefined && (!isNum(payload.nbf) || payload.nbf > nowSec)) return deny("expired");
    if (typeof payload.email !== "string" || !payload.email.trim()) return deny("bad_jwt");
    const email = payload.email.trim().toLowerCase();
    if (!allowedEmails.some((a) => typeof a === "string" && a.trim().toLowerCase() === email)) {
      return deny("email_not_allowed");
    }

    let certs;
    try {
      const res = await fetchFn(`https://${teamDomain}/cdn-cgi/access/certs`);
      if (!res || !res.ok) return deny("certs_fetch_failed");
      certs = await res.json();
    } catch {
      return deny("certs_fetch_failed");
    }
    if (!certs || !Array.isArray(certs.keys)) return deny("certs_fetch_failed");
    // Select strictly by kid; never try other keys.
    const jwk = certs.keys.find((k) => k && k.kid === header.kid && k.kty === "RSA");
    if (!jwk) return deny("unknown_kid");

    let valid = false;
    try {
      const key = await crypto.subtle.importKey(
        "jwk",
        { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
      );
      valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, new TextEncoder().encode(`${h}.${p}`));
    } catch {
      return deny("bad_sig");
    }
    if (valid !== true) return deny("bad_sig");
    return { email };
  } catch {
    return deny("bad_jwt");
  }
}

export async function verifyAccessJwt(jwt, opts = {}) {
  const result = await checkAccessJwt(jwt, opts);
  return typeof result?.email === "string" ? { email: result.email } : null;
}
