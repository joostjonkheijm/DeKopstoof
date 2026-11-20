// cms-auth worker entry: GET /auth (behind Access) and /github/* (session-token proxy).
import { handleAuth } from "./authPage.js";
import { handleProxy } from "./proxy.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const nowSec = Math.floor(Date.now() / 1000);

    if (request.method === "GET" && pathname === "/auth") return handleAuth(request, env, { nowSec });
    // handleProxy strips the /github mount prefix itself.
    if (pathname === "/github" || pathname.startsWith("/github/")) return handleProxy(request, env, { nowSec });
    return new Response("Niet gevonden.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  },
};
