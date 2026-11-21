# Verhuizing naar Cloudflare Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move De Kopstoof from Netlify to Cloudflare Pages on bnbdekopstoof.nl, with Decap CMS login through a Cloudflare Access–protected Worker that proxies GitHub.

**Architecture:** The static Vite build and two Pages Functions (`/api/*`) run on Cloudflare Pages. Photos are resized through `/cdn-cgi/image`. A separate Worker `cms-auth` on `cms.bnbdekopstoof.nl` issues short-lived signed session tokens after Access email-code login (`/auth`) and proxies Decap's GitHub REST calls (`/github/*`), swapping the session token for a GitHub App installation token that is scoped to this one repo.

**Tech Stack:** React 19 / Vite 8, Cloudflare Pages Functions (ESM, Workers runtime), Cloudflare Workers + Wrangler, Cloudflare Access (One-time PIN), GitHub App, WebCrypto (HMAC-SHA256, RS256), Vitest 4, Decap CMS 3.17.3.

**Spec:** `docs/superpowers/specs/2026-11-20-cloudflare-migration-design.md`

## Global Constraints

- Work on branch `feat/cloudflare`, cut from `master`. Merge only at cutover (Task 10).
- Repo `joostjonkheijm/DeKopstoof`, branch `master`. Production origin: `https://bnbdekopstoof.nl`. Worker host: `https://cms.bnbdekopstoof.nl`.
- No secrets in the repo. Secrets live in Pages env vars or Worker secrets.
- Server code is ESM, has no Node-only APIs and uses no `nodejs_compat`: plain `fetch` and `crypto.subtle` only.
- Session token TTL: 8 hours = `28800` seconds.
- Image CDN: quality `75`, widths `[480, 800, 1200, 1600, 2000]`, fallback `1200` (unchanged).
- Decap stays pinned at `decap-cms@3.17.3`. Keep `local_backend: true` and the existing `commit_messages`.
- Every message the owner or a guest can see is in Dutch. Logs and code comments are in English.
- Shared server code lives in `server/`, outside `functions/`, so Pages does not route it.
- Node 24 locally (`node -v` → v24.x). Tests run with `npm test` from the repo root.

## Review Focus

1. **Path tricks on `/github/*`:** `..`, `%2e%2e`, `//`, `%5c`, `%2F` before the repo prefix, and other repos (`/repos/someone/else`) must give 403, never a proxied request. `%2F` *after* the repo prefix is legitimate (see Task 1 result). → Task 7 tests.
2. **Session expires mid-edit:** an expired token gives 401 *with* CORS headers. Without them the browser shows an opaque CORS error and Decap cannot send the owner back to login. → Task 7 test.
3. **Email casing and whitespace:** `ALLOWED_EMAILS=" Owner@Example.com ,joost@x.nl"` must match `owner@example.com` from Access. → Task 5 test.
4. **Tampered or garbage session tokens:** a changed payload with the old signature, no dot, empty string or bad base64 → `null`, never an exception. → Task 4 tests.
5. **GitHub errors and large bodies pass through:** a 422/409 from GitHub reaches Decap with its status and body plus CORS, and request bodies are streamed unchanged (10 MB photo uploads). → Task 7 tests.

---

### Task 1: Spike — Decap through an `api_root` proxy (throwaway)

Proves the one unproven assumption before anything else is built. **Do not merge this code.** It lives on branch `spike/cms-proxy` only.

**Files (spike branch only):**
- Create: `spike/worker.js`, `spike/wrangler.toml`
- Modify: `public/admin/config.yml` (backend block, spike branch only)

