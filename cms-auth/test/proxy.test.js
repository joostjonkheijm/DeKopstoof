import { describe, it, expect, vi } from "vitest";
import { isAllowedPath, isAllowedRequest, handleProxy } from "../src/proxy.js";
import { createSession } from "../src/session.js";

const REPO = "joostjonkheijm/DeKopstoof";
const ORIGIN = "https://bnbdekopstoof.nl";
const NOW = 1_800_000_000;
const env = { ALLOWED_ORIGINS: ORIGIN, GITHUB_REPO: REPO, SESSION_SECRET: "s" };
const BASE = "https://cms.bnbdekopstoof.nl/github";

const validToken = () => createSession("owner@example.com", "s", NOW);

async function req(path, { method = "GET", origin = ORIGIN, token, headers = {}, body } = {}) {
  const h = new Headers(headers);
  if (origin) h.set("Origin", origin);
  if (token !== undefined) h.set("Authorization", `token ${token}`);
  const init = { method, headers: h };
  if (body !== undefined) {
    init.body = body;
    init.duplex = "half";
  }
  return new Request(`${BASE}${path}`, init);
}

function setup(upstream = () => new Response("{}", { status: 200 })) {
  const fetchFn = vi.fn(async (url, init) => upstream(url, init));
  const getToken = vi.fn(async () => "ghs_x");
  return { fetchFn, getToken, opts: { nowSec: NOW, fetchFn, getToken } };
}

describe("isAllowedPath", () => {
  it.each([
    "/repos/joostjonkheijm/DeKopstoof/../other/x",
    "/repos/joostjonkheijm/DeKopstoof/%2e%2e/x",
    "/repos/joostjonkheijm/DeKopstoof/%2E%2E/x",
    "/repos/joostjonkheijm/DeKopstoof%2Fx",
    "//repos/joostjonkheijm/DeKopstoof",
    "/repos/joostjonkheijm/DeKopstoof/%5c..",
    "/repos/joostjonkheijm/DeKopstoof/%5Cx",
    "/repos/joostjonkheijm/DeKopstoof//contents/a",
    "/repos/someone/else/contents/a",
    "/repos/joostjonkheijm/DeKopstoof-other/contents/a",
    "/orgs/x",
    "/user/repos",
    "/",
    "",
  ])("rejects %s", (p) => {
    expect(isAllowedPath(p, REPO)).toBe(false);
  });

  it.each([
    "/user",
    "/repos/joostjonkheijm/DeKopstoof",
    "/repos/JoostJonkheijm/dekopstoof/git/trees/master",
    "/repos/joostjonkheijm/DeKopstoof/git/trees/master:src%2Fcontent",
    "/repos/joostjonkheijm/DeKopstoof/branches/master%2Fx",
  ])("allows %s", (p) => {
    expect(isAllowedPath(p, REPO)).toBe(true);
  });

  it("rejects everything when the repo is not configured", () => {
    expect(isAllowedPath("/repos/undefined/x", undefined)).toBe(false);
    expect(isAllowedPath("/repos//x", "")).toBe(false);
  });
});

describe("isAllowedRequest", () => {
  const R = `/repos/${REPO}`;
  it.each([
    ["GET", "/user"],
    ["HEAD", "/user"],
    ["GET", R],
    ["HEAD", R],
    ["GET", `${R}/contents/src/content/home.md`],
    ["GET", `${R}/git/trees/master:src%2Fcontent`],
    ["get", "/repos/JoostJonkheijm/dekopstoof/branches/master"],
    ["POST", `${R}/git/blobs`],
    ["POST", `${R}/git/trees`],
    ["POST", `${R}/git/commits`],
    ["post", "/repos/JOOSTJONKHEIJM/DEKOPSTOOF/GIT/BLOBS"],
    ["PATCH", `${R}/git/refs/heads/master`],
    ["PATCH", `${R}/git/refs/heads/spike%2Fcms-content`],
    ["patch", "/repos/joostjonkheijm/dekopstoof/GIT/REFS/HEADS/x"],
  ])("allows %s %s", (method, path) => {
    expect(isAllowedRequest(method, path, REPO)).toBe(true);
  });

  it.each([
    ["POST", "/user"],
    ["PATCH", "/user"],
    ["PUT", `${R}/contents/a`],
    ["DELETE", `${R}/contents/a`],
    ["POST", `${R}/dispatches`],
    ["PATCH", R],
    ["POST", R],
    ["POST", `${R}/git/refs`],
    ["DELETE", `${R}/git/refs/heads/x`],
    ["PATCH", `${R}/git/refs/heads/`],
    ["PATCH", `${R}/git/refs/tags/v1`],
    ["POST", `${R}/git/blobs/x`],
    ["POST", `${R}/git/commitsx`],
    ["PUT", `${R}/git/refs/heads/x`],
    ["OPTIONS", `${R}/contents/a`],
    ["GET", "/orgs/x"],
    ["GET", `${R}/../other`],
    ["POST", "/repos/someone/else/git/blobs"],
    ["PATCH", "/repos/joostjonkheijm/DeKopstoof-other/git/refs/heads/x"],
  ])("denies %s %s", (method, path) => {
    expect(isAllowedRequest(method, path, REPO)).toBe(false);
  });

  it("denies everything when the method or repo is missing", () => {
    expect(isAllowedRequest(undefined, "/user", REPO)).toBe(false);
    expect(isAllowedRequest("GET", "/user", undefined)).toBe(false);
  });
});

