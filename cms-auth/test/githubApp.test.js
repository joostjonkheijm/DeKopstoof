import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createAppJwt, getInstallationToken, resetTokenCache } from "../src/githubApp.js";

let pem, publicKey;
beforeAll(async () => {
  const kp = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  publicKey = kp.publicKey;
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  const b64 = btoa(String.fromCharCode(...der)).match(/.{1,64}/g).join("\r\n");
  pem = `  -----BEGIN PRIVATE KEY-----\r\n${b64}\r\n-----END PRIVATE KEY-----\r\n `;
});

const fromB64u = (s) => {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b + "=".repeat((4 - (b.length % 4)) % 4)), (c) => c.charCodeAt(0));
};

describe("createAppJwt", () => {
  it("signs RS256 with the expected header and claims", async () => {
    const jwt = await createAppJwt("123", pem, 1000);
    const [h, p, s] = jwt.split(".");
    const dec = new TextDecoder();
    expect(JSON.parse(dec.decode(fromB64u(h)))).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(dec.decode(fromB64u(p)))).toEqual({ iat: 940, exp: 1540, iss: "123" });
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      fromB64u(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    expect(ok).toBe(true);
  });
});

describe("getInstallationToken", () => {
  const env = () => ({ GITHUB_APP_ID: "123", GITHUB_APP_PRIVATE_KEY: pem, GITHUB_INSTALLATION_ID: "42" });
  let calls, status;
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ token: "ghs_a", expires_at: new Date(4600_000).toISOString() }),
    };
  };
  beforeEach(() => {
    resetTokenCache();
    calls = [];
    status = 201;
  });

  it("caches until expires_at minus 300 s", async () => {
    expect(await getInstallationToken(env(), 1000, fetchFn)).toBe("ghs_a");
    expect(await getInstallationToken(env(), 4000, fetchFn)).toBe("ghs_a");
    expect(calls).toHaveLength(1);
    expect(await getInstallationToken(env(), 4301, fetchFn)).toBe("ghs_a");
    expect(calls).toHaveLength(2);
  });

  it("posts to the installation endpoint with the right headers", async () => {
    await getInstallationToken(env(), 1000, fetchFn);
    expect(calls[0].url).toBe("https://api.github.com/app/installations/42/access_tokens");
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.headers.Authorization).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
    expect(calls[0].init.headers.Accept).toBe("application/vnd.github+json");
    expect(calls[0].init.headers["User-Agent"]).toBe("dekopstoof-cms-auth");
  });

  it("rejects on non-2xx without caching the failure", async () => {
    status = 401;
    await expect(getInstallationToken(env(), 1000, fetchFn)).rejects.toThrow(/401/);
    status = 201;
    expect(await getInstallationToken(env(), 1001, fetchFn)).toBe("ghs_a");
    expect(calls).toHaveLength(2);
  });

  it("has an exact cache boundary at expires_at - 300 s", async () => {
    await getInstallationToken(env(), 1000, fetchFn);
    await getInstallationToken(env(), 4299, fetchFn);
    expect(calls).toHaveLength(1);
    await getInstallationToken(env(), 4300, fetchFn);
    expect(calls).toHaveLength(2);
  });

  it("keeps separate cache entries per installation", async () => {
    await getInstallationToken(env(), 1000, fetchFn);
    await getInstallationToken({ ...env(), GITHUB_INSTALLATION_ID: "43" }, 1000, fetchFn);
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toContain("/installations/43/");
  });

  it("accepts literal backslash-n sequences in the PEM", async () => {
    const lit = pem.trim().replace(/\r?\n/g, "\\n");
    expect(lit).not.toContain("\n");
    expect(await getInstallationToken({ ...env(), GITHUB_APP_PRIVATE_KEY: lit }, 1000, fetchFn)).toBe("ghs_a");
  });

  it("rejects a PKCS#1 key with a clear message", async () => {
    const rsa = "-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----";
    await expect(getInstallationToken({ ...env(), GITHUB_APP_PRIVATE_KEY: rsa }, 1000, fetchFn)).rejects.toThrow(
      "GITHUB_APP_PRIVATE_KEY must be PKCS#8 (BEGIN PRIVATE KEY); convert with openssl pkcs8 -topk8 -nocrypt",
    );
    expect(calls).toHaveLength(0);
  });

  it("dedupes concurrent cold calls", async () => {
    const [a, b] = await Promise.all([
      getInstallationToken(env(), 1000, fetchFn),
      getInstallationToken(env(), 1000, fetchFn),
    ]);
    expect([a, b]).toEqual(["ghs_a", "ghs_a"]);
    expect(calls).toHaveLength(1);
  });

  it("does not keep a rejected promise cached", async () => {
    status = 500;
    await expect(getInstallationToken(env(), 1000, fetchFn)).rejects.toThrow(/500/);
    status = 201;
    expect(await getInstallationToken(env(), 1000, fetchFn)).toBe("ghs_a");
    expect(calls).toHaveLength(2);
  });

  it("names only the missing config values, before any fetch", async () => {
    await expect(
      getInstallationToken({ GITHUB_APP_ID: "123", GITHUB_APP_PRIVATE_KEY: "", GITHUB_INSTALLATION_ID: undefined }, 1000, fetchFn),
    ).rejects.toThrow("cms-auth: missing GITHUB_APP_PRIVATE_KEY / GITHUB_INSTALLATION_ID");
    expect(calls).toHaveLength(0);
  });

  it("never leaks the key or token in error messages", async () => {
    status = 401;
    const err = await getInstallationToken(env(), 1000, fetchFn).catch((e) => e);
    const body = pem.replace(/-----[^-]+-----|\s/g, "");
    expect(err.message).not.toContain(body.slice(0, 40));
    expect(err.message).not.toContain("ghs_a");
    const bad = await getInstallationToken({ ...env(), GITHUB_APP_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nZZZsecretZZZ\n-----END PRIVATE KEY-----" }, 1000, fetchFn).catch((e) => e);
    expect(bad.message).not.toContain("ZZZsecretZZZ");
  });
});
