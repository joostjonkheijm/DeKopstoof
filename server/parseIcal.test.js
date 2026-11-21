import { describe, it, expect } from "vitest";
import { parseIcal } from "./parseIcal.js";

const ICAL_DATE_ONLY = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking.com//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260714
SUMMARY:Booking
UID:abc123
END:VEVENT
END:VCALENDAR`;

const ICAL_DATETIME = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260820T140000Z
DTEND:20260823T120000Z
SUMMARY:Booking
UID:def456
END:VEVENT
END:VCALENDAR`;

const ICAL_EMPTY = `BEGIN:VCALENDAR
VERSION:2.0
END:VCALENDAR`;

const ICAL_MULTIPLE = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260901
DTEND;VALUE=DATE:20260905
SUMMARY:Booking 1
UID:aaa
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20261010
DTEND;VALUE=DATE:20261012
SUMMARY:Booking 2
UID:bbb
END:VEVENT
END:VCALENDAR`;

describe("parseIcal", () => {
  it("parses DATE-format DTSTART/DTEND", () => {
    expect(parseIcal(ICAL_DATE_ONLY)).toEqual([
      { start: "2026-07-10", end: "2026-07-14" },
    ]);
  });

  it("parses DATETIME-format DTSTART/DTEND", () => {
    expect(parseIcal(ICAL_DATETIME)).toEqual([
      { start: "2026-08-20", end: "2026-08-23" },
    ]);
  });

  it("returns empty array for calendar with no events", () => {
    expect(parseIcal(ICAL_EMPTY)).toEqual([]);
  });

  it("parses multiple events", () => {
    expect(parseIcal(ICAL_MULTIPLE)).toEqual([
      { start: "2026-09-01", end: "2026-09-05" },
      { start: "2026-10-10", end: "2026-10-12" },
    ]);
  });

  it("ignores events with missing DTSTART or DTEND", () => {
    const ical = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260101
SUMMARY:No end date
UID:ccc
END:VEVENT
END:VCALENDAR`;
    expect(parseIcal(ical)).toEqual([]);
  });
});
