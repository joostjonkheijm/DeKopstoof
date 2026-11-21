# De Kopstoof — website

React/Vite-site voor B&B De Kopstoof, gehost op Cloudflare Pages. De eigenaar beheert
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
| `npm test` | Alle Vitest-tests: `server/`, `functions/`, `cms-auth/` en `src/`. |
| `npm run cms-auth:dev` | De CMS-loginworker lokaal draaien (`wrangler dev`). |
| `npm run cms-auth:deploy` | De CMS-loginworker naar Cloudflare deployen. |

## Hoe het in elkaar zit

```
src/content/*.json          content, één bestand per pagina + site.json
public/admin/config.yml     CMS-velden; spiegelt de JSON één op één
public/admin/index.html     laadt Decap (vastgepinde versie) van de CDN
public/images/uploads/      alle contentfoto's; ook de uploadmap van het CMS
src/lib/content.js          helpers: list(), section(), links, stepNumber()
src/lib/image.js            Cloudflare Image Transformations-URL's en srcset
functions/api/              Pages Functions: availability.js en send-inquiry.js
server/                     gedeelde code voor de functions
cms-auth/                   Cloudflare Worker voor de CMS-login
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

De eigenaar logt in met een code per e-mail. Er is geen wachtwoord. De keten:

1. Decap opent een popup op `https://cms.bnbdekopstoof.nl/auth`.
2. `/auth` staat achter Cloudflare Access (One-time PIN per e-mail).
3. De worker in `cms-auth/` controleert de Access-JWT en de e-mail-allowlist en
   geeft Decap een sessietoken (HMAC-ondertekend, 8 uur geldig).
4. Decap praat daarna met `https://cms.bnbdekopstoof.nl/github/*`. Dat pad staat
   niet achter Access. De worker controleert bij elk verzoek het sessietoken en
   opnieuw `ALLOWED_EMAILS`, wisselt het in voor een installatietoken van een
   GitHub App (alleen voor DeKopstoof, alleen *Contents* en *Metadata*) en stuurt
   alleen de methoden en paden door die Decap nodig heeft. Commits komen van
   `<app>[bot]`.

**Wat het CMS mag wijzigen.** Alleen content en foto's: bestanden onder
`src/content/` en `public/images/uploads/`, op `master` (`GITHUB_BRANCH`), zonder
force-push. Een commit met andere paden weigert de worker met 403. Codewijzigingen
(ook aan `public/admin/` en `functions/`) gaan via git.

De Decap-config is het `backend:`-blok bovenaan `public/admin/config.yml`:
`name: github`, `base_url`, `auth_endpoint: auth` en `api_root` naar
`…/github`.

De worker draait alleen op het eigen domein (`workers_dev = false`,
`preview_urls = false`). Access op een `workers.dev`-adres dekt altijd de hele
worker; daarom werkt het pad `auth` daar niet.

