# De Kopstoof — website

React/Vite-site voor B&B De Kopstoof, gehost op Netlify. De eigenaar beheert
teksten en foto's via Decap CMS op `/admin/`. Er is geen database: alle content
staat als JSON in deze repo en elke wijziging in het CMS is een Git-commit.

Handleiding voor de eigenaar: [docs/handleiding-eigenaar.md](docs/handleiding-eigenaar.md).

## Commando's

| Commando | Doet |
|---|---|
| `npm install` | Installeert alles. `.npmrc` zet `legacy-peer-deps`, nodig omdat relume-ui React 18 verwacht. |
| `npm run dev` | Site lokaal op `http://localhost:5173`. |
| `npm run cms` | Lokale CMS-backend (decap-server). Draai dit naast `npm run dev` en open `http://localhost:5173/admin/`. Geen login; schrijft direct naar je werkmap. |
| `npm run build` | Productiebuild in `dist/`. |
| `npm run check:cms` | Controleert dat `config.yml` en de content-JSON hetzelfde model beschrijven. |
| `npm test` | Unit-tests van de Netlify-functions. |

## Hoe het in elkaar zit

```
src/content/*.json          content, één bestand per pagina + site.json
public/admin/config.yml     CMS-velden; spiegelt de JSON één op één
public/admin/index.html     laadt Decap (vastgepinde versie) van de CDN
public/images/uploads/      alle contentfoto's; ook de uploadmap van het CMS
src/lib/content.js          helpers: list(), section(), links, stepNumber()
src/lib/image.js            Netlify Image CDN-URL's en srcset
src/components/             gedeeld: Footer2, Cta40, ContactDetails, ContentImage, Markdown
src/pages/<pagina>/         componenten per pagina; lezen hun eigen JSON
```

## Contentmodel

| Bestand | Pagina | Secties |
|---|---|---|
| `site.json` | gedeeld | `naam`, `contact`, `contactblok`, `footer`, `cta`, `platforms` |
| `home.json` | `/` | `hero`, `redenen`, `inbegrepen`, `quote`, `galerij`, `extras`, `stappen`, `verhaal`, `faq`, `contact` |
| `kamers.json` | `/kamers` | `header`, `inbegrepen`, `galerij`, `kamer`, `quote`, `tarief`, `faq` |
| `omgeving.json` | `/omgeving` | `header`, `activiteiten`, `fietsen`, `eten`, `steden`, `galerij`, `faq`, `contact` |
| `over-de-kopstoof.json` | `/over-de-kopstoof` | `header`, `verhaal`, `welkom`, `team`, `galerij`, `beoordelingen`, `cijfers`, `contact` |
| `reviews.json` | `/reviews` | `header`, `quote`, `reviews`, `beoordelingen`, `faq` |
| `boeken.json` | `/boeken` | `header`, `kalender`, `formulier`, `contact_regel` |

De exacte velden per sectie staan in `public/admin/config.yml`; dat bestand is
de bron van waarheid voor het model.

### Veldtypen

| Type | In JSON | Decap-widget | In de component |
|---|---|---|---|
| Korte tekst | string | `string` | `{c.veld}` |
| Lange tekst zonder opmaak | string | `text` | `{c.veld}` |
| Tekst met vet, schuin, links | markdown-string | `markdown` | `<Markdown className="…">{c.veld}</Markdown>` |
| Foto | `{ "src": "/images/uploads/x.jpg", "alt": "…" }` | `object` met `image` + `string` | `<ContentImage image={c.afbeelding} />` |
| Lijst | array van objecten of strings | `list` | `list(c.items).map(…)` |

Markdown wordt alleen gebruikt voor FAQ-antwoorden en de lange alinea's op
De Kamer, Omgeving en Over De Kopstoof.

### Afspraken

- **Linkdoelen staan in code, knopteksten in content.** Menu-items en pagina's
  zijn bewust niet bewerkbaar. Het model blokkeert dat later niet: een
  `site.menu`-lijst of een extra pagina-JSON kan erbij zonder iets te breken.
- **Telefoon en WhatsApp** komen uit `site.contact.telefoon_internationaal`.
  `links.phone` en `links.whatsapp` in `src/lib/content.js` leiden daar de
  `tel:`- en `wa.me`-links van af.
- **Componenten crashen niet op lege content.** Gebruik altijd `section()` voor
  een object en `list()` voor een array. `ContentImage` en `Markdown` renderen
  niets als hun waarde ontbreekt.
- **Nummers en sterren** (stap "01", vijf sterren) maakt de code zelf.

## Een nieuw bewerkbaar veld toevoegen

Voorbeeld: een ondertitel in de header van `/kamers`.

1. **JSON** — voeg de sleutel met een beginwaarde toe aan
   `src/content/kamers.json`:
   ```json
   "header": { "ondertitel": "Slapen in de polder", … }
   ```
