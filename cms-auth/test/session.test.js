import { describe, it, expect } from "vitest";
import { createSession, verifySession } from "../src/session.js";

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

  it("returns null for non-string input", async () => {
    expect(await verifySession(undefined, "s3cret", 1000)).toBeNull();
    expect(await verifySession(null, "s3cret", 1000)).toBeNull();
  });
});