**Lokaal testen:** `local_backend: true` staat in `config.yml`. Draai
`npm run cms` naast `npm run dev` en open `http://localhost:5173/admin/`. Dat
vraagt geen login. De worker zelf draai je met `npm run cms-auth:dev`; die leest
de secrets uit `cms-auth/.dev.vars` (staat in `.gitignore`), één `NAAM=waarde`
per regel voor `SESSION_SECRET`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`,
`GITHUB_INSTALLATION_ID` en `ALLOWED_EMAILS`.

### Noodstop

- **Iedereen direct buitensluiten:** roteer `SESSION_SECRET`
  (`npx wrangler secret put SESSION_SECRET --config cms-auth/wrangler.toml`
  met een nieuwe waarde) en/of zet de installatie van de GitHub App op
  *Suspend* (GitHub → Settings → Applications). Alle sessies zijn dan ongeldig.
- **Eén persoon verwijderen:** haal het adres uit `ALLOWED_EMAILS` (secret
  opnieuw zetten) en uit de Access-policy. Dat werkt direct, ook voor een
  sessie die nog loopt.

## Foto's

Uploads tot 20 MB zijn toegestaan (`max_file_size` op het fotoveld in
`config.yml`; Cloudflare Pages weigert bestanden boven 25 MiB en dan faalt elke
deploy). Bezoekers krijgen ze nooit op volle grootte. `ContentImage` maakt een
`srcset` (480–2000 px) via Cloudflare Image Transformations
(`/cdn-cgi/image/width=…,quality=75,format=auto,onerror=redirect/<pad>`), dat
verkleint en AVIF/WebP serveert. Mislukt een transformatie, dan krijgt de browser
het origineel. Alle foto's laden lazy, behalve de eerste van
elke pagina (`priority`).

- Het staat aan met `VITE_IMAGE_CDN=on`, alleen gezet in de Pages-omgeving
  Production. `/cdn-cgi/image` werkt niet op `*.pages.dev`, dus previews en
  lokale dev (`npm run dev`, `vite preview`) laden de originelen.
- Geef bij een nieuwe plek een passende `sizes` mee aan `ContentImage`; de
  standaard is "halve breedte op desktop, volle breedte op mobiel".

## Routing op Cloudflare Pages

Er is geen redirect-bestand. Pages valt zelf terug op `index.html` voor paden
zonder bestand (er is geen `404.html`). Bestaande bestanden gaan voor, dus
`/admin/` en `/images/uploads/*` worden gewoon geserveerd. `/api/*` komt uit
`functions/api/`.

De functions lokaal testen:

```bash
npm run build && npx wrangler pages dev dist --binding BOOKING_ICAL_URL=<ical-url>
```

## Eenmalige inrichting Cloudflare

Doe dit in volgorde. Geen echte waarden in de repo; alles hieronder is een
placeholder.

1. **DNS.** Zone `bnbdekopstoof.nl` toevoegen in Cloudflare (gratis plan).
   Nameservers bij Hostnet omzetten. Controle: `dig +short NS bnbdekopstoof.nl`
   toont `*.ns.cloudflare.com`. Verwijder de geparkeerde A-records.
2. **Mail.** Resend → Domains: domein (opnieuw) toevoegen en de DNS-records in
   Cloudflare zetten (DNS only, niet proxied). Email Routing aanzetten voor
   `info@bnbdekopstoof.nl`. Houd `_dmarc` op `p=reject`.
3. **Pages.** Workers & Pages → Create → Pages → Connect to Git → `DeKopstoof`.
   Production branch `master`, build `npm run build`, output `dist`. Env vars
   volgens de tabel hieronder. Het eigen domein komt pas in stap 8.
4. **Image Transformations.** Zone → Images → Transformations → aanzetten.
5. **GitHub App.** Geen webhook; rechten *Contents: Read and write* en
   *Metadata: Read-only*; installeren op **Only select repositories →
   DeKopstoof**. De worker vraagt elk token alleen voor DeKopstoof met die twee
   rechten aan; de installatie beperkt het daarnaast. Noteer App ID en
   Installation ID (staat in de installatie-URL). Genereer een private key en
   zet hem om naar PKCS#8:
   ```bash
   openssl pkcs8 -topk8 -nocrypt -in <app>.private-key.pem -out key-pkcs8.pem
   ```
6. **Access.** Zero Trust (gratis) → teamnaam kiezen → Settings →
   Authentication → One-time PIN aan. Access → Applications → Self-hosted met
   public hostname `cms.bnbdekopstoof.nl` en pad `auth`. Policy *Allow*, Include
   → Emails: eigenaar en beheerder. Zet team domain en Application Audience
   (AUD) in `[vars]` van `cms-auth/wrangler.toml` en commit.
7. **Worker.**
   ```bash
   npx wrangler login
   npx wrangler secret put SESSION_SECRET --config cms-auth/wrangler.toml
   ```
   Herhaal voor de andere secrets uit de tabel (`GITHUB_APP_PRIVATE_KEY` met
   `< key-pkcs8.pem`), daarna `npm run cms-auth:deploy`. Plak secrets in een
   Linux-terminal met **Ctrl+Shift+V**; Ctrl+V voegt een stuurteken toe.
   Controle:
   ```bash
   curl -sI https://cms.bnbdekopstoof.nl/auth
   # 302 naar *.cloudflareaccess.com
   curl -s -o /dev/null -w '%{http_code}\n' -H "Origin: https://bnbdekopstoof.nl" \
     https://cms.bnbdekopstoof.nl/github/user
   # 401 (zonder Origin-header geeft de worker 403)
   ```
   Verwijder daarna de lokale `.pem`-bestanden.
8. **Live zetten.** Merge `feat/cloudflare` naar `master`; Pages bouwt dan de
   productieversie. Voeg pas daarna `bnbdekopstoof.nl` en `www` toe onder Pages →
   Custom domains, en een Redirect Rule `www.bnbdekopstoof.nl/*` →
   `https://bnbdekopstoof.nl/${1}` (301). Pas na de merge, anders serveert het
   domein nog de oude Netlify-versie.

### Variabelen en secrets

| Waar | Naam | Soort | Waarde |
|---|---|---|---|
| Pages Production | `BOOKING_ICAL_URL` | env var | iCal-URL van het boekingsplatform |
| Pages Production | `RESEND_API_KEY` | env var (encrypted) | Resend API-key |
| Pages Production | `VITE_IMAGE_CDN` | env var | `on` |
| Pages Preview | `BOOKING_ICAL_URL` | env var | zelfde als Production |
| Pages Preview | `RESEND_API_KEY` | env var (encrypted) | zelfde als Production |
| Worker | `ALLOWED_ORIGINS` | var in `wrangler.toml` | toegestane origins van het CMS |
| Worker | `GITHUB_REPO` | var in `wrangler.toml` | `<eigenaar>/<repo>` |
| Worker | `GITHUB_BRANCH` | var in `wrangler.toml` | `master`: de enige branch die het CMS mag bijwerken (hoofdlettergevoelig) |
| Worker | `ACCESS_TEAM_DOMAIN` | var in `wrangler.toml` | `<team>.cloudflareaccess.com` |
| Worker | `ACCESS_AUD` | var in `wrangler.toml` | AUD-tag van de Access-app |
| Worker | `SESSION_SECRET` | secret | `openssl rand -base64 32` |
| Worker | `GITHUB_APP_ID` | secret | App ID |
| Worker | `GITHUB_APP_PRIVATE_KEY` | secret | PKCS#8-key (zie stap 5) |
| Worker | `GITHUB_INSTALLATION_ID` | secret | Installation ID |
| Worker | `ALLOWED_EMAILS` | secret | komma-gescheiden; gelijk aan de Access-policy |

`BOOKING_ICAL_URL`: kopieer hem uit de oude Netlify-variabelen (de echte waarde
staat niet in de repo).

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
