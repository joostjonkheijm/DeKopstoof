import { describe, it, expect, vi } from "vitest";
import vm from "node:vm";
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

// Collect console.warn / console.error lines while running fn.
async function withLogs(fn) {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const result = await fn();
    const line = (c) => c.join(" ");
    return { result, warns: warn.mock.calls.map(line), errors: error.mock.calls.map(line) };
  } finally {
    warn.mockRestore();
    error.mockRestore();
  }
}

describe("handleAuth", () => {
  it.each(["no_jwt", "bad_jwt", "bad_alg", "unknown_kid", "bad_sig", "bad_iss", "bad_aud", "expired", "email_not_allowed", "certs_fetch_failed"])(
    "returns 403 Geen toegang and logs the reason code %s",
    async (reason) => {
      const checkAccess = vi.fn(async () => ({ reason }));
      const { result: res, warns } = await withLogs(() =>
        handleAuth(authReq("secret.jwt.token"), env, { nowSec: NOW, checkAccess }),
      );
      expect(res.status).toBe(403);
      expect(res.headers.get("Content-Type")).toMatch(/^text\/plain/);
      expect(await res.text()).toBe("Geen toegang.");
      expect(warns).toEqual([`cms-auth: access denied: ${reason}`]);
      expect(warns.join(" ")).not.toContain("secret.jwt.token");
    },
  );

  it("passes the JWT and Access config to checkAccess", async () => {
    const checkAccess = vi.fn(async () => ({ reason: "bad_sig" }));
    await withLogs(() => handleAuth(authReq("a.b.c"), env, { nowSec: NOW, checkAccess }));
    expect(checkAccess).toHaveBeenCalledWith("a.b.c", {
      teamDomain: "team.cloudflareaccess.com",
      aud: "aud123",
      allowedEmails: ["owner@example.com", "other@example.com"],
      nowSec: NOW,
    });
  });

  it("returns the handshake page with a valid session token and logs nothing", async () => {
    const checkAccess = vi.fn(async () => ({ email: "owner@example.com" }));
    const { result: res, warns, errors } = await withLogs(() => handleAuth(authReq(), env, { nowSec: NOW, checkAccess }));
    expect(warns).toEqual([]);
    expect(errors).toEqual([]);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/^text\/html/);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Content-Security-Policy")).toBe("frame-ancestors 'none'");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
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
    const checkAccess = vi.fn(async () => ({ email: "owner@example.com" }));
    for (const secret of [undefined, ""]) {
      const { result: res } = await withLogs(() =>
        handleAuth(authReq(), { ...env, SESSION_SECRET: secret }, { nowSec: NOW, checkAccess }),
      );
      expect(res.status).toBe(500);
      expect(res.headers.get("Content-Type")).toMatch(/^text\/plain/);
      expect(await res.text()).toBe("Configuratiefout.");
    }
  });

  it.each([
    ["ACCESS_AUD", undefined],
    ["ACCESS_AUD", ""],
    ["ACCESS_TEAM_DOMAIN", undefined],
    ["ACCESS_TEAM_DOMAIN", ""],
  ])("returns 500 Configuratiefout (not 403) when %s is %j", async (name, value) => {
    const checkAccess = vi.fn(async () => ({ email: "owner@example.com" }));
    const { result: res, errors } = await withLogs(() =>
      handleAuth(authReq(), { ...env, [name]: value }, { nowSec: NOW, checkAccess }),
    );
    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Configuratiefout.");
    expect(checkAccess).not.toHaveBeenCalled();
    expect(errors.join(" ")).toContain(name);
  });

  it("returns 500 Configuratiefout when the checker reports a config problem", async () => {
    const checkAccess = vi.fn(async () => ({ reason: "config" }));
    const { result: res } = await withLogs(() => handleAuth(authReq(), env, { nowSec: NOW, checkAccess }));
    expect(res.status).toBe(500);
  });

  it("logs bad_jwt for a garbage token with the real checker, without the token", async () => {
    const { result: res, warns } = await withLogs(() => handleAuth(authReq("not-a-jwt-xyz"), env, { nowSec: NOW }));
    expect(res.status).toBe(403);
    expect(warns).toEqual(["cms-auth: access denied: bad_jwt"]);
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

// Run the page's inline script against a minimal fake window/document.
function runPage(html, opener) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const listeners = [];
  const status = { textContent: "Bezig met inloggen…" };
  const window = { opener, addEventListener: (type, fn) => type === "message" && listeners.push(fn) };
  const document = { getElementById: (id) => (id === "status" ? status : null) };
  vm.runInNewContext(script, { window, document, JSON });
  return { status, dispatch: (e) => listeners.forEach((fn) => fn(e)), window };
}

describe("auth page script", () => {
  const html = renderAuthPage("tok", ["https://bnbdekopstoof.nl"]);

  it("shows a Dutch hint and does not throw when there is no opener", () => {
    const page = runPage(html, null);
    expect(page.status.textContent).toBe("Open het beheerscherm en log daar opnieuw in.");
  });

  it("runs the Decap handshake and answers only allowed origins", () => {
    const opener = { postMessage: vi.fn() };
    const page = runPage(html, opener);
    expect(page.status.textContent).toBe("Bezig met inloggen…");
    expect(opener.postMessage).toHaveBeenCalledWith("authorizing:github", "*");

    page.dispatch({ origin: "https://evil.nl" });
    expect(opener.postMessage).toHaveBeenCalledTimes(1);

    page.dispatch({ origin: "https://bnbdekopstoof.nl" });
    expect(opener.postMessage).toHaveBeenLastCalledWith(
      'authorization:github:success:{"token":"tok","provider":"github"}',
      "https://bnbdekopstoof.nl",
    );

    page.window.opener = null; // opener closed meanwhile: no throw
    expect(() => page.dispatch({ origin: "https://bnbdekopstoof.nl" })).not.toThrow();
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

  it("routes GET /auth to handleAuth (no Access JWT gets 403, logged as no_jwt)", async () => {
    const { result: res, warns } = await withLogs(() => worker.fetch(new Request("https://cms.bnbdekopstoof.nl/auth"), env));
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Geen toegang.");
    expect(warns).toEqual(["cms-auth: access denied: no_jwt"]);
  });
});
