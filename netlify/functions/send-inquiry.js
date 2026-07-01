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
    if (!event.body) throw new Error("empty body");
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Ongeldige aanvraag" }),
    };
  }

  const { name, email, checkIn, checkOut, phone = "", message = "" } = body;

  // Validate required fields and basic email format
  if (!name || !email || !checkIn || !checkOut) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Verplichte velden ontbreken" }),
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Ongeldig e-mailadres" }),
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
