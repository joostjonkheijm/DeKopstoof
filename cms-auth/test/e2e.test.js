// End-to-end through the worker's default fetch (index.js): real routing, real URL parsing,
// global fetch mocked, installation-token minting mocked.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/githubApp.js", () => ({ getInstallationToken: vi.fn(async () => "ghs_x") }));

import worker from "../src/index.js";
import { createSession } from "../src/session.js";

const ORIGIN = "https://bnbdekopstoof.nl";
const HOST = "https://cms.bnbdekopstoof.nl";
const env = {
  ALLOWED_ORIGINS: ORIGIN,
  GITHUB_REPO: "joostjonkheijm/DeKopstoof",
  SESSION_SECRET: "s",
  ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
  ACCESS_AUD: "aud123",
  ALLOWED_EMAILS: "owner@example.com",
  GITHUB_BRANCH: "master",
};

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn(async () => new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const session = () => createSession("owner@example.com", "s", Math.floor(Date.now() / 1000));

async function call(path, { method = "GET", token, headers = {} } = {}) {
  const h = new Headers({ Origin: ORIGIN, ...headers });
  if (token) h.set("Authorization", `token ${token}`);
  return worker.fetch(new Request(`${HOST}${path}`, { method, headers: h }), env);
}

describe("cms-auth end to end", () => {
  it("blocks ../ traversal to another repo with 403 and never calls GitHub", async () => {
    const res = await call("/github/repos/joostjonkheijm/DeKopstoof/../../someone/else/contents/a", {
      token: await session(),
    });
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never serves a token for /github/%2e%2e/auth without an Access JWT", async () => {
    const res = await call("/github/%2e%2e/auth");
    expect([403, 404]).toContain(res.status);
    expect(res.status).not.toBe(200);
    if (res.status === 403) expect(await res.text()).toMatch(/Geen toegang\./);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["/github", "/github/"])("answers %s with 403 + CORS", async (p) => {
    const res = await call(p, { token: await session() });
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards HEAD without a body", async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 200 }));
    const res = await call("/github/repos/joostjonkheijm/DeKopstoof/contents/a", {
      method: "HEAD",
      token: await session(),
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/joostjonkheijm/DeKopstoof/contents/a");
    expect(init.method).toBe("HEAD");
    expect(init.body).toBeUndefined();
    expect(init.duplex).toBeUndefined();
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer ghs_x");
  });

  it("denies a DELETE on a branch ref end to end", async () => {
    const res = await call("/github/repos/joostjonkheijm/DeKopstoof/git/refs/heads/master", {
      method: "DELETE",
      token: await session(),
    });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