- [ ] **Step 1: Create branch** `git switch -c spike/cms-proxy master`.
- [ ] **Step 2: Write `spike/worker.js`**: about 60 lines, no tests. `GET /auth` returns the auth handshake page (same protocol as Task 7, Step 5) with the fixed token `"spike"`. `/github/*` forwards to `https://api.github.com/*` with `Authorization: Bearer ${env.GITHUB_PAT}` when the incoming header is `token spike` or `Bearer spike`. CORS allows `env.ALLOWED_ORIGIN`. The response to `GET /repos/joostjonkheijm/DeKopstoof` gets `permissions: {admin:false, push:true, pull:true}` added. `GET /user` returns `{login:"spike", name:"Spike", email:"spike@example.com"}`.
- [ ] **Step 3: Joost creates a fine-grained PAT** (repo DeKopstoof only, Contents read/write, 7-day expiry), then runs `npx wrangler deploy` in `spike/` and `npx wrangler secret put GITHUB_PAT`. In the dashboard, turn on Access for the `workers.dev` route (Workers → cms-spike → Settings → Domains & Routes → workers.dev → Enable Cloudflare Access).
- [ ] **Step 4: Point the spike config at a test branch.** Set `backend: {name: github, repo: joostjonkheijm/DeKopstoof, branch: spike/cms-content, base_url: <workers.dev url>, auth_endpoint: auth, api_root: <workers.dev url>/github}`. Create `spike/cms-content` from master and push it. Run `npm run dev`, set `ALLOWED_ORIGIN=http://localhost:5173`, open `/admin/`.
- [ ] **Step 5: Verify, with DevTools Network open.** Each item passes or fails:
  - login popup → Access code → CMS loads collections;
  - edit a text field → Publish → a commit appears on `spike/cms-content`;
  - upload a photo of ~10 MB → commit appears; delete it → commit appears;
  - **no** request goes to `api.github.com` directly (filter the Network tab on `github.com`);
  - write down every distinct path pattern Decap calls under `/github/` (for the Task 7 allowlist).
- [ ] **Step 6: Gate.** Write the results in `docs/superpowers/specs/2026-11-20-cloudflare-migration-design.md` under a new heading `## Proefresultaat` (that file is on master; commit it there). If any check failed, **stop**: report to Joost. The fallback is DecapBridge, which needs a new plan. Then delete the spike Worker, revoke the PAT and delete both spike branches (local and remote).

---

### Task 2: Pages Functions replace Netlify Functions

**Files:**
- Create: `server/parseIcal.js` (moved from `netlify/functions/utils/parseIcal.js`, converted to ESM `export function parseIcal`)
- Create: `server/parseIcal.test.js` (moved, import path unchanged in shape: `./parseIcal.js`)
- Create: `server/inquiry.js`, `server/inquiry.test.js`
- Create: `server/resend.js`, `server/resend.test.js`
- Create: `functions/api/availability.js`, `functions/api/send-inquiry.js`
- Create: `functions/api/handlers.test.js`
- Delete: `netlify/functions/` (whole folder)
- Modify: `vite.config.js` (test include), `package.json` (remove `resend`)

**Interfaces:**
- Produces:
  - `parseIcal(text: string) => Array<{start: string, end: string}>` (unchanged behavior)
  - `overlaps(checkIn: string, checkOut: string, ranges: Array<{start,end}>) => boolean`
  - `validateInquiry(body: unknown) => {ok: true, data: {name,email,checkIn,checkOut,phone,message}} | {ok: false, status: 400, error: string}`. Error strings copied verbatim from the current function: `"Ongeldige aanvraag"`, `"Verplichte velden ontbreken"`, `"Ongeldig e-mailadres"`, `"Check-out moet na check-in zijn"`.
  - `buildInquiryEmail(data) => {subject: string, html: string}`. Subject and HTML copied verbatim from `netlify/functions/send-inquiry.js` lines 88–113, including `esc()`.
  - `sendEmail(apiKey: string, payload: {from,to,reply_to,subject,html}, fetchFn = fetch) => Promise<void>`. Does `POST https://api.resend.com/emails` with `Authorization: Bearer <apiKey>` and a JSON body, and throws `Error` on a non-2xx response.
  - `onRequestGet({env})` in `availability.js`, `onRequestPost({request, env})` in `send-inquiry.js`. Status codes, JSON bodies and `Cache-Control: public, max-age=3600` are the same as now.

- [ ] **Step 1: Create the branch** `git switch -c feat/cloudflare master`.
- [ ] **Step 2: Move the parser.** `git mv netlify/functions/utils/parseIcal.js server/parseIcal.js` (likewise the test), convert to ESM, set vitest `include: ["server/**/*.test.js", "functions/**/*.test.js", "cms-auth/**/*.test.js", "src/**/*.test.js"]`.
- [ ] **Step 3: Run** `npm test`. Expected: the existing parseIcal tests PASS.
- [ ] **Step 4: Write failing tests** in `server/inquiry.test.js`:

