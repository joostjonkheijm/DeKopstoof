# Booking.com Calendersync + Aanvraagformulier — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow guests to pick available dates (synced from Booking.com iCal) on `/boeken` and submit an inquiry that lands in the owner's inbox at `info@bnbdekopstoof.nl`.

**Architecture:** Two Netlify Functions handle iCal fetching/parsing and email dispatch. A new React page at `/boeken` composes a date-range picker and inquiry form that call those functions. The iCal URL stays server-side only.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 3, react-day-picker v8, date-fns, Netlify Functions (Node.js CommonJS), Resend API v4, Vitest

## Global Constraints

- Dutch UI copy throughout — no English strings visible to users
- Tailwind design tokens only: `background` (#F5F0EA), `surface` (#EDE6D6), `primary` (#2C1F14), `accent` (#C4714A), `accent-light` (#D4845E), `cream` (#FEFCF8)
- Font: `font-heading` (Playfair Display), `font-body` (DM Sans)
- No TypeScript — plain JSX
- Netlify Functions use CommonJS (`require` / `module.exports`) — no ESM in `netlify/functions/`
- Owner email: `info@bnbdekopstoof.nl`
- Owner phone: `+31654235765`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `netlify/functions/utils/parseIcal.js` | Create | Pure iCal parser — no I/O |
| `netlify/functions/utils/parseIcal.test.js` | Create | Vitest unit tests for parser |
| `netlify/functions/availability.js` | Create | Netlify Function: fetch iCal → return booked ranges |
| `netlify/functions/send-inquiry.js` | Create | Netlify Function: validate + re-check + send email |
| `netlify.toml` | Create | Build config + `/api/*` redirect |
| `vite.config.js` | Modify | Add Vitest test config |
| `src/pages/boeken/index.jsx` | Create | Boekingspagina — composes header + calendar + form |
| `src/pages/boeken/components/BookingCalendar.jsx` | Create | Date-range picker, fetches availability |
| `src/pages/boeken/components/InquiryForm.jsx` | Create | Inquiry form, submits to send-inquiry |
| `src/index.css` | Modify | react-day-picker color overrides |
| `src/App.jsx` | Modify | Add `/boeken` route |
| `src/components/Navbar6.jsx` | Modify | "Boek nu" → `/boeken` (2 places: desktop + mobile) |
| `src/pages/home/components/Cta40.jsx` | Modify | "Bekijk beschikbaarheid" button → `/boeken` |
| `src/pages/kamers/components/Cta40.jsx` | Modify | Same |
| `src/pages/over-de-kopstoof/components/Cta40.jsx` | Modify | Same |
| `src/pages/reviews/components/Cta40.jsx` | Modify | Same |
| `src/pages/kamers/components/Pricing18.jsx` | Modify | "Boeken" buttons per kamer → `/boeken` |

---

## Prerequisites (manual steps before coding)

### Resend account
1. Create account at resend.com (free tier: 3,000 emails/month)
2. Add domain `bnbdekopstoof.nl` → Resend generates DNS records
3. Add those DNS records at your DNS provider (TTL 300)
4. Wait for Resend to verify (green checkmark)
5. Create API key → copy it

### Booking.com iCal URL
1. Log in to booking.com Extranet
2. Calendar → Exporteer kalender / iCal export
3. Copy the `.ics` URL (contains a secret token)

### Netlify environment variables
In Netlify Dashboard → Site Settings → Environment Variables, add:
```
BOOKING_ICAL_URL=<your booking.com ical url>
RESEND_API_KEY=re_<your key>
```

For local dev, create `netlify/.env` (gitignored) with the same vars.

---

## Task 1: Setup — dependencies, netlify.toml, Vitest

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `vite.config.js`
- Create: `netlify.toml`

**Interfaces:**
- Produces: `npm test` runs Vitest; `/api/*` routes work in Netlify dev

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install react-day-picker@8 date-fns resend
```

Expected output: 3 packages added with no peer-dependency warnings.

- [ ] **Step 2: Install dev dependency**

```bash
npm install --save-dev vitest
```

- [ ] **Step 3: Add test config to vite.config.js**

Replace the full file content:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: false,
  },
  test: {
    environment: "node",
    include: ["netlify/**/*.test.js"],
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add `"test": "vitest run"` to the `scripts` block:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 5: Create netlify.toml**

```toml
[build]
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

This lets the frontend call `/api/availability` instead of `/.netlify/functions/availability`.

- [ ] **Step 6: Add gitignore entry for local env**

Append to `.gitignore` (create if missing):

```
netlify/.env
```

- [ ] **Step 7: Verify dev server still starts**

```bash
npm run dev
```

Expected: Vite starts on port 5173 with no errors.

- [ ] **Step 8: Commit**

```bash
git add vite.config.js package.json package-lock.json netlify.toml .gitignore
git commit -m "feat: add booking sync dependencies and netlify config"
```

---

## Task 2: iCal Parser Utility + Tests

**Files:**
- Create: `netlify/functions/utils/parseIcal.js`
- Create: `netlify/functions/utils/parseIcal.test.js`

**Interfaces:**
- Produces: `parseIcal(text: string): Array<{ start: string, end: string }>` where dates are `"YYYY-MM-DD"`
- Consumed by: `availability.js` and `send-inquiry.js` via `require('./utils/parseIcal')`

- [ ] **Step 1: Create utils directory and write failing test**

```bash
mkdir -p netlify/functions/utils
```

Create `netlify/functions/utils/parseIcal.test.js`:

```javascript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: `5 tests failed` with `parseIcal is not a function` or similar.

- [ ] **Step 3: Write the parser implementation**

Create `netlify/functions/utils/parseIcal.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/utils/parseIcal.js netlify/functions/utils/parseIcal.test.js
git commit -m "feat: add iCal parser utility with tests"
```

---

## Task 3: `availability.js` — Netlify Function

**Files:**
- Create: `netlify/functions/availability.js`

**Interfaces:**
- Consumes: `parseIcal` from `./utils/parseIcal`; `process.env.BOOKING_ICAL_URL`
- Produces: `GET /api/availability` → `{ bookedRanges: Array<{ start, end }> }` with `Cache-Control: max-age=3600`

- [ ] **Step 1: Create the function**

Create `netlify/functions/availability.js`:

```javascript
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
```

- [ ] **Step 2: Verify function structure is correct**

```bash
node -e "const f = require('./netlify/functions/availability.js'); console.log(typeof f.handler);"
```

Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/availability.js
git commit -m "feat: add availability Netlify Function"
```

---

## Task 4: `send-inquiry.js` — Netlify Function

**Files:**
- Create: `netlify/functions/send-inquiry.js`

**Interfaces:**
- Consumes: `parseIcal` from `./utils/parseIcal`; `process.env.BOOKING_ICAL_URL`; `process.env.RESEND_API_KEY`
- Produces: `POST /api/send-inquiry` → `{ success: true }` or `{ error: string }` with HTTP 400/409/500

**Request body shape:**
```json
{ "name": "...", "email": "...", "phone": "...", "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD", "message": "..." }
```

- [ ] **Step 1: Create the function**

Create `netlify/functions/send-inquiry.js`:

```javascript
const { Resend } = require("resend");
const { parseIcal } = require("./utils/parseIcal");

const resend = new Resend(process.env.RESEND_API_KEY);

/** Basic HTML escaping to prevent XSS in email body */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Returns true if [checkIn, checkOut) overlaps any booked range [start, end) */
function overlaps(checkIn, checkOut, bookedRanges) {
  return bookedRanges.some(
    ({ start, end }) => checkIn < end && checkOut > start
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Ongeldige aanvraag" }),
    };
  }

  const { name, email, checkIn, checkOut, phone = "", message = "" } = body;

  // Validate required fields
  if (!name || !email || !checkIn || !checkOut) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Verplichte velden ontbreken" }),
    };
  }

  // Validate date order
  if (checkOut <= checkIn) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Check-out moet na check-in zijn" }),
    };
  }

  // Re-check availability to prevent race condition
  try {
    const icalResponse = await fetch(process.env.BOOKING_ICAL_URL);
    if (icalResponse.ok) {
      const icalText = await icalResponse.text();
      const bookedRanges = parseIcal(icalText);
      if (overlaps(checkIn, checkOut, bookedRanges)) {
        return {
          statusCode: 409,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error:
              "Deze datums zijn zojuist gereserveerd. Kies andere datums.",
          }),
        };
      }
    }
    // If iCal fetch fails here, proceed anyway — don't block the inquiry
  } catch {
    // Proceed
  }

  const nights = Math.round(
    (new Date(checkOut) - new Date(checkIn)) / 86_400_000
  );

  const emailHtml = `
    <h2 style="font-family:serif;color:#2C1F14;">Nieuwe boekingsaanvraag — De Kopstoof</h2>
    <table style="border-collapse:collapse;width:100%;max-width:480px;">
      <tr><td style="padding:8px 0;color:#666;width:140px;">Naam</td><td style="padding:8px 0;font-weight:bold;">${esc(name)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">E-mail</td><td style="padding:8px 0;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      ${phone ? `<tr><td style="padding:8px 0;color:#666;">Telefoon</td><td style="padding:8px 0;">${esc(phone)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#666;">Check-in</td><td style="padding:8px 0;">${esc(checkIn)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Check-out</td><td style="padding:8px 0;">${esc(checkOut)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Aantal nachten</td><td style="padding:8px 0;">${nights}</td></tr>
      ${message ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top;">Opmerking</td><td style="padding:8px 0;">${esc(message)}</td></tr>` : ""}
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#999;font-size:12px;">Beantwoord deze e-mail direct om de gast te bereiken.</p>
  `;

  try {
    await resend.emails.send({
      from: "De Kopstoof <noreply@bnbdekopstoof.nl>",
      to: "info@bnbdekopstoof.nl",
      replyTo: email,
      subject: `Boekingsaanvraag: ${checkIn} – ${checkOut} (${nights} nacht${nights !== 1 ? "en" : ""})`,
      html: emailHtml,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("send-inquiry email error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "E-mail verzenden mislukt. Probeer het opnieuw of neem direct contact op." }),
    };
  }
};
```

- [ ] **Step 2: Verify function loads without error**

```bash
node -e "const f = require('./netlify/functions/send-inquiry.js'); console.log(typeof f.handler);"
```

Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/send-inquiry.js
git commit -m "feat: add send-inquiry Netlify Function"
```

---

## Task 5: BookingCalendar Component

**Files:**
- Create: `src/pages/boeken/components/BookingCalendar.jsx`
- Modify: `src/index.css` (add react-day-picker color overrides)

**Interfaces:**
- Props: `onRangeSelect(range: { checkIn: string, checkOut: string } | null) => void`
- Fetches: `GET /api/availability`

- [ ] **Step 1: Create component directory**

```bash
mkdir -p src/pages/boeken/components
```

- [ ] **Step 2: Create BookingCalendar.jsx**

Create `src/pages/boeken/components/BookingCalendar.jsx`:

```jsx
"use client";

import React, { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { nl } from "date-fns/locale";
import "react-day-picker/dist/style.css";

/**
 * Use local date parts to avoid UTC offset shifting the date.
 * e.g. 2026-07-10 at midnight in UTC+2 would become 2026-07-09 via toISOString().
 */
function toLocalIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns true if `date` falls within any booked range [start, end).
 * DTEND in iCal is exclusive, so checkout day itself is available.
 */
function isDateBooked(date, bookedRanges) {
  const d = toLocalIsoDate(date);
  return bookedRanges.some(({ start, end }) => d >= start && d < end);
}

export function BookingCalendar({ onRangeSelect }) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState(undefined);

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setBookedRanges(data.bookedRanges ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const handleSelect = (r) => {
    setRange(r);
    if (r?.from && r?.to) {
      onRangeSelect({
        checkIn: toLocalIsoDate(r.from),
        checkOut: toLocalIsoDate(r.to),
      });
    } else {
      onRangeSelect(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-primary/70">
        Beschikbaarheid tijdelijk niet beschikbaar —{" "}
        <a href="mailto:info@bnbdekopstoof.nl" className="underline hover:text-accent">
          mail
        </a>{" "}
        of{" "}
        <a href="tel:+31654235765" className="underline hover:text-accent">
          bel
        </a>{" "}
        ons direct.
      </p>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="booking-calendar">
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        disabled={[
          { before: today },
          (date) => isDateBooked(date, bookedRanges),
        ]}
        numberOfMonths={2}
        locale={nl}
        showOutsideDays={false}
      />
    </div>
  );
}
```

- [ ] **Step 3: Add calendar color overrides to src/index.css**

Append to the end of `src/index.css`:

```css
/* react-day-picker color overrides to match De Kopstoof brand */
.booking-calendar {
  --rdp-accent-color: #C4714A;
  --rdp-accent-color-dark: #D4845E;
  --rdp-background-color: rgba(196, 113, 74, 0.12);
  --rdp-background-color-dark: rgba(196, 113, 74, 0.18);
  --rdp-outline: 2px solid #C4714A;
  --rdp-outline-selected: 2px solid rgba(196, 113, 74, 0.6);
}

.booking-calendar .rdp {
  margin: 0;
  font-family: "DM Sans", sans-serif;
}

.booking-calendar .rdp-day_disabled {
  opacity: 0.35;
  text-decoration: line-through;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/boeken/components/BookingCalendar.jsx src/index.css
git commit -m "feat: add BookingCalendar component"
```

---

## Task 6: InquiryForm Component

**Files:**
- Create: `src/pages/boeken/components/InquiryForm.jsx`

**Interfaces:**
- Props: `checkIn: string` (YYYY-MM-DD), `checkOut: string` (YYYY-MM-DD)
- Posts to: `POST /api/send-inquiry`

- [ ] **Step 1: Create InquiryForm.jsx**

Create `src/pages/boeken/components/InquiryForm.jsx`:

```jsx
"use client";

import React, { useState } from "react";

const DUTCH_MONTHS = [
  "januari","februari","maart","april","mei","juni",
  "juli","augustus","september","oktober","november","december",
];

function formatDutchDate(iso) {
  const [year, month, day] = iso.split("-");
  return `${parseInt(day, 10)} ${DUTCH_MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

const inputClass =
  "w-full border border-primary/20 bg-cream px-4 py-3 font-body text-sm text-primary placeholder:text-primary/40 focus:border-accent focus:outline-none";

const labelClass = "mb-1.5 block font-body text-xs font-semibold uppercase tracking-wider text-primary/60";

export function InquiryForm({ checkIn, checkOut }) {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error | conflict
  const [errorMsg, setErrorMsg] = useState("");

  const nights = Math.round(
    (new Date(checkOut) - new Date(checkIn)) / 86_400_000
  );

  const handleChange = (e) =>
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/send-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, checkIn, checkOut }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setStatus("conflict");
      } else if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Er ging iets mis. Probeer het opnieuw.");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Verbinding mislukt. Probeer het opnieuw of neem direct contact op.");
    }
  };

  if (status === "success") {
    return (
      <div className="border border-nature/30 bg-nature/10 p-8 text-center">
        <p className="font-heading text-2xl font-bold text-primary">Aanvraag ontvangen!</p>
        <p className="mt-3 font-body text-sm text-primary/70">
          We nemen binnen 24 uur contact met je op via e-mail om je verblijf te bevestigen.
        </p>
      </div>
    );
  }

  if (status === "conflict") {
    return (
      <div className="border border-accent/30 bg-accent/10 p-8 text-center">
        <p className="font-heading text-xl font-bold text-primary">Datums niet meer beschikbaar</p>
        <p className="mt-3 font-body text-sm text-primary/70">
          Deze datums zijn zojuist gereserveerd. Kies andere datums hierboven.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date summary */}
      <div className="border border-primary/10 bg-surface p-5">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-primary/60">
          Jouw aanvraag
        </p>
        <p className="mt-2 font-heading text-lg font-bold text-primary">
          {formatDutchDate(checkIn)} — {formatDutchDate(checkOut)}
        </p>
        <p className="mt-1 font-body text-sm text-primary/60">
          {nights} nacht{nights !== 1 ? "en" : ""} · incl. ontbijt op aanvraag
        </p>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClass}>
          Naam <span className="text-accent">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={fields.name}
          onChange={handleChange}
          placeholder="Voor- en achternaam"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>
          E-mail <span className="text-accent">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          placeholder="jouw@email.nl"
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          Telefoon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={handleChange}
          placeholder="+31 6 ..."
          className={inputClass}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClass}>
          Opmerking
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={fields.message}
          onChange={handleChange}
          placeholder="Bijzonderheden, vragen, ..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <p className="font-body text-sm text-red-700">{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Verzenden..." : "Stuur aanvraag"}
      </button>

      <p className="font-body text-xs text-primary/40">
        Door te versturen ga je akkoord met onze voorwaarden en privacybeleid.
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/boeken/components/InquiryForm.jsx
git commit -m "feat: add InquiryForm component"
```

---

## Task 7: Boekingspagina (`/boeken`)

**Files:**
- Create: `src/pages/boeken/index.jsx`

**Interfaces:**
- Consumes: `BookingCalendar` (onRangeSelect prop), `InquiryForm` (checkIn, checkOut props)
- Renders at route: `/boeken`

- [ ] **Step 1: Create the page**

Create `src/pages/boeken/index.jsx`:

```jsx
import React, { useState } from "react";
import { Navbar6 } from "../../components/Navbar6";
import { Footer2 } from "../home/components/Footer2";
import { BookingCalendar } from "./components/BookingCalendar";
import { InquiryForm } from "./components/InquiryForm";

export default function Boeken() {
  const [selectedRange, setSelectedRange] = useState(null);

  return (
    <>
      <Navbar6 />

      {/* Page header */}
      <section className="bg-surface px-[5%] py-20 md:py-28">
        <div className="container">
          <p className="overline-text mb-4 text-accent">Direct boeken</p>
          <h1 className="font-heading text-5xl font-bold md:text-7xl lg:text-8xl">
            Reserveer jouw verblijf
          </h1>
          <p className="mt-5 max-w-lg text-primary/70 md:text-lg">
            Kies jouw check-in en check-out datum. Grijze datums zijn al bezet.
            Na jouw aanvraag nemen we binnen 24 uur contact op.
          </p>
        </div>
      </section>

      {/* Calendar + form */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_420px] lg:gap-20">
            {/* Left: calendar */}
            <div>
              <h2 className="mb-8 font-heading text-2xl font-bold text-primary md:text-3xl">
                Kies jouw data
              </h2>
              <BookingCalendar onRangeSelect={setSelectedRange} />
            </div>

            {/* Right: form — shown after date selection */}
            <div>
              {selectedRange ? (
                <>
                  <h2 className="mb-8 font-heading text-2xl font-bold text-primary md:text-3xl">
                    Jouw gegevens
                  </h2>
                  <InquiryForm
                    key={`${selectedRange.checkIn}-${selectedRange.checkOut}`}
                    checkIn={selectedRange.checkIn}
                    checkOut={selectedRange.checkOut}
                  />
                </>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center border border-dashed border-primary/20 p-10 lg:mt-16">
                  <p className="text-center font-body text-sm text-primary/50">
                    Selecteer eerst een check-in en check-out datum in de kalender.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact fallback */}
      <section className="bg-surface px-[5%] py-12 md:py-16">
        <div className="container text-center">
          <p className="font-body text-sm text-primary/60">
            Liever direct contact?{" "}
            <a href="mailto:info@bnbdekopstoof.nl" className="underline hover:text-accent">
              Mail ons
            </a>{" "}
            of{" "}
            <a href="tel:+31654235765" className="underline hover:text-accent">
              bel +31 6 54 23 57 65
            </a>
            .
          </p>
        </div>
      </section>

      <Footer2 />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/boeken/index.jsx
git commit -m "feat: add Boekingspagina at /boeken"
```

---

## Task 8: Routing + Navbar Updates

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Navbar6.jsx`

**Changes:**
- `App.jsx`: add `import Boeken` + `<Route path="/boeken" element={<Boeken />} />`
- `Navbar6.jsx`: two "Boek nu" `<Link to="/kamers">` → `<Link to="/boeken">` (desktop line 116 and mobile line 196)

- [ ] **Step 1: Add route to App.jsx**

In `src/App.jsx`, add import after the last existing import:

```jsx
import Boeken from "./pages/boeken/index.jsx";
```

Add route inside `<Routes>` after the last `<Route>`:

```jsx
<Route path="/boeken" element={<Boeken />} />
```

Full file after changes:

```jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/index.jsx";
import Kamers from "./pages/kamers/index.jsx";
import Omgeving from "./pages/omgeving/index.jsx";
import OverDeKopstoof from "./pages/over-de-kopstoof/index.jsx";
import Reviews from "./pages/reviews/index.jsx";
import Boeken from "./pages/boeken/index.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/kamers" element={<Kamers />} />
      <Route path="/omgeving" element={<Omgeving />} />
      <Route path="/over-de-kopstoof" element={<OverDeKopstoof />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/boeken" element={<Boeken />} />
    </Routes>
  );
}
```

- [ ] **Step 2: Update Navbar6.jsx — desktop "Boek nu" button (line ~116)**

Find this block in the desktop CTAs section:

```jsx
          <Link
            to="/kamers"
            className="bg-accent px-5 py-2.5 font-body text-sm font-semibold text-cream transition-colors hover:bg-accent-light"
          >
            Boek nu
          </Link>
```

Replace `to="/kamers"` with `to="/boeken"`:

```jsx
          <Link
            to="/boeken"
            className="bg-accent px-5 py-2.5 font-body text-sm font-semibold text-cream transition-colors hover:bg-accent-light"
          >
            Boek nu
          </Link>
```

- [ ] **Step 3: Update Navbar6.jsx — mobile "Boek nu" button (line ~196)**

Find this block in the mobile menu CTAs section:

```jsx
                <Link
                  to="/kamers"
                  className="bg-accent px-6 py-3 text-center font-body text-sm font-semibold text-cream"
                  onClick={nav.toggleMobileMenu}
                >
                  Boek nu
                </Link>
```

Replace `to="/kamers"` with `to="/boeken"`:

```jsx
                <Link
                  to="/boeken"
                  className="bg-accent px-6 py-3 text-center font-body text-sm font-semibold text-cream"
                  onClick={nav.toggleMobileMenu}
                >
                  Boek nu
                </Link>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:5173/boeken` — page should render with header and calendar. Click "Boek nu" in navbar — should navigate to `/boeken`.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/Navbar6.jsx
git commit -m "feat: add /boeken route and update navbar links"
```

---

## Task 9: CTA Button Updates

**Files:**
- Modify: `src/pages/home/components/Cta40.jsx`
- Modify: `src/pages/kamers/components/Cta40.jsx`
- Modify: `src/pages/over-de-kopstoof/components/Cta40.jsx`
- Modify: `src/pages/reviews/components/Cta40.jsx`
- Modify: `src/pages/kamers/components/Pricing18.jsx`

All Cta40.jsx files have a `<Link to="/kamers">` with text "Bekijk beschikbaarheid" — change to `to="/boeken"`.

All Pricing18.jsx "Boeken" `<Link to="/kamers">` buttons — change to `to="/boeken"`.

- [ ] **Step 1: Update home Cta40.jsx**

In `src/pages/home/components/Cta40.jsx`, find:

```jsx
              <Link
                to="/kamers"
                className="inline-flex items-center bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
              >
                Bekijk beschikbaarheid
              </Link>
```

Change `to="/kamers"` to `to="/boeken"`:

```jsx
              <Link
                to="/boeken"
                className="inline-flex items-center bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
              >
                Bekijk beschikbaarheid
              </Link>
```

- [ ] **Step 2: Update kamers Cta40.jsx**

Same change in `src/pages/kamers/components/Cta40.jsx`: `to="/kamers"` → `to="/boeken"` on the "Bekijk beschikbaarheid" link.

- [ ] **Step 3: Update over-de-kopstoof Cta40.jsx**

Same change in `src/pages/over-de-kopstoof/components/Cta40.jsx`.

- [ ] **Step 4: Update reviews Cta40.jsx**

Same change in `src/pages/reviews/components/Cta40.jsx`.

- [ ] **Step 5: Update Pricing18.jsx**

In `src/pages/kamers/components/Pricing18.jsx`, the "Boeken" CTA is inside `.map()`. Find:

```jsx
                <Link
                  to="/kamers"
                  className={`mt-8 block py-4 text-center font-body text-sm font-semibold uppercase tracking-widest transition-colors ${
                    room.featured
                      ? "bg-accent text-cream hover:bg-accent-light"
                      : "border border-primary/30 text-primary hover:border-accent hover:text-accent"
                  }`}
                >
                  Boeken
                </Link>
```

Change `to="/kamers"` to `to="/boeken"`:

```jsx
                <Link
                  to="/boeken"
                  className={`mt-8 block py-4 text-center font-body text-sm font-semibold uppercase tracking-widest transition-colors ${
                    room.featured
                      ? "bg-accent text-cream hover:bg-accent-light"
                      : "border border-primary/30 text-primary hover:border-accent hover:text-accent"
                  }`}
                >
                  Boeken
                </Link>
```

- [ ] **Step 6: Verify all CTAs navigate correctly**

```bash
npm run dev
```

Check: home page CTA, kamers page CTA, kamers pricing "Boeken" buttons, over-de-kopstoof CTA, reviews CTA — all should navigate to `/boeken`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/home/components/Cta40.jsx src/pages/kamers/components/Cta40.jsx src/pages/over-de-kopstoof/components/Cta40.jsx src/pages/reviews/components/Cta40.jsx src/pages/kamers/components/Pricing18.jsx
git commit -m "feat: update all CTA buttons to link to /boeken"
```

---

## Post-implementation checklist

- [ ] Set `BOOKING_ICAL_URL` in Netlify environment variables
- [ ] Set `RESEND_API_KEY` in Netlify environment variables
- [ ] Verify Resend domain `bnbdekopstoof.nl` is verified (green in Resend dashboard)
- [ ] Deploy to Netlify and test the full flow: pick dates → fill form → submit → check inbox
- [ ] Test with a date that IS booked on Booking.com — calendar should block it
