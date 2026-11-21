import { describe, it, expect, beforeAll } from "vitest";
import { verifyAccessJwt, checkAccessJwt } from "../src/access.js";
import { parseList } from "../src/cors.js";
import { makeKeyAndCerts, signJwt, b64u } from "./helpers/jwt.js";

const TEAM = "team.cloudflareaccess.com";
const enc = new TextEncoder();
const claims = { aud: ["AUD1"], iss: `https://${TEAM}`, exp: 2000, email: "Owner@Example.com" };
const allowedEmails = parseList(" owner@example.com ,joost@x.nl");

let k, other;
beforeAll(async () => {
  k = await makeKeyAndCerts("kid1");
  other = await makeKeyAndCerts("kid1");
});

const fetchOk = (certs) => async () => ({ ok: true, json: async () => certs });
const run = (jwt, over = {}) =>
  verifyAccessJwt(jwt, { teamDomain: TEAM, aud: "AUD1", allowedEmails, nowSec: 1000, fetchFn: fetchOk(k.certs), ...over });
const good = (payload = {}, header = {}) =>
  signJwt({ alg: "RS256", kid: "kid1", ...header }, { ...claims, ...payload }, k.privateKey);

describe("verifyAccessJwt", () => {
  it("accepts a valid token and normalizes the email", async () => {
    expect(await run(await good())).toEqual({ email: "owner@example.com" });
  });

  it("fetches the certs from the team domain", async () => {
    let url;
    const fetchFn = async (u) => ((url = u), { ok: true, json: async () => k.certs });
    await run(await good(), { fetchFn });
    expect(url).toBe(`https://${TEAM}/cdn-cgi/access/certs`);
  });

  it("matches emails case- and whitespace-insensitively in the allowlist", async () => {
    const list = parseList(" Owner@Example.com ,joost@x.nl");
    expect(await run(await good({ email: "owner@example.com" }), { allowedEmails: list })).toEqual({ email: "owner@example.com" });
  });

  it("never falls back to another key when kids are duplicated", async () => {
    const certs = { keys: [other.certs.keys[0], k.certs.keys[0]] };
    expect(await run(await good(), { fetchFn: fetchOk(certs) })).toBeNull();
  });

  it("rejects a matching kid with a non-RSA kty", async () => {
    const certs = { keys: [{ ...k.certs.keys[0], kty: "EC" }] };
    expect(await run(await good(), { fetchFn: fetchOk(certs) })).toBeNull();
  });

  it("rejects object aud claim and non-number nowSec", async () => {
    expect(await run(await good({ aud: {} }))).toBeNull();
    expect(await run(await good(), { nowSec: "1000" })).toBeNull();
  });

  it("does not fetch certs for tokens failing cheap claim checks", async () => {
    let calls = 0;
    const fetchFn = async () => (calls++, { ok: true, json: async () => k.certs });
    expect(await run(await good({ iss: "https://evil.example.com" }), { fetchFn })).toBeNull();
    expect(calls).toBe(0);
  });

  it("accepts aud as string or array", async () => {
    expect(await run(await good({ aud: "AUD1" }))).not.toBeNull();
    expect(await run(await good({ aud: ["X", "AUD1"] }))).not.toBeNull();
  });

  it("rejects expired, bad exp types, and not-yet-valid tokens", async () => {
    expect(await run(await good({ exp: 999 }))).toBeNull();
    expect(await run(await good({ exp: 1000 }))).toBeNull();
    expect(await run(await good({ exp: "2000" }))).toBeNull();
    expect(await run(await good({ exp: undefined }))).toBeNull();
    expect(await run(await good({ nbf: 1001 }))).toBeNull();
    expect(await run(await good({ nbf: "5" }))).toBeNull();
    expect(await run(await good({ nbf: 1000 }))).not.toBeNull();
  });

  it("rejects wrong aud, iss and missing aud", async () => {
    expect(await run(await good({ aud: ["OTHER"] }))).toBeNull();
    expect(await run(await good({ aud: undefined }))).toBeNull();
    expect(await run(await good({ iss: "https://evil.cloudflareaccess.com" }))).toBeNull();
    expect(await run(await good({ iss: TEAM }))).toBeNull();
  });

  it("rejects emails outside the allowlist or missing", async () => {
    expect(await run(await good({ email: "stranger@x.nl" }))).toBeNull();
    expect(await run(await good({ email: undefined }))).toBeNull();
    expect(await run(await good({ email: 5 }))).toBeNull();
    expect(await run(await good(), { allowedEmails: [] })).toBeNull();
  });

  it("rejects a token signed by another key", async () => {
    const jwt = await signJwt({ alg: "RS256", kid: "kid1" }, claims, other.privateKey);
    expect(await run(jwt)).toBeNull();
  });

  it("rejects tampered payloads", async () => {
    const [h, , s] = (await good()).split(".");
    const p = b64u(enc.encode(JSON.stringify({ ...claims, email: "joost@x.nl" })));
    expect(await run(`${h}.${p}.${s}`)).toBeNull();
  });

  it("rejects every alg other than RS256 and never falls back", async () => {
    const h = b64u(enc.encode(JSON.stringify({ alg: "none", kid: "kid1" })));
    const p = b64u(enc.encode(JSON.stringify(claims)));
    expect(await run(`${h}.${p}.`)).toBeNull();
    expect(await run(await good({}, { alg: "HS256" }))).toBeNull();
    expect(await run(await good({}, { alg: undefined }))).toBeNull();
    expect(await run(await good({}, { alg: "rs256" }))).toBeNull();
  });

  it("requires a kid that exists in the certs", async () => {
    expect(await run(await good({}, { kid: "nope" }))).toBeNull();
    expect(await run(await good({}, { kid: undefined }))).toBeNull();
  });

  it("returns null for garbage input and fetch failures", async () => {
    for (const bad of [null, undefined, "", "garbage", "a.b", "a.b.c.d", "!!.!!.!!", 42]) expect(await run(bad)).toBeNull();
    const jwt = await good();
    expect(await run(jwt, { fetchFn: async () => { throw new Error("net"); } })).toBeNull();
    expect(await run(jwt, { fetchFn: async () => ({ ok: false, json: async () => k.certs }) })).toBeNull();
    expect(await run(jwt, { fetchFn: async () => ({ ok: true, json: async () => ({}) }) })).toBeNull();
    expect(await run(jwt, { fetchFn: async () => ({ ok: true, json: async () => { throw new Error("x"); } }) })).toBeNull();
    expect(await run(jwt, { teamDomain: "" })).toBeNull();
    expect(await run(jwt, { aud: undefined })).toBeNull();
  });
});