```js
it("rejects missing fields", () =>
  expect(validateInquiry({ name: "A" })).toEqual({ ok: false, status: 400, error: "Verplichte velden ontbreken" }));
it("rejects bad email", () =>
  expect(validateInquiry({ name: "A", email: "x", checkIn: "2026-12-01", checkOut: "2026-12-03" }).error).toBe("Ongeldig e-mailadres"));
it("rejects checkOut <= checkIn", () =>
  expect(validateInquiry({ name: "A", email: "a@b.nl", checkIn: "2026-12-03", checkOut: "2026-12-03" }).error).toBe("Check-out moet na check-in zijn"));
it("rejects non-object body", () => expect(validateInquiry(null).error).toBe("Ongeldige aanvraag"));
it("defaults phone and message to empty strings", () =>
  expect(validateInquiry({ name: "A", email: "a@b.nl", checkIn: "2026-12-01", checkOut: "2026-12-03" }).data).toMatchObject({ phone: "", message: "" }));
it("overlaps is half-open", () => {
  expect(overlaps("2026-07-14", "2026-07-16", [{ start: "2026-07-10", end: "2026-07-14" }])).toBe(false);
  expect(overlaps("2026-07-13", "2026-07-16", [{ start: "2026-07-10", end: "2026-07-14" }])).toBe(true);
});
it("email escapes html and pluralises nights", () => {
  const { subject, html } = buildInquiryEmail({ name: "<b>", email: "a@b.nl", checkIn: "2026-12-01", checkOut: "2026-12-02", phone: "", message: "" });
  expect(html).toContain("&lt;b&gt;");
  expect(subject).toBe("Boekingsaanvraag: 2026-12-01 – 2026-12-02 (1 nacht)");
});
```

  and in `server/resend.test.js`: the fetch mock gets the URL `https://api.resend.com/emails`, method `POST`, header `Authorization: Bearer re_test`, and a body with `reply_to`. A 422 response makes it reject.
- [ ] **Step 5: Run** `npm test`. Expected: FAIL (modules missing).
- [ ] **Step 6: Implement** `server/inquiry.js` and `server/resend.js` to the interfaces above.
- [ ] **Step 7: Run** `npm test`. Expected: PASS.
- [ ] **Step 8: Write failing handler tests** in `functions/api/handlers.test.js`, with `vi.stubGlobal("fetch", …)`:
  - availability: no `BOOKING_ICAL_URL` → 500; iCal 200 → 200, `{bookedRanges:[…]}`, `Cache-Control: public, max-age=3600`; iCal 503 → 502.
  - send-inquiry: invalid JSON → 400 `"Ongeldige aanvraag"`; dates overlap the iCal → 409 with the current message; **iCal fetch throws → email is still sent, 200 `{success:true}`**; Resend 500 → 500 with `"E-mail verzenden mislukt. Probeer het opnieuw of neem direct contact op."`.
- [ ] **Step 9: Implement** both handlers as thin wrappers over `server/*`. `from: "De Kopstoof <noreply@bnbdekopstoof.nl>"` and `to: "info@bnbdekopstoof.nl"` stay unchanged.
- [ ] **Step 10: Run** `npm test`. Expected: all PASS. Then `git rm -r netlify/functions`, `npm uninstall resend`, `npm test` again → PASS.
- [ ] **Step 11: Local smoke test.** Run `npm run build && npx wrangler pages dev dist --binding BOOKING_ICAL_URL=<value from .env>`, then `curl -s localhost:8788/api/availability` → JSON with `bookedRanges`. Also check `curl -sI localhost:8788/kamers` → 200 (SPA fallback) and `curl -sI localhost:8788/admin/` → 200.
- [ ] **Step 12: Commit**

```bash
git add -A server functions vite.config.js package.json package-lock.json
git commit -m "feat: port booking functions to Cloudflare Pages Functions"
```

---

### Task 3: Image URLs via Cloudflare Image Transformations

**Files:**
- Modify: `src/lib/image.js` (header comment and `cdnUrl`)
- Create: `src/lib/image.test.js`

**Interfaces:**
- Produces: `responsiveImage(src, sizes)`, same signature and same return shape.

- [ ] **Step 1: Write failing tests.** Use `vi.stubEnv("VITE_IMAGE_CDN", "on")`, then `await import("./image.js")` after `vi.resetModules()`:

