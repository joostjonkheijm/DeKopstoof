import { describe, it, expect } from "vitest";
import { createSession, verifySession } from "../src/session.js";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const b64u = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

// Sign an arbitrary payload string, producing a token with a valid signature.
async function signRaw(payloadJson, secret = "s3cret") {
  const enc = new TextEncoder();
  const part = b64u(enc.encode(payloadJson));
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(part));
  return `${part}.${b64u(new Uint8Array(sig))}`;
}

describe("session tokens", () => {
  it("accepts valid, rejects expired/wrong secret/tampered/malformed", async () => {
    const t = await createSession("owner@example.com", "s3cret", 1000);
    expect(await verifySession(t, "s3cret", 1000 + 28799)).toEqual({ email: "owner@example.com" });
    expect(await verifySession(t, "s3cret", 1000 + 28800)).toBeNull();
    expect(await verifySession(t, "other", 1000)).toBeNull();
    const [p, s] = t.split(".");
    const forged = btoa(JSON.stringify({ email: "evil@x.nl", exp: 9e9 })).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    expect(await verifySession(`${forged}.${s}`, "s3cret", 1000)).toBeNull();
    for (const bad of ["", "abc", "a.b.c", "!!!.???", `${p}.`]) expect(await verifySession(bad, "s3cret", 1000)).toBeNull();
  });

  it("returns null for validly signed but malformed payloads", async () => {
    const good = JSON.stringify({ email: "a@b.nl", exp: 5000 });
    expect(await verifySession(await signRaw(good), "s3cret", 1000)).toEqual({ email: "a@b.nl" });
    for (const payload of [
      JSON.stringify({ email: "a@b.nl", exp: "5000" }),
      JSON.stringify({ exp: 5000 }),
      JSON.stringify([{ email: "a@b.nl", exp: 5000 }]),
      "not json",
    ]) {
      expect(await verifySession(await signRaw(payload), "s3cret", 1000)).toBeNull();
    }
  });

  it("rejects a non-canonical signature spelling", async () => {
    const t = await createSession("owner@example.com", "s3cret", 1000);
    const last = t.slice(-1);
    const idx = B64.indexOf(last);
    const alt = t.slice(0, -1) + B64[idx ^ 1]; // differs only in unused trailing bits
    expect(alt).not.toBe(t);
    expect(await verifySession(alt, "s3cret", 1000)).toBeNull();
  });

  it("rejects an empty secret", async () => {
    // WebCrypto refuses a zero-length HMAC key, so a token cannot be signed with "" anyway.
    const t = await signRaw(JSON.stringify({ email: "a@b.nl", exp: 5000 }));
    expect(await verifySession(t, "", 1000)).toBeNull();
    await expect(createSession("a@b.nl", "", 1000)).rejects.toThrow();
  });

  it("createSession rejects bad inputs", async () => {
    await expect(createSession("a@b.nl", "s3cret", Date.now())).rejects.toThrow();
    await expect(createSession("a@b.nl", "s3cret", 0)).rejects.toThrow();
    await expect(createSession("a@b.nl", "s3cret", 1000, 0)).rejects.toThrow();
    await expect(createSession("a@b.nl", "s3cret", 1000, 28801)).rejects.toThrow();
    await expect(createSession("a@b.nl", "s3cret", 1.5)).rejects.toThrow();
  });

  it("returns null for non-string input", async () => {
    expect(await verifySession(undefined, "s3cret", 1000)).toBeNull();
    expect(await verifySession(null, "s3cret", 1000)).toBeNull();
  });
});
