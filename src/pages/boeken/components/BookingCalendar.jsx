import React, { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { nl } from "date-fns/locale";
import "react-day-picker/style.css";

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

/**
 * Returns the ISO date string of the first booked range start that is strictly
 * after `fromStr`. Used to prevent selecting a range that spans booked dates.
 * Checkout ON that start date is valid (iCal DTEND is exclusive), so we allow
 * selecting it as `to` — only dates strictly beyond it are blocked.
 */
function getFirstBookedAfter(fromStr, bookedRanges) {
  let earliest = null;
  for (const { start } of bookedRanges) {
    if (start > fromStr && (earliest === null || start < earliest)) {
      earliest = start;
    }
  }
  return earliest;
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

  const disabled = [
    { before: today },
    (date) => isDateBooked(date, bookedRanges),
  ];

  if (range?.from && !range?.to) {
    const wall = getFirstBookedAfter(toLocalIsoDate(range.from), bookedRanges);
    if (wall) {
      disabled.push((date) => toLocalIsoDate(date) > wall);
    }
  }

  return (
    <div className="booking-calendar">
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        disabled={disabled}
        numberOfMonths={2}
        locale={nl}
        showOutsideDays={false}
      />
    </div>
  );
}
