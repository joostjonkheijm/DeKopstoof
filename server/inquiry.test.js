import { describe, it, expect } from "vitest";
import { validateInquiry, overlaps, buildInquiryEmail } from "./inquiry.js";

describe("inquiry", () => {
  it("rejects missing fields", () =>
    expect(validateInquiry({ name: "A" })).toEqual({ ok: false, status: 400, error: "Verplichte velden ontbreken" }));
  it("rejects bad email", () =>
    expect(validateInquiry({ name: "A", email: "x", checkIn: "2026-12-01", checkOut: "2026-12-03" }).error).toBe("Ongeldig e-mailadres"));
  it("rejects checkOut <= checkIn", () =>
    expect(validateInquiry({ name: "A", email: "a@b.nl", checkIn: "2026-12-03", checkOut: "2026-12-03" }).error).toBe("Check-out moet na check-in zijn"));
  it("rejects non-object body", () => expect(validateInquiry(null).error).toBe("Ongeldige aanvraag"));
  it("defaults phone and message to empty strings", () =>
    expect(validateInquiry({ name: "A", email: "a@b.nl", checkIn: "2026-12-01", checkOut: "2026-12-03" }).data).toMatchObject({ phone: "", message: "" }));
  it("overlaps is half-open", () => {
    expect(overlaps("2026-07-14", "2026-07-16", [{ start: "2026-07-10", end: "2026-07-14" }])).toBe(false);
    expect(overlaps("2026-07-13", "2026-07-16", [{ start: "2026-07-10", end: "2026-07-14" }])).toBe(true);
  });
  it("email escapes html and pluralises nights", () => {
    const { subject, html } = buildInquiryEmail({ name: "<b>", email: "a@b.nl", checkIn: "2026-12-01", checkOut: "2026-12-02", phone: "", message: "" });
    expect(html).toContain("&lt;b&gt;");
    expect(subject).toBe("Boekingsaanvraag: 2026-12-01 – 2026-12-02 (1 nacht)");
  });
});