2. **CMS** — voeg het veld toe in `public/admin/config.yml`. De header van
   De Kamer gebruikt de gedeelde lijst `&header_fields`; die geldt voor vier
   pagina's. Wil je het veld alleen hier, vervang dan `fields: *header_fields`
   door een eigen lijst:
   ```yaml
   fields:
     - *overline
     - *titel
     - { label: Ondertitel, name: ondertitel, widget: string, required: false, hint: "Korte regel onder de titel." }
     - *intro
     - *knop
     - *whatsapp_knop
     - *foto
   ```
3. **Component** — toon het veld in
   `src/pages/kamers/components/Header65.jsx`:
   ```jsx
   {c.ondertitel && <p className="…">{c.ondertitel}</p>}
   ```
4. **Controle** — `npm run check:cms` moet slagen. Test daarna in het lokale
   CMS (`npm run cms` + `npm run dev`).

Een nieuw veld in een gedeelde lijst (`*header_fields`, `*faq_fields`,
`*galerij_fields`, …) moet in de JSON van elke pagina die de lijst gebruikt;
`check:cms` meldt welke ontbreken.

Een nieuw **lijst-item** of een nieuwe **foto** vraagt geen code: dat doet de
eigenaar in het CMS.

## Authenticatie

De backend staat in één blok bovenaan `public/admin/config.yml`:

```yaml
backend:
  name: git-gateway
  branch: master
```

`branch` moet de branch zijn waar Netlify vanaf deployt.

### Eenmalige inrichting (git-gateway)

1. Push de repo naar GitHub en koppel hem in Netlify (continuous deployment).
2. Netlify → Identity: inschakelen, registratie op **Invite only**.
3. Netlify → Identity → Services: **Git Gateway** inschakelen.
4. Nodig de eigenaar uit via Identity → Invite users.

De uitnodigingsmail linkt naar de homepage met een token in de URL. Het script
in `index.html` stuurt dat door naar `/admin/`, waar de eigenaar een wachtwoord
kiest.

Netlify heeft Identity als verouderd aangemerkt. Het werkt nog, maar controleer
de actuele status voordat je het inricht.

### Wisselen naar een andere backend

Vervang alleen het `backend:`-blok. Content, collecties en componenten blijven
gelijk. Het Identity-script in `public/admin/index.html` mag blijven staan; het
doet niets bij een andere backend.

**GitHub-login** — de eigenaar heeft dan een GitHub-account met schrijfrechten
op de repo nodig:

```yaml
backend:
  name: github
  repo: <eigenaar>/<repo>
  branch: master
```

Op Netlify regel je de OAuth-koppeling onder Site configuration → Access &
security → OAuth. Buiten Netlify heb je een eigen OAuth-proxy nodig en zet je
`base_url` en `auth_endpoint` erbij.

**Een gehoste gateway** (bijvoorbeeld DecapBridge) — login met e-mail en
wachtwoord, zonder GitHub-account voor de eigenaar. De dienst levert het
`backend:`-blok dat je hier plakt.

Geen van deze opties vraagt secrets in de repo.

## Foto's

Uploads van 5–10 MB zijn toegestaan; bezoekers krijgen ze nooit op volle
grootte. `ContentImage` maakt een `srcset` (480–2000 px) via Netlify Image CDN,
dat verkleint en AVIF/WebP serveert. Alle foto's laden lazy, behalve de eerste
van elke pagina (`priority`).

- De CDN staat aan met `VITE_IMAGE_CDN=on`, gezet in `netlify.toml`.
- Lokaal (`npm run dev`, `vite preview`) laden de originelen.
- De CDN lokaal testen: `VITE_IMAGE_CDN=on npm run build`, daarna
  `netlify dev --dir dist`.
- Geef bij een nieuwe plek een passende `sizes` mee aan `ContentImage`; de
  standaard is "halve breedte op desktop, volle breedte op mobiel".

## Routing op Netlify

`netlify.toml` bevat `/api/*` → functions en een SPA-fallback
`/* → /index.html` (status 200, zonder `force`). Bestaande bestanden gaan voor,
dus `/admin/` en `/images/uploads/*` worden niet naar de app herschreven.

## Visuele controle

```bash
npm run build && npx vite preview --port 4173 &
node scripts/screenshots.mjs screenshots/voor
# … wijziging maken, opnieuw builden …
node scripts/screenshots.mjs screenshots/na
node scripts/compare-screenshots.mjs screenshots/voor screenshots/na
```

Maakt volledige screenshots van alle zes pagina's op desktop en mobiel en
vergelijkt ze pixel voor pixel. Tot ongeveer 100 px verschil per pagina is ruis.
`node scripts/smoke-empty-content.mjs` controleert dat elke pagina zonder
JavaScript-fout rendert.

## Decap bijwerken

De versie staat vast in `public/admin/index.html` (`decap-cms@3.17.3`). Verhoog
het nummer bewust en test daarna het lokale CMS: laden, een veld opslaan en een
foto uploaden.