```js
expect(responsiveImage("/images/uploads/a b.jpg", "100vw").src)
  .toBe("/cdn-cgi/image/width=1200,quality=75,format=auto/images/uploads/a%20b.jpg");
expect(responsiveImage("/images/uploads/a.jpg", "100vw").srcSet.split(", ")).toHaveLength(5);
expect(responsiveImage("/logo.svg", "x")).toEqual({ src: "/logo.svg" });
expect(responsiveImage("https://x.nl/a.jpg", "x")).toEqual({ src: "https://x.nl/a.jpg" });
// with VITE_IMAGE_CDN unset:
expect(responsiveImage("/images/uploads/a.jpg", "x")).toEqual({ src: "/images/uploads/a.jpg" });
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL (URL still `/.netlify/images`).
- [ ] **Step 3: Implement.** `cdnUrl = (src, w) => \`/cdn-cgi/image/width=${w},quality=${QUALITY},format=auto${encodeURI(src)}\``. Rewrite the header comment: the CDN only works on the bnbdekopstoof.nl zone, so `VITE_IMAGE_CDN=on` is set only in the Pages **Production** environment, and previews, `pages.dev` and local dev load originals.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -am "feat: serve content photos through Cloudflare Image Transformations"` (add the test file first).

---

### Task 4: `cms-auth` — session tokens and CORS

**Files:**
- Create: `cms-auth/src/session.js`, `cms-auth/src/cors.js`
- Create: `cms-auth/test/session.test.js`, `cms-auth/test/cors.test.js`

**Interfaces:**
- Produces:
  - `createSession(email: string, secret: string, nowSec: number, ttlSec = 28800) => Promise<string>`. Format: `base64url(JSON.stringify({email, exp}))` + `"."` + `base64url(HMAC-SHA256(secret, payloadPart))`.
  - `verifySession(token: string, secret: string, nowSec: number) => Promise<{email: string} | null>`. Never throws. Compares signatures with `crypto.subtle.verify`, not string equality.
  - `parseList(value: string | undefined) => string[]`: comma-split, trim, lowercase, drop empties. Lives in `cors.js`, reused by Tasks 5 and 7.
  - `corsHeaders(origin: string | null, allowedOrigins: string[]) => Record<string,string> | null`. Returns `null` when the origin is not allowed. Otherwise returns `Access-Control-Allow-Origin: <origin>`, `Vary: Origin`, `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`, `Access-Control-Allow-Headers: Authorization, Content-Type, Accept, If-None-Match, Cache-Control`, `Access-Control-Max-Age: 86400`.

- [ ] **Step 1: Write failing tests** in `session.test.js`:

```js
const t = await createSession("owner@example.com", "s3cret", 1000);
expect(await verifySession(t, "s3cret", 1000 + 28799)).toEqual({ email: "owner@example.com" });
expect(await verifySession(t, "s3cret", 1000 + 28800)).toBeNull();        // expired at exp
expect(await verifySession(t, "other", 1000)).toBeNull();                 // wrong secret
const [p, s] = t.split(".");
const forged = btoa(JSON.stringify({ email: "evil@x.nl", exp: 9e9 })).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
expect(await verifySession(`${forged}.${s}`, "s3cret", 1000)).toBeNull(); // tampered payload
for (const bad of ["", "abc", "a.b.c", "!!!.???", `${p}.`]) expect(await verifySession(bad, "s3cret", 1000)).toBeNull();
```

  and in `cors.test.js`: an allowed origin gets the headers, a disallowed origin and `null` give `null`, and `parseList(" A@x.nl ,b@y.nl,, ")` → `["a@x.nl","b@y.nl"]`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** both modules (WebCrypto `importKey("raw", …, {name:"HMAC", hash:"SHA-256"})`).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git add cms-auth && git commit -m "feat(cms-auth): signed session tokens and CORS helpers"`

---

### Task 5: `cms-auth` — verify the Cloudflare Access JWT

**Files:**
- Create: `cms-auth/src/access.js`, `cms-auth/test/access.test.js`, `cms-auth/test/helpers/jwt.js`

**Interfaces:**
- Consumes: `parseList` (Task 4).
- Produces: `verifyAccessJwt(jwt: string | null, {teamDomain, aud, allowedEmails, nowSec, fetchFn = fetch}) => Promise<{email: string} | null>`. It fetches `https://${teamDomain}/cdn-cgi/access/certs` and uses the `keys` array (JWKs). It requires header `alg === "RS256"` and `kid` present in `keys`, a valid RS256 signature, `aud` (string or array) including `aud`, `iss === "https://" + teamDomain`, `exp > nowSec`, and `email` (lowercased, trimmed) in `allowedEmails`. Never throws.
- Test helper: `makeKeyAndCerts() => Promise<{privateKey, certs: {keys:[jwk]}, kid}>`, and `signJwt(header, payload, privateKey) => Promise<string>`.

