// Comma-separated env value -> trimmed, lowercased, non-empty entries.
export function parseList(value) {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// CORS headers for an allowed origin, or null when the origin is not allowed.
export function corsHeaders(origin, allowedOrigins) {
  if (typeof origin !== "string" || !allowedOrigins.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, If-None-Match, Cache-Control",
    "Access-Control-Max-Age": "86400",
  };
}
