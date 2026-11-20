// GET /auth (behind Cloudflare Access): verify the Access JWT, mint a session token and
// hand it to Decap through the postMessage handshake in a popup page.
import { verifyAccessJwt } from "./access.js";
import { createSession } from "./session.js";
import { parseList } from "./cors.js";

const text = (body, status) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

// JSON that is safe inside an inline <script>: "<" can never start "</script>" or "<!--".
const scriptJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

export function renderAuthPage(token, allowedOrigins) {
  return `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"><title>Inloggen</title></head>
<body>
<p id="status">Bezig met inloggen…</p>
<script>
const allowed = ${scriptJson(allowedOrigins)};
const token = ${scriptJson(token)};
const msg = "authorization:github:success:" + JSON.stringify({ token: token, provider: "github" });
if (!window.opener) {
  // Opened directly (not as Decap's popup): nobody to hand the token to.
  document.getElementById("status").textContent = "Open het beheerscherm en log daar opnieuw in.";
} else {
  window.addEventListener("message", (e) => {
    if (!allowed.includes(e.origin)) return;
    if (!window.opener) return;
    window.opener.postMessage(msg, e.origin);
  });
  window.opener.postMessage("authorizing:github", "*");
}
</script>
</body>
</html>
`;
}

export async function handleAuth(request, env, { nowSec, verifyAccess = verifyAccessJwt } = {}) {
  if (!env.SESSION_SECRET) {
    console.error("cms-auth: SESSION_SECRET is not set");
    return text("Configuratiefout.", 500);
  }
  const identity = await verifyAccess(request.headers.get("Cf-Access-Jwt-Assertion"), {
    teamDomain: env.ACCESS_TEAM_DOMAIN,
    aud: env.ACCESS_AUD,
    allowedEmails: parseList(env.ALLOWED_EMAILS),
    nowSec,
  });
  if (!identity) return text("Geen toegang.", 403);

  const token = await createSession(identity.email, env.SESSION_SECRET, nowSec);
  return new Response(renderAuthPage(token, parseList(env.ALLOWED_ORIGINS)), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
    },
  });
}