describe("handleProxy", () => {
  it("rejects a disallowed method with 403 + CORS and never calls GitHub", async () => {
    const { fetchFn, getToken, opts } = setup();
    const token = await validToken();
    for (const [method, p] of [
      ["DELETE", `/repos/${REPO}/git/refs/heads/x`],
      ["PUT", `/repos/${REPO}/contents/a`],
      ["POST", `/repos/${REPO}/dispatches`],
      ["POST", "/user"],
    ]) {
      const res = await handleProxy(await req(p, { method, token }), env, opts);
      expect(res.status).toBe(403);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    }
    expect(fetchFn).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("appends Origin to the upstream Vary header instead of overwriting it", async () => {
    const token = await validToken();
    const run = async (vary) => {
      const headers = vary === null ? {} : { Vary: vary };
      const { opts } = setup(() => new Response("{}", { status: 200, headers }));
      const res = await handleProxy(await req(`/repos/${REPO}/contents/a`, { token }), env, opts);
      return res.headers.get("Vary");
    };
    expect(await run("Accept, Authorization, Cookie, X-GitHub-OTP")).toBe(
      "Accept, Authorization, Cookie, X-GitHub-OTP, Origin",
    );
    expect(await run("Accept-Encoding, origin")).toBe("Accept-Encoding, origin");
    expect(await run(null)).toBe("Origin");
    // The repo rewrite path keeps the merged Vary too.
    const { opts } = setup(
      () => new Response(JSON.stringify({ full_name: "x" }), { status: 200, headers: { Vary: "Accept" } }),
    );
    const res = await handleProxy(await req(`/repos/${REPO}`, { token }), env, opts);
    expect(res.headers.get("Vary")).toBe("Accept, Origin");
  });

  it("rejects a disallowed path with 403 + CORS and never calls GitHub", async () => {
    const { fetchFn, getToken, opts } = setup();
    for (const p of ["/repos/someone/else/contents/a", "/orgs/x", "/repos/joostjonkheijm/DeKopstoof%2Fx"]) {
      const res = await handleProxy(await req(p, { token: await validToken() }), env, opts);
      expect(res.status).toBe(403);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    }
    expect(fetchFn).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("returns 401 with a Dutch message and CORS for an expired session", async () => {
    const { fetchFn, opts } = setup();
    const expired = await createSession("owner@example.com", "s", NOW - 28800);
    const res = await handleProxy(await req(`/repos/${REPO}`, { token: expired }), env, opts);
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe("Sessie verlopen, log opnieuw in.");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns 401 for a missing or garbage session, and accepts the Bearer scheme", async () => {
    const { opts } = setup();
    expect((await handleProxy(await req("/user"), env, opts)).status).toBe(401);
    expect((await handleProxy(await req("/user", { token: "nope" }), env, opts)).status).toBe(401);
    const bearer = await req("/user", { headers: { Authorization: `Bearer ${await validToken()}` } });
    expect((await handleProxy(bearer, env, opts)).status).toBe(200);
  });

  it("rejects a foreign origin with 403 and no CORS headers", async () => {
    const { fetchFn, opts } = setup();
    const res = await handleProxy(await req("/user", { origin: "https://evil.nl", token: await validToken() }), env, opts);
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    const none = await handleProxy(await req("/user", { origin: null, token: await validToken() }), env, opts);
    expect(none.status).toBe(403);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("answers OPTIONS from the allowed origin with 204 + CORS", async () => {
    const { fetchFn, opts } = setup();
    const res = await handleProxy(await req(`/repos/${REPO}/contents/a`, { method: "OPTIONS" }), env, opts);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("PUT");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("answers GET /user from the session without calling GitHub", async () => {
    const { fetchFn, getToken, opts } = setup();
    const res = await handleProxy(await req("/user", { token: await validToken() }), env, opts);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(await res.json()).toEqual({
      login: "owner",
      name: "owner@example.com",
      email: "owner@example.com",
      avatar_url: null,
    });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("adds push permissions to GET /repos/<repo>", async () => {
    const { fetchFn, opts } = setup(
      () =>
        new Response(JSON.stringify({ full_name: "x" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ETag: '"abc"' },
        }),
    );
    const res = await handleProxy(await req(`/repos/${REPO}`, { token: await validToken() }), env, opts);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.full_name).toBe("x");
    expect(json.permissions).toEqual({ admin: false, push: true, pull: true });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(res.headers.get("ETag")).toBe('"abc"');
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("forwards to api.github.com with the installation token and only safe headers", async () => {
    const { fetchFn, getToken, opts } = setup(
      () =>
        new Response('{"ok":true}', {
          status: 200,
          headers: { "Content-Type": "application/json", "Set-Cookie": "gh=1", ETag: '"e"' },
        }),
    );
    const incoming = await req(`/repos/${REPO}/contents/a?ref=master`, {
      token: await validToken(),
      headers: {
        Cookie: "session=secret",
        Accept: "application/vnd.github.v3+json",
        "If-None-Match": '"old"',
        "X-Custom": "nope",
      },
    });
    const res = await handleProxy(incoming, env, opts);

    expect(getToken).toHaveBeenCalledWith(env, NOW);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`https://api.github.com/repos/${REPO}/contents/a?ref=master`);
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    const h = new Headers(init.headers);
    expect(h.get("Authorization")).toBe("Bearer ghs_x");
    expect(h.get("User-Agent")).toBe("dekopstoof-cms-auth");
    expect(h.get("Accept")).toBe("application/vnd.github.v3+json");
    expect(h.get("If-None-Match")).toBe('"old"');
    expect(h.get("Cookie")).toBeNull();
    expect(h.get("Origin")).toBeNull();
    expect(h.get("X-Custom")).toBeNull();

    expect(res.status).toBe(200);
    expect(res.headers.get("Set-Cookie")).toBeNull();
    expect(res.headers.get("ETag")).toBe('"e"');
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("streams a 10 MB POST body upstream and passes a 422 through with CORS", async () => {
    let received = -1;
    const { fetchFn, opts } = setup(async (_url, init) => {
      received = (await new Response(init.body).arrayBuffer()).byteLength;
      return new Response(JSON.stringify({ message: "conflict" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    });
    const big = new Uint8Array(10 * 1024 * 1024);
    const incoming = await req(`/repos/${REPO}/git/blobs`, {
      method: "POST",
      token: await validToken(),
      headers: { "Content-Type": "application/json" },
      body: big,
    });
    const res = await handleProxy(incoming, env, opts);

    const [, init] = fetchFn.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.duplex).toBe("half");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(received).toBe(big.byteLength);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ message: "conflict" });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });

  it("returns 502 with CORS when the installation token cannot be minted", async () => {
    const { fetchFn, opts } = setup();
    opts.getToken = vi.fn(async () => {
      throw new Error("GitHub installation token request failed: 401");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await handleProxy(await req(`/repos/${REPO}/contents/a`, { token: await validToken() }), env, opts);
      expect(res.status).toBe(502);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
      expect(await res.json()).toEqual({ message: "GitHub is tijdelijk niet bereikbaar. Probeer het later opnieuw." });
      expect(fetchFn).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalled();
      expect(log.mock.calls.flat().join(" ")).toContain("GitHub installation token request failed: 401");
    } finally {
      log.mockRestore();
    }
  });

  it("returns 502 with CORS when the upstream fetch itself fails", async () => {
    const { opts } = setup(() => {
      throw new TypeError("network down");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await handleProxy(await req(`/repos/${REPO}/contents/a`, { token: await validToken() }), env, opts);
      expect(res.status).toBe(502);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    } finally {
      log.mockRestore();
    }
  });

  it("returns 500 Configuratiefout and accepts no token when SESSION_SECRET is missing", async () => {
    const { fetchFn, opts } = setup();
    const token = await validToken();
    for (const secret of [undefined, ""]) {
      const res = await handleProxy(await req("/user", { token }), { ...env, SESSION_SECRET: secret }, opts);
      expect(res.status).toBe(500);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
      expect(await res.json()).toEqual({ message: "Configuratiefout." });
    }
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