- [ ] **Step 1: Write failing tests.** Base claims: `{aud: ["AUD1"], iss: "https://team.cloudflareaccess.com", exp: 2000, email: "Owner@Example.com"}`. `fetchFn` returns `certs`. `allowedEmails = parseList(" owner@example.com ,joost@x.nl")`. Cases:
  - valid → `{email: "owner@example.com"}` (Review Focus 3);
  - `exp: 999` with `nowSec: 1000` → null; wrong `aud` → null; wrong `iss` → null;
  - email `stranger@x.nl` → null; signed by another key → null; `alg: "none"` header with empty signature → null; unknown `kid` → null;
  - `null` or `"garbage"` jwt → null; `fetchFn` rejects → null.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `verifyAccessJwt` (`crypto.subtle.importKey("jwk", jwk, {name:"RSASSA-PKCS1-v1_5", hash:"SHA-256"}, false, ["verify"])`).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(cms-auth): verify Cloudflare Access JWT and email allowlist"`

---

### Task 6: `cms-auth` — GitHub App installation tokens

**Files:**
- Create: `cms-auth/src/githubApp.js`, `cms-auth/test/githubApp.test.js`

**Interfaces:**
- Produces:
  - `createAppJwt(appId: string, pkcs8Pem: string, nowSec: number) => Promise<string>`. RS256, claims `{iat: nowSec - 60, exp: nowSec + 540, iss: appId}`. The key must be **PKCS#8** (`-----BEGIN PRIVATE KEY-----`). GitHub hands out PKCS#1, and Task 10 converts it.
  - `getInstallationToken(env: {GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_INSTALLATION_ID}, nowSec: number, fetchFn = fetch) => Promise<string>`. Does `POST https://api.github.com/app/installations/${id}/access_tokens` with `Authorization: Bearer <appJwt>`, `Accept: application/vnd.github+json` and `User-Agent: dekopstoof-cms-auth`. The result is cached in module scope until `expires_at − 300 s`. Throws on non-2xx.
  - `resetTokenCache() => void` (tests only).

- [ ] **Step 1: Write failing tests.** Generate an RSA key in the test and export it as a PKCS#8 PEM.
  - `createAppJwt("123", pem, 1000)` verifies with the public key, and its claims are `{iat: 940, exp: 1540, iss: "123"}`.
  - `getInstallationToken`: the fetch mock returns `{token: "ghs_a", expires_at: new Date(4600_000).toISOString()}`. A call at 1000 and a call at 4000 → one fetch, both `"ghs_a"`. A call at 4301 → second fetch. The mock returns 401 → rejects.
  - The request URL is `https://api.github.com/app/installations/42/access_tokens` and the method is `POST`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(cms-auth): mint cached GitHub App installation tokens"`

---

### Task 7: `cms-auth` — proxy, auth page, router, deploy config

**Files:**
- Create: `cms-auth/src/proxy.js`, `cms-auth/src/authPage.js`, `cms-auth/src/index.js`, `cms-auth/wrangler.toml`
- Create: `cms-auth/test/proxy.test.js`, `cms-auth/test/auth.test.js`
- Modify: `package.json` (devDependency `wrangler`; scripts `"cms-auth:dev": "wrangler dev --config cms-auth/wrangler.toml"`, `"cms-auth:deploy": "wrangler deploy --config cms-auth/wrangler.toml"`)

**Interfaces:**
- Consumes: `verifySession`, `createSession`, `corsHeaders`, `parseList` (Task 4), `verifyAccessJwt` (Task 5), `getInstallationToken` (Task 6).
- Produces:
  - `isAllowedPath(path: string, repo: string) => boolean`. The path is the part after `/github`. Allowed: exactly `/user`, exactly `/repos/${repo}`, or a path starting with `/repos/${repo}/`, compared case-insensitively. Rejected whenever the raw path contains `..`, `//`, `%2e` or `%5c` (case-insensitive). `%2F` is **allowed**: Task 1 showed Decap sends paths such as `/repos/<repo>/git/trees/master:src%2Fcontent` and `/repos/<repo>/branches/spike%2Fcms-content`. It is safe because the prefix check requires a literal `/` right after the repo name, so `/repos/<repo>%2F…` never matches. Every path Decap called in Task 1 starts with `/repos/<repo>/` or is `/user`.
  - `handleProxy(request: Request, env, {nowSec, getToken = getInstallationToken, fetchFn = fetch}) => Promise<Response>`, in this order:
    1. Origin not allowed → 403, no CORS.
    2. `OPTIONS` → 204 + CORS.
    3. Path not allowed → 403 + CORS.
    4. Session missing or invalid (`Authorization: token <t>` or `Bearer <t>`) → 401 + CORS, body `{"message":"Sessie verlopen, log opnieuw in."}`.
    5. `GET /user` → 200 `{login: <email local part>, name: <email>, email: <email>, avatar_url: null}` without calling GitHub.
    6. Otherwise forward to `https://api.github.com${path}${search}` with the same method, body `request.body` (stream, `duplex: "half"`) and only the headers `Accept`, `Content-Type`, `If-None-Match`, plus `Authorization: Bearer <installation token>` and `User-Agent: dekopstoof-cms-auth`.
    7. Response: status and body pass through, `Set-Cookie` is dropped, CORS is added. For `GET /repos/${repo}` with status 200 the JSON gets `permissions: {admin: false, push: true, pull: true}`.
  - `handleAuth(request, env, {nowSec, verifyAccess = verifyAccessJwt}) => Promise<Response>`. Reads `Cf-Access-Jwt-Assertion` and calls `verifyAccess(jwt, {teamDomain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD, allowedEmails: parseList(env.ALLOWED_EMAILS), nowSec})`. On null → 403 `text/plain` `"Geen toegang."`. Otherwise → 200 `text/html` from `renderAuthPage(await createSession(email, env.SESSION_SECRET, nowSec), parseList(env.ALLOWED_ORIGINS))`, with `Cache-Control: no-store`.
  - `renderAuthPage(token: string, allowedOrigins: string[]) => string`. The script in the page:

