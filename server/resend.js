/** Send an email through the Resend REST API. Throws on a non-2xx response. */
export async function sendEmail(apiKey, payload, fetchFn = fetch) {
  const response = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Resend responded with HTTP ${response.status}`);
  }
}
