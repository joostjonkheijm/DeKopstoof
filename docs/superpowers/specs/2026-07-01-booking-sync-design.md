# Design: Booking.com Calendersync + Aanvraagformulier

**Datum:** 2026-07-01  
**Status:** Goedgekeurd  

---

## Doel

Gasten kunnen rechtstreeks een verblijf aanvragen op de website zonder te boeken op een datum die al gereserveerd staat via Booking.com. De eigenaar bevestigt aanvragen handmatig per e-mail.

---

## Scope

- Booking.com iCal-feed ophalen en bezette datums tonen in kalender op website
- Aanvraagformulier met datumkeuze en contactgegevens
- E-mailnotificatie naar eigenaar bij nieuwe aanvraag
- Geen betalingsverwerking (toekomstige uitbreiding)
- 1 kamer op Booking.com (meer kamers: toekomstige uitbreiding)

---

## Architectuur

```
Booking.com iCal feed
        ↓
netlify/functions/availability.js   ← fetch + parse iCal → JSON
        ↓
React frontend (/boeken pagina)
  ├── BookingCalendar (bezette datums geblokkeerd)
  └── InquiryForm (naam, e-mail, telefoon, opmerkingen)
        ↓
netlify/functions/send-inquiry.js   ← valideer + stuur e-mail via Resend
        ↓
info@bnbdekopstoof.nl
```

---

## Nieuwe bestanden

| Bestand | Doel |
|---|---|
| `netlify/functions/availability.js` | iCal proxy — haalt bezette datums op |
| `netlify/functions/send-inquiry.js` | Verzendt aanvraag-e-mail via Resend |
| `netlify.toml` | Netlify config: functions directory, redirects |
| `src/pages/boeken/index.jsx` | Boekingspagina |
| `src/pages/boeken/components/BookingCalendar.jsx` | Kalender component |
| `src/pages/boeken/components/InquiryForm.jsx` | Aanvraagformulier component |

## Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| `src/App.jsx` | Route `/boeken` toevoegen |
| `src/components/Navbar6.jsx` | "Boeken"-link toevoegen |
| `src/pages/home/components/Cta40.jsx` | CTA-knop → `/boeken` |
| `src/pages/kamers/components/Cta40.jsx` | CTA-knop → `/boeken` |
| `src/pages/reviews/components/Cta40.jsx` | CTA-knop → `/boeken` |
| `src/pages/over-de-kopstoof/components/Cta40.jsx` | CTA-knop → `/boeken` |
| `src/pages/kamers/components/Pricing18.jsx` | "Boeken"-knop per kamer → `/boeken` |

---

## Sectie 1: `availability.js` — iCal Proxy

**Endpoint:** `GET /.netlify/functions/availability`

**Flow:**
1. Fetch `process.env.BOOKING_ICAL_URL` (server-side, nooit blootgesteld aan frontend)
2. Parse raw `.ics` tekst: extract alle `VEVENT` blokken
3. Per event: lees `DTSTART` en `DTEND`, converteer naar `YYYY-MM-DD`
4. Return JSON: `{ bookedRanges: [{ start, end }, ...] }`

**Response headers:**
- `Cache-Control: public, max-age=3600` — frontend herlaadt max 1x per uur

**Beveiliging:**
- iCal-URL nooit naar frontend (bevat persoonlijke gast-info van Booking.com)
- Alleen bezette datumreeksen worden teruggestuurd

**Environment variable:**
```
BOOKING_ICAL_URL=https://admin.booking.com/hotel/hoteladmin/ical.html?...
```

---

## Sectie 2: `send-inquiry.js` — E-mail Verzender

**Endpoint:** `POST /.netlify/functions/send-inquiry`

**Request body:**
```json
{
  "name": "string (verplicht)",
  "email": "string (verplicht)",
  "phone": "string (optioneel)",
  "checkIn": "YYYY-MM-DD (verplicht)",
  "checkOut": "YYYY-MM-DD (verplicht)",
  "message": "string (optioneel)"
}
```

**Flow:**
1. Valideer verplichte velden aanwezig
2. Valideer `checkOut > checkIn`
3. Herlaad iCal-feed — controleer of gevraagde datums nog vrij zijn (race condition preventie)
4. Stuur e-mail via Resend naar `info@bnbdekopstoof.nl`
5. Return `{ success: true }` of `{ error: "..." }`

**E-mail inhoud:**
- Naam, e-mail, telefoon
- Check-in / check-out + aantal nachten
- Opmerking gast
- `Reply-To`: e-mailadres gast (eigenaar kan direct antwoorden)

**Environment variable:**
```
RESEND_API_KEY=re_...
```

**Geen bevestigingsmail naar gast** — eigenaar bevestigt handmatig.

---

## Sectie 3: Frontend — Boekingspagina (`/boeken`)

### Pagina-structuur

1. **Header** — "Reserveer direct" + korte intro tekst
2. **BookingCalendar** — datumkiezer
3. **InquiryForm** — verschijnt na datumselectie
4. **Footer** (bestaand component)

### BookingCalendar

- **Library:** `react-day-picker` v9 (lichtgewicht, Tailwind-vriendelijk)
- Fetch `/.netlify/functions/availability` bij laden
- Bezette datums: visueel geblokkeerd (grijs, niet klikbaar)
- Verleden datums + vandaag: geblokkeerd
- Selectie: check-in eerst, daarna check-out (minimum 1 nacht)
- Gekozen range: gemarkeerd met `accent`-kleur

### InquiryForm

Verschijnt zodra gast check-in én check-out heeft gekozen.

**Velden:**
- Naam (verplicht)
- E-mail (verplicht)
- Telefoon (optioneel)
- Opmerking (optioneel)
- Samenvatting gekozen datums (readonly)
- Submit-knop "Stuur aanvraag"

### UI-states

| State | Gedrag |
|---|---|
| Laden beschikbaarheid | Spinner in kalender |
| Fout bij laden | "Beschikbaarheid tijdelijk niet beschikbaar — bel of mail ons direct" |
| Verzenden | Submit-knop disabled + spinner |
| Succes | "Aanvraag ontvangen! We nemen binnen 24 uur contact op." |
| Fout bij verzenden | Inline foutmelding onder formulier |
| Datums intussen bezet | "Deze datums zijn zojuist gereserveerd. Kies andere datums." |

### Styling

Volgt bestaande Tailwind design tokens: `primary`, `accent`, `cream`, `surface`, `background`. Geen nieuwe kleuren. Consistent met rest van site.

---

## Dependencies

| Package | Versie | Doel |
|---|---|---|
| `react-day-picker` | ^9 | Kalender UI |
| `resend` | ^4 | E-mail via Netlify Function |

---

## Toekomstige uitbreidingen (buiten scope)

- Meerdere kamers met eigen iCal-feeds
- Automatische bevestigingsmail naar gast
- Betaalintegratie (Stripe / iDeal)
- Push bezette datums van website terug naar Booking.com (two-way sync)
