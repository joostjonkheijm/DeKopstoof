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
});
