/**
 * Convert 8-digit iCal date string to ISO date.
 * "20260710" → "2026-07-10"
 */
function toIsoDate(raw) {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/**
 * Parse raw iCal text and return an array of booked date ranges.
 * Each range is { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }.
 * DTEND in iCal is exclusive (checkout day), matching our frontend logic.
 *
 * Handles both:
 *   DTSTART;VALUE=DATE:20260710   (date-only)
 *   DTSTART:20260710T140000Z      (datetime — only first 8 digits used)
 */
function parseIcal(text) {
  const bookedRanges = [];
  const events = text.split("BEGIN:VEVENT").slice(1);

  for (const event of events) {
    const startMatch = event.match(/DTSTART(?:;[^:\r\n]*)?:(\d{8})/);
    const endMatch = event.match(/DTEND(?:;[^:\r\n]*)?:(\d{8})/);

    if (startMatch && endMatch) {
      bookedRanges.push({
        start: toIsoDate(startMatch[1]),
        end: toIsoDate(endMatch[1]),
      });
    }
  }

  return bookedRanges;
}

module.exports = { parseIcal };
