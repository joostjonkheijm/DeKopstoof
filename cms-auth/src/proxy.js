// GitHub REST proxy for Decap: checks the session token, swaps it for a GitHub App
// installation token and forwards only calls for this one repo.
import { verifySession } from "./session.js";
import { corsHeaders, parseList } from "./cors.js";
import { getInstallationToken } from "./githubApp.js";

const PREFIX = "/github";
const FORWARDED_HEADERS = ["Accept", "Content-Type", "If-None-Match"];
const MSG_SESSION = "Sessie verlopen, log opnieuw in.";
const MSG_UPSTREAM = "GitHub is tijdelijk niet bereikbaar. Probeer het later opnieuw.";
const MSG_CONFIG = "Configuratiefout.";
const MSG_FORBIDDEN = "Geen toegang.";

// `path` is the raw part after /github. Encoded slashes (%2F) are fine after the repo
// prefix, because the prefix check below needs a literal "/" right after the repo name.
export function isAllowedPath(path, repo) {
  if (typeof path !== "string" || typeof repo !== "string" || !repo) return false;
  const p = path.toLowerCase();
  if (p.includes("..") || p.includes("//") || p.includes("%2e") || p.includes("%5c")) return false;
  const base = `/repos/${repo.toLowerCase()}`;
  return p === "/user" || p === base || p.startsWith(`${base}/`);
}

// Method + endpoint allowlist on top of isAllowedPath: only the calls Decap makes
// (seen in the spike), so a leaked session cannot delete refs, dispatch workflows, etc.
const POST_ENDPOINTS = ["/git/blobs", "/git/trees", "/git/commits"];
const REF_HEADS = "/git/refs/heads/";

export function isAllowedRequest(method, path, repo) {
  if (typeof method !== "string" || !isAllowedPath(path, repo)) return false;
  const m = method.toUpperCase();
  const p = path.toLowerCase();
  const base = `/repos/${repo.toLowerCase()}`;
  if (m === "GET" || m === "HEAD") return true; // isAllowedPath already limits the paths
  if (!p.startsWith(`${base}/`)) return false;
  const rest = p.slice(base.length);
  if (m === "POST") return POST_ENDPOINTS.includes(rest);
  if (m === "PATCH") return rest.startsWith(REF_HEADS) && rest.length > REF_HEADS.length;
  return false;
}

// Merge Origin into an upstream Vary header instead of overwriting it.
function mergeVary(existing) {
  const parts = (existing || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.some((s) => s === "*" || s.toLowerCase() === "origin")) return parts.join(", ");
  return [...parts, "Origin"].join(", ");
}

function sessionToken(request) {
  const m = /^(?:token|bearer) +(\S+)$/i.exec(request.headers.get("Authorization") || "");
  return m ? m[1] : null;
}

const json = (body, status, headers) => Response.json(body, { status, headers });

export async function handleProxy(request, env, { nowSec, getToken = getInstallationToken, fetchFn = fetch } = {}) {
  const cors = corsHeaders(request.headers.get("Origin"), parseList(env.ALLOWED_ORIGINS));
  if (!cors) return new Response(MSG_FORBIDDEN, { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);
  // The router only sends /github and /github/* here; strip that mount prefix.
  const path = url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) : "";
  const repo = env.GITHUB_REPO;
  if (!isAllowedRequest(request.method, path, repo)) return json({ message: MSG_FORBIDDEN }, 403, cors);

  if (!env.SESSION_SECRET) {
    console.error("cms-auth: SESSION_SECRET is not set");
    return json({ message: MSG_CONFIG }, 500, cors);
  }
  const session = await verifySession(sessionToken(request), env.SESSION_SECRET, nowSec);
  if (!session) return json({ message: MSG_SESSION }, 401, cors);

  const lowerPath = path.toLowerCase();
  if (request.method === "GET" && lowerPath === "/user") {
    const { email } = session;
    return json({ login: email.split("@")[0], name: email, email, avatar_url: null }, 200, cors);
  }

  let upstream;
  try {
    const ghToken = await getToken(env, nowSec);
    const headers = new Headers({ Authorization: `Bearer ${ghToken}`, "User-Agent": "dekopstoof-cms-auth" });
    for (const h of FORWARDED_HEADERS) {
      const v = request.headers.get(h);
      if (v !== null) headers.set(h, v);
    }
    const init = { method: request.method, headers };
    if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
      init.body = request.body;
      init.duplex = "half";
    }
    upstream = await fetchFn(`https://api.github.com${path}${url.search}`, init);
  } catch (err) {
    console.error("cms-auth: upstream request failed:", err?.message);
    return json({ message: MSG_UPSTREAM }, 502, cors);
  }

  const out = new Headers(upstream.headers);
  out.delete("Set-Cookie");
  for (const [k, v] of Object.entries(cors)) out.set(k, k === "Vary" ? mergeVary(upstream.headers.get("Vary")) : v);

  // An installation token gets no `permissions` on the repo object; Decap needs push: true.
  if (request.method === "GET" && lowerPath === `/repos/${repo.toLowerCase()}` && upstream.status === 200) {
    let data;
    try {
      data = await upstream.json();
    } catch (err) {
      console.error("cms-auth: repo response is not JSON:", err?.message);
      return json({ message: MSG_UPSTREAM }, 502, cors);
    }
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      console.error("cms-auth: repo response is not a JSON object");
      return json({ message: MSG_UPSTREAM }, 502, cors);
    }
    data.permissions = { admin: false, push: true, pull: true };
    out.delete("Content-Length");
    out.delete("Content-Encoding");
    out.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(data), { status: 200, headers: out });
  }

  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}
