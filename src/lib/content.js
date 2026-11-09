// Helpers for reading CMS-managed content from src/content/*.json.
// Content is edited by a non-technical owner, so every helper tolerates
// missing or empty values instead of throwing.
import site from "../content/site.json";

/** Always returns an array, so `.map` is safe on missing list fields. */
export const list = (value) => (Array.isArray(value) ? value : []);

/** Always returns an object, so property access is safe on missing sections. */
export const section = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

/** "01", "02", ... for numbered cards and steps. */
export const stepNumber = (index) => String(index + 1).padStart(2, "0");

const contact = section(site.contact);
const phoneDigits = String(contact.telefoon_internationaal ?? "").replace(/\D/g, "");

/** Contact links derived from site.json, so numbers live in one place. */
export const links = {
  email: contact.email ? `mailto:${contact.email}` : undefined,
  phone: phoneDigits ? `tel:+${phoneDigits}` : undefined,
  whatsapp: phoneDigits ? `https://wa.me/${phoneDigits}` : undefined,
};

export { site };