```js
const allowed = /* JSON of allowedOrigins */;
const msg = "authorization:github:success:" + JSON.stringify({ token: /* JSON token */, provider: "github" });
window.addEventListener("message", (e) => {
  if (!allowed.includes(e.origin)) return;
  window.opener.postMessage(msg, e.origin);
});
window.opener.postMessage("authorizing:github", "*");
```

    Embed the JSON with `<` escaped as `<`. The visible text is `"Bezig met inloggen…"`.
  - `cms-auth/src/index.js`: `export default { fetch(request, env) }`. `GET /auth` → `handleAuth`, a path starting with `/github/` or equal to `/github` → `handleProxy` (strip the `/github` prefix), anything else → 404. `nowSec = Math.floor(Date.now()/1000)`.
  - `wrangler.toml`: `name = "cms-auth"`, `main = "src/index.js"`, `compatibility_date = "2026-11-01"`, `routes = [{ pattern = "cms.bnbdekopstoof.nl", custom_domain = true }]`, `[vars]` with `ALLOWED_ORIGINS = "https://bnbdekopstoof.nl"`, `GITHUB_REPO = "joostjonkheijm/DeKopstoof"`, `ACCESS_TEAM_DOMAIN = ""` and `ACCESS_AUD = ""` (Joost fills in the last two in Task 10). Secrets go in a comment only: `SESSION_SECRET, GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_INSTALLATION_ID, ALLOWED_EMAILS`.

- [ ] **Step 1: Write failing tests** in `proxy.test.js`. The env has `ALLOWED_ORIGINS="https://bnbdekopstoof.nl"`, `GITHUB_REPO="joostjonkheijm/DeKopstoof"` and `SESSION_SECRET="s"`; a valid token comes from `createSession`, `getToken` returns `"ghs_x"`, and `fetchFn` is a mock.
  - Review Focus 1: `isAllowedPath` is false for `/repos/joostjonkheijm/DeKopstoof/../other/x`, `/repos/joostjonkheijm/DeKopstoof/%2e%2e/x`, `/repos/joostjonkheijm/DeKopstoof%2Fx`, `//repos/joostjonkheijm/DeKopstoof`, `/repos/joostjonkheijm/DeKopstoof/%5c..`, `/repos/someone/else/contents/a`, `/repos/joostjonkheijm/DeKopstoof-other/contents/a`, `/orgs/x`. It is true for `/user`, `/repos/joostjonkheijm/DeKopstoof`, `/repos/JoostJonkheijm/dekopstoof/git/trees/master`, `/repos/joostjonkheijm/DeKopstoof/git/trees/master:src%2Fcontent`, `/repos/joostjonkheijm/DeKopstoof/branches/master%2Fx`. A disallowed path through `handleProxy` → 403 and `fetchFn` is never called.
  - Review Focus 2: an expired token (made with `nowSec - 28800`) → 401, the body's `message` is `"Sessie verlopen, log opnieuw in."`, and the response has `Access-Control-Allow-Origin: https://bnbdekopstoof.nl`.
  - Origin `https://evil.nl` → 403, no ACAO header. `OPTIONS` from the allowed origin → 204 with CORS.
  - `GET /user` → 200 with `email`, and `fetchFn` is not called.
  - `GET /repos/joostjonkheijm/DeKopstoof` → upstream `{full_name: "x"}` → the response JSON has `permissions.push === true`.
  - Forwarding: the upstream URL is `https://api.github.com/repos/joostjonkheijm/DeKopstoof/contents/a?ref=master`, the upstream `Authorization` is `Bearer ghs_x`, the incoming `Cookie` header is not forwarded, and the upstream response's `Set-Cookie` is not returned.
  - Review Focus 5: a `PUT` with a 10 MB `Uint8Array` body → upstream receives a body with the same byte length. Upstream 422 `{message:"conflict"}` → the response is 422 with the same body plus CORS.
