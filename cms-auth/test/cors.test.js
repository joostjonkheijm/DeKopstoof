import { describe, it, expect } from "vitest";
import { corsHeaders, parseList } from "../src/cors.js";

describe("corsHeaders", () => {
  const allowed = ["https://a.nl"];
  it("returns headers for an allowed origin", () => {
    expect(corsHeaders("https://a.nl", allowed)).toEqual({
      "Access-Control-Allow-Origin": "https://a.nl",
      Vary: "Origin",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, If-None-Match, Cache-Control",
      "Access-Control-Max-Age": "86400",
    });
  });
  it("returns null for disallowed or null origin", () => {
    expect(corsHeaders("https://evil.nl", allowed)).toBeNull();
    expect(corsHeaders(null, allowed)).toBeNull();
  });
});

describe("parseList", () => {
  it("splits, trims, lowercases, drops empties", () => {
    expect(parseList(" A@x.nl ,b@y.nl,, ")).toEqual(["a@x.nl", "b@y.nl"]);
    expect(parseList(undefined)).toEqual([]);
  });
});
