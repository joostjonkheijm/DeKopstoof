import { parseIcal } from "../../server/parseIcal.js";

const json = (data, status, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });

export async function onRequestGet({ env }) {
  const url = env.BOOKING_ICAL_URL;

  if (!url) {
    return json({ error: "BOOKING_ICAL_URL not configured" }, 500);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Booking.com responded with HTTP ${response.status}`);
    }
    const bookedRanges = parseIcal(await response.text());

    return json({ bookedRanges }, 200, { "Cache-Control": "public, max-age=3600" });
  } catch (err) {
    console.error("availability function error:", err.message);
    return json({ error: "Failed to fetch availability" }, 502);
  }
}