- [ ] **Step 2: Write failing tests** in `auth.test.js`:
  - `verifyAccess` returns null → 403 `"Geen toegang."`.
  - It returns `{email}` → 200 HTML containing `"authorizing:github"` and `"authorization:github:success:"`. The token embedded in the HTML passes `verifySession`.
  - `renderAuthPage("</script><x>", ["https://bnbdekopstoof.nl"])` does not contain `"</script><x>"`.
  - The router: `GET /nope` → 404.
- [ ] **Step 3: Run** `npm test`. Expected: FAIL.
- [ ] **Step 4: Implement** `proxy.js`, `authPage.js`, `index.js`, `wrangler.toml`, then run `npm install -D wrangler` and add the scripts.
- [ ] **Step 5: Run** `npm test`. Expected: PASS. Run `npx wrangler deploy --dry-run --config cms-auth/wrangler.toml` → the bundle builds without errors.
- [ ] **Step 6: Commit** `git add cms-auth package.json package-lock.json && git commit -m "feat(cms-auth): GitHub proxy, Access login page and worker entry"`

---

### Task 8: Decap and site HTML switch to the new backend

**Files:**
- Modify: `public/admin/config.yml` (backend block only)
- Modify: `public/admin/index.html` (remove the Identity script and its comment)
- Modify: `index.html` (remove the invite-token redirect `<script>`)
- Modify: `vite.config.js` (comment: "Cloudflare Pages serves public/admin/index.html there")
- Delete: `netlify.toml`

- [ ] **Step 1: Replace the backend block** with exactly:

```yaml
backend:
  name: github
  repo: joostjonkheijm/DeKopstoof
  branch: master
  base_url: https://cms.bnbdekopstoof.nl
  auth_endpoint: auth
  api_root: https://cms.bnbdekopstoof.nl/github
  commit_messages:   # unchanged, keep the five existing lines
```

  Update the comment above it: login goes through the cms-auth Worker, see the README.
- [ ] **Step 2: Remove** the Identity `<script>` from `public/admin/index.html` and the hash-redirect `<script>` from `index.html`. `git rm netlify.toml`.
- [ ] **Step 3: Verify.** Run `npm run check:cms` → passes. `grep -rn "netlify" --include=*.{js,jsx,html,yml,toml,json} . | grep -v node_modules | grep -v package-lock` → no hits outside `docs/`. `npm run build` → succeeds. `node scripts/smoke-empty-content.mjs` (with `npx vite preview --port 4173` running) → passes.
- [ ] **Step 4: Commit** `git commit -am "feat: point Decap at the cms-auth worker and drop Netlify config"`

---

### Task 9: Documentation

