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
const MSG_NOT_ALLOWED = "Deze wijziging is niet toegestaan.";
const MSG_TOO_LARGE = "Deze wijziging is te groot.";

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

// Write restrictions (on top of the endpoint allowlist): a session may only commit
// content and photo blobs, and only move the configured branch forward. Decap 3.17.3
// sends one flat tree with full paths plus base_tree per publish, and blobs separately,
// so the tree and ref bodies are small JSON documents.
const MAX_JSON_BODY = 1024 * 1024;
const SHA_RE = /^[0-9a-f]{40}$/;
const WRITABLE_PREFIXES = ["src/content/", "public/images/uploads/"];
// Written (non-delete) files must carry a data/photo extension: an .html or .svg in
// uploads would be served from the site's own origin, where Decap keeps the session token.
const WRITE_EXTENSIONS = [
  ["src/content/", /\.json$/],
  ["public/images/uploads/", /\.(?:jpe?g|png|webp|gif|avif)$/i],
];
const TREE_KEYS = new Set(["base_tree", "tree"]);
const ENTRY_KEYS = new Set(["path", "mode", "type", "sha"]);
const REF_KEYS = new Set(["sha", "force"]);

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const onlyKeys = (obj, allowed) => Object.keys(obj).every((k) => allowed.has(k));

function isWritablePath(path) {
  if (typeof path !== "string") return false;
  if (!WRITABLE_PREFIXES.some((p) => path.startsWith(p))) return false;
  // Control characters (NUL included) and backslashes never appear in content paths.
  if (/[\u0000-\u001f\u007f\\]/.test(path)) return false;
  // No empty, "." or ".." segments; the prefix check already rules out a leading "/".
  return path.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}

// Returns null when the POST git/trees body is allowed, otherwise a short reason code.
export function treeBodyProblem(body) {
  if (!isObject(body)) return "not_object";
  if (!onlyKeys(body, TREE_KEYS)) return "unknown_key";
  if (typeof body.base_tree !== "string" || !SHA_RE.test(body.base_tree)) return "bad_base_tree";
  if (!Array.isArray(body.tree) || body.tree.length === 0) return "bad_tree";
  for (const e of body.tree) {
    if (!isObject(e)) return "bad_entry";
    if (!onlyKeys(e, ENTRY_KEYS)) return "unknown_entry_key"; // also rejects inline `content`
    if (!isWritablePath(e.path)) return "bad_path";
    if (e.mode !== "100644") return "bad_mode";
    if (e.type !== "blob") return "bad_type";
    if (e.sha !== null && !(typeof e.sha === "string" && SHA_RE.test(e.sha))) return "bad_sha";
    if (e.sha !== null && !WRITE_EXTENSIONS.some(([pre, re]) => e.path.startsWith(pre) && re.test(e.path))) {
      return "bad_extension"; // deletes (sha null) may name any file inside the folders
    }
  }
  return null;
}

// Returns null when the PATCH git/refs body is allowed (fast-forward only).
export function refBodyProblem(body) {
  if (!isObject(body)) return "not_object";
  if (!onlyKeys(body, REF_KEYS)) return "unknown_key";
  if (typeof body.sha !== "string" || !SHA_RE.test(body.sha)) return "bad_sha";
  if (body.force !== undefined && body.force !== false) return "force";
  return null;
}

// Reads the request body as UTF-8 text, at most `max` bytes. null = too large.
async function readTextCapped(request, max) {
  const declared = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(all); // throws on invalid UTF-8
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
  // Live allowlist: removing an address from ALLOWED_EMAILS ends that session at once.
  if (!session || !parseList(env.ALLOWED_EMAILS).includes(session.email.trim().toLowerCase())) {
    return json({ message: MSG_SESSION }, 401, cors);
  }

  const method = request.method.toUpperCase();
  const lowerPath = path.toLowerCase();
  const base = `/repos/${repo.toLowerCase()}`;
  const isTrees = method === "POST" && lowerPath === `${base}/git/trees`;
  // isAllowedRequest already limits PATCH to <base>/git/refs/heads/<branch>.
  const isRef = method === "PATCH";

  // Validated, re-serialized JSON to forward instead of the raw stream (trees and ref updates only).
  let jsonText = null;
  if (isTrees || isRef) {
    const kind = isTrees ? "tree" : "ref";
    const deny = (reason) => {
      console.warn("cms-auth: write denied:", kind, reason); // never the body itself
      return json({ message: MSG_NOT_ALLOWED }, 403, cors);
    };

    if (isRef) {
      if (!env.GITHUB_BRANCH) {
        console.error("cms-auth: GITHUB_BRANCH is not set");
        return json({ message: MSG_CONFIG }, 500, cors);
      }
      // Decap may encode slashes in the branch (%2F); decode for the comparison only.
      // Branch names are case-sensitive, so compare exactly.
      let branch;
      try {
        branch = decodeURIComponent(path.slice(base.length + REF_HEADS.length));
      } catch {
        return deny("bad_branch_encoding");
      }
      if (branch !== env.GITHUB_BRANCH) return deny("other_branch");
    }

    let text;
    try {
      text = await readTextCapped(request, MAX_JSON_BODY);
    } catch {
      return deny("unreadable_body");
    }
    if (text === null) {
      console.warn("cms-auth: write denied:", kind, "too_large");
      return json({ message: MSG_TOO_LARGE }, 413, cors);
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return deny("bad_json");
    }
    const problem = isTrees ? treeBodyProblem(body) : refBodyProblem(body);
    if (problem) return deny(problem);
    // Forward what was validated, not the raw text: with duplicate keys JSON.parse keeps
    // the last value, and another parser upstream might keep the first.
    jsonText = JSON.stringify(body);
  }

  if (method === "GET" && lowerPath === "/user") {
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
    const init = { method, headers };
    if (jsonText !== null) {
      init.body = jsonText;
      headers.set("Content-Type", "application/json");
    } else if (method !== "GET" && method !== "HEAD" && request.body) {
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
  if (method === "GET" && lowerPath === base && upstream.status === 200) {
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
