import { describe, it, expect, vi } from "vitest";
import { handleAuth, renderAuthPage } from "../src/authPage.js";
import { verifySession } from "../src/session.js";
import worker from "../src/index.js";

const NOW = 1_800_000_000;
const env = {
  ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
  ACCESS_AUD: "aud123",
  ALLOWED_EMAILS: " Owner@Example.com ,other@example.com",
  ALLOWED_ORIGINS: "https://bnbdekopstoof.nl",
  GITHUB_REPO: "joostjonkheijm/DeKopstoof",
  SESSION_SECRET: "s",
};

const authReq = (jwt = "jwt.value.here") =>
  new Request("https://cms.bnbdekopstoof.nl/auth", { headers: { "Cf-Access-Jwt-Assertion": jwt } });

// Pull the JSON string literal that holds the token out of the page.
function tokenFromHtml(html) {
  const m = html.match(/const token = (".*?");/);
  return m ? JSON.parse(m[1]) : null;
}

describe("handleAuth", () => {
  it("returns 403 Geen toegang when Access verification fails", async () => {
    const verifyAccess = vi.fn(async () => null);
    const res = await handleAuth(authReq(), env, { nowSec: NOW, verifyAccess });
    expect(res.status).toBe(403);
    expect(res.headers.get("Content-Type")).toMatch(/^text\/plain/);
    expect(await res.text()).toBe("Geen toegang.");
  });

  it("passes the JWT and Access config to verifyAccess", async () => {
    const verifyAccess = vi.fn(async () => null);
    await handleAuth(authReq("a.b.c"), env, { nowSec: NOW, verifyAccess });
    expect(verifyAccess).toHaveBeenCalledWith("a.b.c", {
      teamDomain: "team.cloudflareaccess.com",
      aud: "aud123",
      allowedEmails: ["owner@example.com", "other@example.com"],
      nowSec: NOW,
    });
  });

  it("returns the handshake page with a valid session token", async () => {
    const verifyAccess = vi.fn(async () => ({ email: "owner@example.com" }));
    const res = await handleAuth(authReq(), env, { nowSec: NOW, verifyAccess });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/^text\/html/);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const html = await res.text();
    expect(html).toContain("authorizing:github");
    expect(html).toContain("authorization:github:success:");
    expect(html).toContain("Bezig met inloggen…");
    expect(html).toContain('["https://bnbdekopstoof.nl"]');
    const token = tokenFromHtml(html);
    expect(await verifySession(token, "s", NOW + 1)).toEqual({ email: "owner@example.com" });
    expect(await verifySession(token, "s", NOW + 28800)).toBeNull();
  });

  it("returns 500 Configuratiefout and mints nothing when SESSION_SECRET is missing", async () => {
    const verifyAccess = vi.fn(async () => ({ email: "owner@example.com" }));
    for (const secret of [undefined, ""]) {
      const res = await handleAuth(authReq(), { ...env, SESSION_SECRET: secret }, { nowSec: NOW, verifyAccess });
      expect(res.status).toBe(500);
      expect(res.headers.get("Content-Type")).toMatch(/^text\/plain/);
      const body = await res.text();
      expect(body).toBe("Configuratiefout.");
    }
  });
});

describe("renderAuthPage", () => {
  it("escapes < so the token cannot break out of the script", () => {
    const html = renderAuthPage("</script><x>", ["https://bnbdekopstoof.nl"]);
    expect(html).not.toContain("</script><x>");
    expect(tokenFromHtml(html)).toBe("</script><x>");
  });

  it("escapes < in the allowed origins too", () => {
    const html = renderAuthPage("t", ["https://a.nl</script><x>"]);
    expect(html).not.toContain("</script><x>");
  });

  it("only answers allowed origins and uses the Decap handshake", () => {
    const html = renderAuthPage("tok", ["https://bnbdekopstoof.nl"]);
    expect(html).toContain("if (!allowed.includes(e.origin)) return;");
    expect(html).toContain("window.opener.postMessage(msg, e.origin);");
    expect(html).toContain('window.opener.postMessage("authorizing:github", "*");');
  });
});

describe("worker router", () => {
  it("returns 404 for unknown paths", async () => {
    for (const p of ["/nope", "/", "/githubx", "/auth/x"]) {
      const res = await worker.fetch(new Request(`https://cms.bnbdekopstoof.nl${p}`), env);
      expect(res.status).toBe(404);
    }
  });

  it("routes /github/* to the proxy (foreign origin gets 403)", async () => {
    const res = await worker.fetch(
      new Request("https://cms.bnbdekopstoof.nl/github/user", { headers: { Origin: "https://evil.nl" } }),
      env,
    );
    expect(res.status).toBe(403);
  });

  it("routes /github/user to the proxy (no session gets 401 + CORS)", async () => {
    const res = await worker.fetch(
      new Request("https://cms.bnbdekopstoof.nl/github/user", { headers: { Origin: "https://bnbdekopstoof.nl" } }),
      env,
    );
    expect(res.status).toBe(401);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://bnbdekopstoof.nl");
  });

  it("routes GET /auth to handleAuth (no Access JWT gets 403)", async () => {
    const res = await worker.fetch(new Request("https://cms.bnbdekopstoof.nl/auth"), env);
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Geen toegang.");
  });
});
