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
      <div className="border border-accent/30 bg-accent/10 p-8 text-center">
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
        <p className="font-body text-sm text-accent">{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Verzenden..." : "Stuur aanvraag"}
      </button>

    </form>
  );
}