describe("checkAccessJwt reason codes", () => {
  const check = (jwt, over = {}) =>
    checkAccessJwt(jwt, { teamDomain: TEAM, aud: "AUD1", allowedEmails, nowSec: 1000, fetchFn: fetchOk(k.certs), ...over });
  const unsignedHeader = (header) => `${b64u(enc.encode(JSON.stringify(header)))}.${b64u(enc.encode(JSON.stringify(claims)))}.`;
  const fail = (fn) => async () => { throw new Error(fn); };

  it("returns the email for a valid token", async () => {
    expect(await check(await good())).toEqual({ email: "owner@example.com" });
  });

  it.each([
    ["no_jwt", "null", () => null],
    ["no_jwt", "undefined", () => undefined],
    ["no_jwt", "empty string", () => ""],
    ["no_jwt", "a number", () => 42],
    ["bad_jwt", "one part", () => "garbage"],
    ["bad_jwt", "two parts", () => "a.b"],
    ["bad_jwt", "four parts", () => "a.b.c.d"],
    ["bad_jwt", "non-base64url parts", () => "!!.!!.!!"],
    ["bad_jwt", "a missing kid", () => good({}, { kid: undefined })],
    ["bad_jwt", "a missing email", () => good({ email: undefined })],
    ["bad_jwt", "a numeric email", () => good({ email: 5 })],
    ["bad_alg", "alg none", () => unsignedHeader({ alg: "none", kid: "kid1" })],
    ["bad_alg", "alg HS256", () => good({}, { alg: "HS256" })],
    ["bad_alg", "alg rs256", () => good({}, { alg: "rs256" })],
    ["bad_alg", "no alg", () => good({}, { alg: undefined })],
    ["bad_iss", "a foreign issuer", () => good({ iss: "https://evil.cloudflareaccess.com" })],
    ["bad_iss", "an issuer without scheme", () => good({ iss: TEAM })],
    ["bad_aud", "a wrong aud", () => good({ aud: ["OTHER"] })],
    ["bad_aud", "a missing aud", () => good({ aud: undefined })],
    ["bad_aud", "an object aud", () => good({ aud: {} })],
    ["expired", "exp in the past", () => good({ exp: 999 })],
    ["expired", "exp equal to now", () => good({ exp: 1000 })],
    ["expired", "a string exp", () => good({ exp: "2000" })],
    ["expired", "no exp", () => good({ exp: undefined })],
    ["expired", "nbf in the future", () => good({ nbf: 1001 })],
    ["expired", "a string nbf", () => good({ nbf: "5" })],
    ["email_not_allowed", "a stranger", () => good({ email: "stranger@x.nl" })],
    ["unknown_kid", "a kid not in the certs", () => good({}, { kid: "nope" })],
    ["bad_sig", "another signing key", () => signJwt({ alg: "RS256", kid: "kid1" }, claims, other.privateKey)],
    [
      "bad_sig",
      "a tampered payload",
      async () => {
        const [h, , s] = (await good()).split(".");
        return `${h}.${b64u(enc.encode(JSON.stringify({ ...claims, email: "joost@x.nl" })))}.${s}`;
      },
    ],
  ])("returns %s for %s", async (reason, _name, makeJwt) => {
    expect(await check(await makeJwt())).toEqual({ reason });
  });

  it.each([
    ["unknown_kid", "a non-RSA key with the kid", () => ({ fetchFn: fetchOk({ keys: [{ ...k.certs.keys[0], kty: "EC" }] }) })],
    ["email_not_allowed", "an empty allowlist", { allowedEmails: [] }],
    ["certs_fetch_failed", "a network error", { fetchFn: fail("net") }],
    ["certs_fetch_failed", "a non-ok response", () => ({ fetchFn: async () => ({ ok: false, json: async () => k.certs }) })],
    ["certs_fetch_failed", "a certs document without keys", { fetchFn: fetchOk({}) }],
    ["certs_fetch_failed", "a non-JSON certs response", { fetchFn: async () => ({ ok: true, json: fail("x") }) }],
    ["config", "an empty team domain", { teamDomain: "" }],
    ["config", "a missing aud", { aud: undefined }],
    ["config", "a string nowSec", { nowSec: "1000" }],
    ["config", "a non-array allowlist", { allowedEmails: "owner@example.com" }],
  ])("returns %s for %s", async (reason, _name, over) => {
    // Some options reference the keys, which only exist after beforeAll.
    expect(await check(await good(), typeof over === "function" ? over() : over)).toEqual({ reason });
  });

  it("never throws, whatever the options", async () => {
    await expect(checkAccessJwt(await good())).resolves.toEqual({ reason: "config" });
    await expect(checkAccessJwt(await good(), null)).resolves.toEqual({ reason: "config" });
  });
});
