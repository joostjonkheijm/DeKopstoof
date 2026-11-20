import { describe, it, expect, vi, afterEach } from "vitest";
import { onRequestGet } from "./availability.js";
import { onRequestPost } from "./send-inquiry.js";

const ICAL = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20261210
DTEND;VALUE=DATE:20261215
END:VEVENT
END:VCALENDAR`;

const env = { BOOKING_ICAL_URL: "https://ical.example/test.ics", RESEND_API_KEY: "re_test" };
const valid = { name: "A", email: "a@b.nl", checkIn: "2026-12-01", checkOut: "2026-12-03" };

const post = (body) =>
  new Request("https://site.test/api/send-inquiry", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

/** Stub fetch: iCal host gets `ical`, Resend gets `resend` (both functions returning a Response or throwing). */
function stubFetch({ ical, resend }) {
  const fn = vi.fn(async (url) =>
    String(url).startsWith("https://api.resend.com") ? resend() : ical()
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/availability", () => {
  it("returns 500 when BOOKING_ICAL_URL is missing", async () => {
    const res = await onRequestGet({ env: {} });
    expect(res.status).toBe(500);
  });

  it("returns booked ranges with cache header", async () => {
    stubFetch({ ical: () => new Response(ICAL, { status: 200 }) });
    const res = await onRequestGet({ env });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(await res.json()).toEqual({ bookedRanges: [{ start: "2026-12-10", end: "2026-12-15" }] });
  });

  it("returns 502 when the iCal feed fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch({ ical: () => new Response("down", { status: 503 }) });
    const res = await onRequestGet({ env });
    expect(res.status).toBe(502);
  });
});

describe("POST /api/send-inquiry", () => {
  it("returns 400 for invalid JSON", async () => {
    const res = await onRequestPost({ request: post("{nope"), env });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Ongeldige aanvraag" });
  });

  it("returns 409 when the dates overlap a booking", async () => {
    stubFetch({ ical: () => new Response(ICAL, { status: 200 }) });
    const res = await onRequestPost({
      request: post({ ...valid, checkIn: "2026-12-12", checkOut: "2026-12-14" }),
      env,
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "Deze datums zijn zojuist gereserveerd. Kies andere datums.",
    });
  });

  it("still sends the email when the iCal fetch throws", async () => {
    const fn = stubFetch({
      ical: () => {
        throw new Error("network");
      },
      resend: () => new Response("{}", { status: 200 }),
    });
    const res = await onRequestPost({ request: post(valid), env });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(fn.mock.calls.some(([url]) => String(url) === "https://api.resend.com/emails")).toBe(true);
  });

  it("returns 500 with a Dutch message when Resend fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch({
      ical: () => new Response("", { status: 200 }),
      resend: () => new Response("boom", { status: 500 }),
    });
    const res = await onRequestPost({ request: post(valid), env });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "E-mail verzenden mislukt. Probeer het opnieuw of neem direct contact op.",
    });
  });
});
