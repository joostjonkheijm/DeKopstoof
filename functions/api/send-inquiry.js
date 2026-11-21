import { parseIcal } from "../../server/parseIcal.js";
import { validateInquiry, overlaps, buildInquiryEmail } from "../../server/inquiry.js";
import { sendEmail } from "../../server/resend.js";

const json = (data, status) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Any method other than POST (onRequestPost takes precedence for POST)
export function onRequest() {
  return new Response("Method Not Allowed", { status: 405 });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ongeldige aanvraag" }, 400);
  }

  const result = validateInquiry(body);
  if (!result.ok) {
    return json({ error: result.error }, result.status);
  }
  const { data } = result;

  // Re-check availability to prevent race condition
  try {
    const icalResponse = await fetch(env.BOOKING_ICAL_URL);
    if (icalResponse.ok) {
      const bookedRanges = parseIcal(await icalResponse.text());
      if (overlaps(data.checkIn, data.checkOut, bookedRanges)) {
        return json(
          { error: "Deze datums zijn zojuist gereserveerd. Kies andere datums." },
          409
        );
      }
    }
    // If the iCal fetch fails here, proceed anyway: don't block the inquiry
  } catch {
    // Proceed
  }

  const { subject, html } = buildInquiryEmail(data);

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: "De Kopstoof <noreply@bnbdekopstoof.nl>",
      to: "info@bnbdekopstoof.nl",
      reply_to: data.email,
      subject,
      html,
    });
    return json({ success: true }, 200);
  } catch (err) {
    console.error("send-inquiry email error:", err.message);
    return json(
      { error: "E-mail verzenden mislukt. Probeer het opnieuw of neem direct contact op." },
      500
    );
  }
}
