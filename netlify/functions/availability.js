const { parseIcal } = require("./utils/parseIcal");

exports.handler = async () => {
  const url = process.env.BOOKING_ICAL_URL;

  if (!url) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "BOOKING_ICAL_URL not configured" }),
    };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Booking.com responded with HTTP ${response.status}`);
    }
    const text = await response.text();
    const bookedRanges = parseIcal(text);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
      body: JSON.stringify({ bookedRanges }),
    };
  } catch (err) {
    console.error("availability function error:", err.message);
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch availability" }),
    };
  }
};
