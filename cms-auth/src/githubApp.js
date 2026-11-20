// GitHub App auth: mint a short-lived app JWT, exchange it for an installation token.
// Workers-only APIs (crypto.subtle, fetch, atob/btoa); never log or throw the token or key.

const enc = new TextEncoder();

function b64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPkcs8(pem) {
  // Secrets are sometimes stored with literal backslash-n sequences instead of newlines.
  pem = pem.replace(/\\n/g, "\n");
  if (pem.includes("BEGIN RSA PRIVATE KEY")) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY must be PKCS#8 (BEGIN PRIVATE KEY); convert with openssl pkcs8 -topk8 -nocrypt",
    );
  }
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

export async function createAppJwt(appId, pkcs8Pem, nowSec) {
  const header = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = b64url(enc.encode(JSON.stringify({ iat: nowSec - 60, exp: nowSec + 540, iss: appId })));
  const key = await importPkcs8(pkcs8Pem);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64url(new Uint8Array(sig))}`;
}

// Module-scope cache: Worker isolates are reused across requests.
// Keyed by appId:installationId; an entry holds the (possibly still pending) token promise.
const cache = new Map(); // key -> { promise, refreshAtSec: number | null (null while pending) }

export function resetTokenCache() {
  cache.clear();
}

async function mint(env, nowSec, fetchFn) {
  const jwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY, nowSec);
  const res = await fetchFn(
    `https://api.github.com/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "dekopstoof-cms-auth",
      },
    },
  );
  if (!res.ok) throw new Error(`GitHub installation token request failed: ${res.status}`);
  const { token, expires_at } = await res.json();
  const expMs = Date.parse(expires_at);
  if (typeof token !== "string" || !token || Number.isNaN(expMs)) {
    throw new Error("GitHub installation token response malformed");
  }
  return { token, refreshAtSec: Math.floor(expMs / 1000) - 300 };
}

export async function getInstallationToken(env, nowSec, fetchFn = fetch) {
  const missing = ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY", "GITHUB_INSTALLATION_ID"].filter((k) => !env?.[k]);
  if (missing.length) throw new Error(`cms-auth: missing ${missing.join(" / ")}`);

  const key = `${env.GITHUB_APP_ID}:${env.GITHUB_INSTALLATION_ID}`;
  const hit = cache.get(key);
  if (hit && (hit.refreshAtSec === null || nowSec < hit.refreshAtSec)) return hit.promise;

  const entry = { promise: null, refreshAtSec: null };
  entry.promise = mint(env, nowSec, fetchFn).then(
    ({ token, refreshAtSec }) => {
      entry.refreshAtSec = refreshAtSec;
      return token;
    },
    (err) => {
      // Never keep a failed (or still-pending-then-failed) attempt cached.
      if (cache.get(key) === entry) cache.delete(key);
      throw err;
    },
  );
  cache.set(key, entry);
  return entry.promise;
}
