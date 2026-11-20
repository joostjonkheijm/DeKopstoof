/** Basic HTML escaping to prevent XSS in email body */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Returns true if [checkIn, checkOut) overlaps any booked range [start, end) */
export function overlaps(checkIn, checkOut, bookedRanges) {
  return bookedRanges.some(
    ({ start, end }) => checkIn < end && checkOut > start
  );
}

function fail(error) {
  return { ok: false, status: 400, error };
}

/** Validate a parsed inquiry body. Error messages are shown to guests (Dutch). */
export function validateInquiry(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail("Ongeldige aanvraag");
  }

  const { name, email, checkIn, checkOut, phone = "", message = "" } = body;

  if (!name || !email || !checkIn || !checkOut) {
    return fail("Verplichte velden ontbreken");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Ongeldig e-mailadres");
  }

  if (checkOut <= checkIn) {
    return fail("Check-out moet na check-in zijn");
  }

  return { ok: true, data: { name, email, checkIn, checkOut, phone, message } };
}

/** Build the notification email (subject and HTML) for a valid inquiry */
export function buildInquiryEmail({ name, email, checkIn, checkOut, phone, message }) {
  const nights = Math.round(
    (new Date(checkOut) - new Date(checkIn)) / 86_400_000
  );

  const html = `
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

  return {
    subject: `Boekingsaanvraag: ${checkIn} – ${checkOut} (${nights} nacht${nights !== 1 ? "en" : ""})`,
    html,
  };
}