**Files:**
- Modify: `README.md`: rewrite the Netlify parts (intro line, the `npm test` row, the `src/lib/image.js` line, **Authenticatie**, **Foto's**, **Routing op Netlify** → **Routing op Cloudflare Pages**). Add a section **Eenmalige inrichting Cloudflare** with the Task 10 steps in short form, plus a table of every env var and secret per place (Pages Production, Pages Preview, Worker).
- Modify: `docs/handleiding-eigenaar.md` section 1 **Inloggen**. The owner goes to `bnbdekopstoof.nl/admin/`, clicks the login button (copy the exact Dutch label from Decap 3.17.3's `nl` locale, which mentions GitHub; explain that this does *not* need a GitHub account), fills in their e-mail address, gets a code by mail, and types the code in. The login lasts 8 hours. There is no password and no "Forgot password".

- [ ] **Step 1: Write both changes.** Keep the existing tone: short sentences, informal "je".
- [ ] **Step 2: Verify.** `grep -n -i "netlify\|identity\|wachtwoord" README.md docs/handleiding-eigenaar.md` → only intentional mentions (for example "vroeger op Netlify" in a history note, or none at all).
- [ ] **Step 3: Commit** `git commit -am "docs: Cloudflare hosting and email-code login"`

---

### Task 10: Set up Cloudflare and cut over (Joost, manual, with Claude checking)

Claude cannot do these steps. Claude prepares the commands and checks the results after each block.

- [ ] **Step 1: DNS.** In Cloudflare, add the zone `bnbdekopstoof.nl` (free plan). At Hostnet, set the nameservers to the two Cloudflare gives you. Wait until `dig +short NS bnbdekopstoof.nl` shows `*.ns.cloudflare.com`. In Cloudflare, delete the parked A records for `91.184.0.200`.
- [ ] **Step 2: Mail.** In Resend → Domains, (re)add `bnbdekopstoof.nl` and copy the given DNS records into Cloudflare (DNS only, not proxied). Turn on Email Routing for `info@bnbdekopstoof.nl` → the owner's mailbox. Keep `_dmarc` at `p=reject`. Check: Resend shows the domain as *Verified*, and a test mail to `info@` arrives.
- [ ] **Step 3: Pages.** Workers & Pages → Create → Pages → Connect to Git → `DeKopstoof`. Production branch `master`, build `npm run build`, output `dist`. Env vars: Production `BOOKING_ICAL_URL`, `RESEND_API_KEY` (encrypted) and `VITE_IMAGE_CDN=on`; Preview the first two only. Check: the preview deploy of `feat/cloudflare` loads, `/api/availability` gives JSON, and `/kamers` loads.
- [ ] **Step 4: Image Transformations.** Zone → Images → Transformations → Enable for `bnbdekopstoof.nl`.
- [ ] **Step 5: GitHub App.** GitHub → Settings → Developer settings → GitHub Apps → New. No webhook, permissions *Contents: Read and write* and *Metadata: Read-only*, install on **Only select repositories → DeKopstoof**. Write down the App ID and the Installation ID (it is in the installation URL). Generate a private key and convert it:

```bash
openssl pkcs8 -topk8 -nocrypt -in dekopstoof-cms.private-key.pem -out key-pkcs8.pem
```

- [ ] **Step 6: Access.** Zero Trust (free) → pick a team name → Settings → Authentication → One-time PIN on. Access → Applications → Self-hosted: domain `cms.bnbdekopstoof.nl`, path `auth`. Policy *Allow*, Include → Emails: the owner's address and Joost's. Write down the team domain (`<team>.cloudflareaccess.com`) and the Application Audience (AUD) tag, and fill both into `cms-auth/wrangler.toml` `[vars]` (commit).
- [ ] **Step 7: Deploy the worker.**

```bash
npx wrangler login
```
```bash
npx wrangler secret put SESSION_SECRET --config cms-auth/wrangler.toml
```

  For `SESSION_SECRET` use the output of `openssl rand -base64 32`. Repeat for `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `ALLOWED_EMAILS` (the same addresses as the Access policy, comma-separated) and `GITHUB_APP_PRIVATE_KEY` (`< key-pkcs8.pem`), then:

```bash
npm run cms-auth:deploy
```

  Check: `curl -sI https://cms.bnbdekopstoof.nl/auth` → 302 to `*.cloudflareaccess.com`. `curl -s -o /dev/null -w "%{http_code}" -H "Origin: https://bnbdekopstoof.nl" https://cms.bnbdekopstoof.nl/github/user` → `401`. Delete the local `.pem` files.
- [ ] **Step 8: Stop Netlify builds.** Netlify → Site configuration → Build & deploy → **Stop builds**. The last deploy stays online as a fallback.
- [ ] **Step 9: Merge** `feat/cloudflare` into `master` and push. Pages builds production. In Pages → Custom domains, add `bnbdekopstoof.nl` and `www.bnbdekopstoof.nl`. Add a Redirect Rule: `www.bnbdekopstoof.nl/*` → `https://bnbdekopstoof.nl/${1}` with status 301.
- [ ] **Step 10: End-to-end check.** Check each of these:
  - `https://bnbdekopstoof.nl` and all six pages load, and `www` redirects;
  - photos load through `/cdn-cgi/image/…` (Network tab) as `avif` or `webp`;
  - the booking calendar shows booked dates, and a test inquiry arrives at `info@`;
  - the owner logs in at `/admin/` with an e-mail code, changes a text, and the commit appears on `master` as `<app>[bot]`. Pages builds, and the change is live within minutes;
  - a photo upload works.
- [ ] **Step 11: Clean up.** Once everything has worked for a week, delete the Netlify site (Identity users go with it). Remove `"Bash(netlify link *)"` from `.claude/settings.local.json` and the local `.netlify/` folder. Update the memory/README status.
