import { describe, it, expect, vi } from "vitest";
import { isAllowedPath, isAllowedRequest, handleProxy } from "../src/proxy.js";
import { createSession } from "../src/session.js";

const REPO = "joostjonkheijm/DeKopstoof";
const ORIGIN = "https://bnbdekopstoof.nl";
const NOW = 1_800_000_000;
const env = {
  ALLOWED_ORIGINS: ORIGIN,
  GITHUB_REPO: REPO,
  GITHUB_BRANCH: "master",
  SESSION_SECRET: "s",
  ALLOWED_EMAILS: "Owner@Example.com, other@example.com",
};
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
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, HEAD, POST, PATCH, OPTIONS");
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

// Ruling 11: a session may only commit content and photos to the configured branch.
describe("handleProxy write restrictions", () => {
  const SHA = "a".repeat(40);
  const SHA2 = "b".repeat(40);
  const TREES = `/repos/${REPO}/git/trees`;
  const REF = (branch) => `/repos/${REPO}/git/refs/heads/${branch}`;
  const entry = (over = {}) => ({ path: "src/content/home.json", mode: "100644", type: "blob", sha: SHA2, ...over });
  const tree = (over = {}) => ({ base_tree: SHA, tree: [entry()], ...over });
  const NOT_ALLOWED = { message: "Deze wijziging is niet toegestaan." };

  async function send(path, body, { method = "POST", envOver = {}, token } = {}) {
    const { fetchFn, getToken, opts } = setup(() => new Response('{"sha":"c"}', { status: 201 }));
    const text = typeof body === "string" ? body : JSON.stringify(body);
    const incoming = await req(path, {
      method,
      token: token ?? (await validToken()),
      headers: { "Content-Type": "text/plain" },
      body: text,
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const res = await handleProxy(incoming, { ...env, ...envOver }, opts);
      return { res, fetchFn, getToken, text, warnings: warn.mock.calls.map((c) => c.join(" ")) };
    } finally {
      warn.mockRestore();
    }
  }

  it.each([
    ["a content file update", tree()],
    ["a photo upload", tree({ tree: [entry({ path: "public/images/uploads/kamer-1.jpg" })] })],
    ["a delete (sha null)", tree({ tree: [entry({ path: "public/images/uploads/oud.jpg", sha: null })] })],
    [
      "an upload plus a content change",
      tree({ tree: [entry({ path: "public/images/uploads/a.jpg" }), entry({ path: "src/content/kamers.json" })] }),
    ],
  ])("forwards %s as validated JSON", async (_name, body) => {
    const { res, fetchFn, text } = await send(TREES, body);
    expect(res.status).toBe(201);
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`https://api.github.com${TREES}`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(text);
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it.each([
    ["path public/admin/index.html", tree({ tree: [entry({ path: "public/admin/index.html" })] })],
    ["path functions/api/x.js", tree({ tree: [entry({ path: "functions/api/x.js" })] })],
    ["path src/contentx/a.json", tree({ tree: [entry({ path: "src/contentx/a.json" })] })],
    ["path src/content/../functions/x.js", tree({ tree: [entry({ path: "src/content/../functions/x.js" })] })],
    ["path with a leading slash", tree({ tree: [entry({ path: "/src/content/a.json" })] })],
    ["path with a backslash", tree({ tree: [entry({ path: "src/content\\a.json" })] })],
    ["path with a NUL", tree({ tree: [entry({ path: "src/content/a\u0000.json" })] })],
    ["path that is only the prefix", tree({ tree: [entry({ path: "src/content/" })] })],
    ["path with an empty segment", tree({ tree: [entry({ path: "src/content//a.json" })] })],
    ["path with a . segment", tree({ tree: [entry({ path: "src/content/./a.json" })] })],
    ["path in other case", tree({ tree: [entry({ path: "SRC/content/a.json" })] })],
    ["non-string path", tree({ tree: [entry({ path: 5 })] })],
    ["one bad entry among good ones", tree({ tree: [entry(), entry({ path: "public/admin/config.yml" })] })],
    ["mode 100755", tree({ tree: [entry({ mode: "100755" })] })],
    ["mode 120000 (symlink)", tree({ tree: [entry({ mode: "120000" })] })],
    ["mode 040000", tree({ tree: [entry({ mode: "040000" })] })],
    ["numeric mode", tree({ tree: [entry({ mode: 100644 })] })],
    ["type tree", tree({ tree: [entry({ type: "tree" })] })],
    ["type commit", tree({ tree: [entry({ type: "commit" })] })],
    ["a content key", tree({ tree: [entry({ content: "<script>" })] })],
    ["a content key without sha", tree({ tree: [{ path: "src/content/a.json", mode: "100644", type: "blob", content: "x" }] })],
    ["a missing sha", tree({ tree: [{ path: "src/content/a.json", mode: "100644", type: "blob" }] })],
    ["a non-hex sha", tree({ tree: [entry({ sha: "z".repeat(40) })] })],
    ["a short sha", tree({ tree: [entry({ sha: "abc" })] })],
    ["an unknown entry key", tree({ tree: [entry({ url: "x" })] })],
    ["a missing base_tree", { tree: [entry()] }],
    ["a null base_tree", tree({ base_tree: null })],
    ["a non-hex base_tree", tree({ base_tree: "master" })],
    ["an unknown top-level key", tree({ extra: 1 })],
    ["an empty tree", tree({ tree: [] })],
    ["a non-array tree", tree({ tree: { path: "src/content/a.json" } })],
    ["a null entry", tree({ tree: [null] })],
    ["a JSON array body", [entry()]],
    ["a JSON null body", "null"],
    ["invalid JSON", '{"base_tree":'],
    ["an empty body", ""],
  ])("denies a tree with %s (403 + CORS, logged, GitHub never called)", async (_name, body) => {
    const { res, fetchFn, getToken, warnings } = await send(TREES, body);
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(await res.json()).toEqual(NOT_ALLOWED);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^cms-auth: write denied:/);
    expect(warnings[0]).not.toContain("<script>");
  });

  it("applies the tree checks to any spelling of the endpoint", async () => {
    const path = `/repos/JOOSTJONKHEIJM/dekopstoof/GIT/TREES`;
    const { res, fetchFn } = await send(path, tree({ tree: [entry({ path: "functions/api/x.js" })] }));
    expect(res.status).toBe(403);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("rejects a tree body over 1 MB with 413 + CORS", async () => {
    const body = JSON.stringify(tree({ tree: [entry({ path: `src/content/${"a".repeat(1024 * 1024)}.json` })] }));
    expect(body.length).toBeGreaterThan(1024 * 1024);
    const { res, fetchFn, warnings } = await send(TREES, body);
    expect(res.status).toBe(413);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect((await res.json()).message).toMatch(/te groot/);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(warnings.join(" ")).toContain("too_large");
  });

  it("accepts a tree body of exactly 1 MB", async () => {
    const base = JSON.stringify(tree({ tree: [entry({ path: "src/content/x.json" })] }));
    const body = base.slice(0, -1) + " ".repeat(1024 * 1024 - base.length) + "}";
    expect(body.length).toBe(1024 * 1024);
    const { res, fetchFn } = await send(TREES, body);
    expect(res.status).toBe(201);
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it.each([
    ["sha + force false", { sha: SHA, force: false }],
    ["sha without force", { sha: SHA }],
  ])("forwards a PATCH of the configured branch with %s", async (_name, body) => {
    const { res, fetchFn, text } = await send(REF("master"), body, { method: "PATCH" });
    expect(res.status).toBe(201);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`https://api.github.com${REF("master")}`);
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(text);
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("decodes an encoded branch name for the comparison only", async () => {
    const path = REF("feature%2Fcms");
    const { res, fetchFn } = await send(path, { sha: SHA }, { method: "PATCH", envOver: { GITHUB_BRANCH: "feature/cms" } });
    expect(res.status).toBe(201);
    expect(fetchFn.mock.calls[0][0]).toBe(`https://api.github.com${path}`);
  });

  it.each([
    ["another branch", REF("main"), { sha: SHA }],
    ["the branch in other case", REF("Master"), { sha: SHA }],
    ["an encoded other branch", REF("spike%2Fcms-content"), { sha: SHA }],
    ["a branch with a suffix", REF("master%2Fx"), { sha: SHA }],
    ["broken percent-encoding", REF("master%E0%A4%A"), { sha: SHA }],
    ["force true", REF("master"), { sha: SHA, force: true }],
    ["force as a string", REF("master"), { sha: SHA, force: "false" }],
    ["a missing sha", REF("master"), { force: false }],
    ["a non-hex sha", REF("master"), { sha: "master" }],
    ["an unknown key", REF("master"), { sha: SHA, ref: "refs/heads/x" }],
    ["invalid JSON", REF("master"), "{"],
    ["a JSON array body", REF("master"), [SHA]],
  ])("denies a PATCH with %s (403 + CORS)", async (_name, path, body) => {
    const { res, fetchFn, warnings } = await send(path, body, { method: "PATCH" });
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(await res.json()).toEqual(NOT_ALLOWED);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(warnings[0]).toMatch(/^cms-auth: write denied:/);
  });

  it("applies the branch check to any spelling of the endpoint", async () => {
    const path = `/repos/${REPO}/GIT/REFS/HEADS/main`;
    const { res, fetchFn } = await send(path, { sha: SHA }, { method: "PATCH" });
    expect(res.status).toBe(403);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns 500 Configuratiefout for a PATCH when GITHUB_BRANCH is missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const branch of [undefined, ""]) {
        const { res, fetchFn } = await send(REF("master"), { sha: SHA }, {
          method: "PATCH",
          envOver: { GITHUB_BRANCH: branch },
        });
        expect(res.status).toBe(500);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
        expect(await res.json()).toEqual({ message: "Configuratiefout." });
        expect(fetchFn).not.toHaveBeenCalled();
      }
    } finally {
      log.mockRestore();
    }
  });

  // Ruling 16: written files must have a content/photo extension; deletes may name anything.
  it.each([
    "public/images/uploads/x.html",
    "public/images/uploads/x.htm",
    "public/images/uploads/x.svg",
    "public/images/uploads/x.js",
    "public/images/uploads/noext",
    "public/images/uploads/x.jpg.html",
    "public/images/uploads/x.json",
    "src/content/a.js",
    "src/content/a.html",
    "src/content/a.json.js",
  ])("denies a write of %s", async (path) => {
    const { res, fetchFn, warnings } = await send(TREES, tree({ tree: [entry({ path })] }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(NOT_ALLOWED);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(warnings[0]).toContain("bad_extension");
  });

  it.each([
    "public/images/uploads/IMG_1234.JPG",
    "public/images/uploads/a.jpeg",
    "public/images/uploads/a.png",
    "public/images/uploads/a.webp",
    "public/images/uploads/a.gif",
    "public/images/uploads/a.avif",
    "src/content/home.json",
  ])("allows a write of %s", async (path) => {
    const { res, fetchFn } = await send(TREES, tree({ tree: [entry({ path })] }));
    expect(res.status).toBe(201);
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it.each(["public/images/uploads/old.svg", "public/images/uploads/noext", "src/content/old.js"])(
    "allows a delete (sha null) of %s",
    async (path) => {
      const { res, fetchFn } = await send(TREES, tree({ tree: [entry({ path, sha: null })] }));
      expect(res.status).toBe(201);
      expect(fetchFn).toHaveBeenCalledOnce();
    },
  );

  it("forwards the re-serialized tree body, so a duplicate key reaches GitHub once", async () => {
    // A parser that kept the first "path" would see the .html file; JSON.parse keeps the last.
    const raw = `{"base_tree":"${SHA}","tree":[{"path":"public/admin/index.html","path":"src/content/a.json","mode":"100644","type":"blob","sha":"${SHA2}"}]}`;
    const { res, fetchFn } = await send(TREES, raw);
    expect(res.status).toBe(201);
    const forwarded = fetchFn.mock.calls[0][1].body;
    expect(forwarded).toBe(JSON.stringify(JSON.parse(raw)));
    expect(forwarded.match(/"path"/g)).toHaveLength(1);
    expect(forwarded).not.toContain("public/admin");
  });

  it("forwards the re-serialized ref body, so a duplicate key reaches GitHub once", async () => {
    const raw = `{"sha":"${SHA}","force":true,"force":false}`;
    const { res, fetchFn } = await send(REF("master"), raw, { method: "PATCH" });
    expect(res.status).toBe(201);
    const forwarded = fetchFn.mock.calls[0][1].body;
    expect(forwarded).toBe(`{"sha":"${SHA}","force":false}`);
  });

  it("checks the session before looking at the body", async () => {
    const { res } = await send(TREES, "{", { token: "nope" });
    expect(res.status).toBe(401);
  });
});

describe("handleProxy live email allowlist", () => {
  it.each([
    ["a removed address", { ALLOWED_EMAILS: "other@example.com" }],
    ["an empty list", { ALLOWED_EMAILS: "" }],
    ["a missing list", { ALLOWED_EMAILS: undefined }],
  ])("rejects a valid session for %s with 401 + CORS", async (_name, over) => {
    const { fetchFn, getToken, opts } = setup();
    const token = await validToken();
    for (const path of ["/user", `/repos/${REPO}/contents/a`]) {
      const res = await handleProxy(await req(path, { token }), { ...env, ...over }, opts);
      expect(res.status).toBe(401);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
      expect(await res.json()).toEqual({ message: "Sessie verlopen, log opnieuw in." });
    }
    expect(fetchFn).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("matches the session email case-insensitively", async () => {
    const { opts } = setup();
    const token = await createSession("OTHER@example.com", "s", NOW);
    const res = await handleProxy(await req("/user", { token }), env, opts);
    expect(res.status).toBe(200);
  });
});
