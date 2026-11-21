# Verhuizing naar Cloudflare Pages — ontwerp

Datum: 2026-11-20
Status: concept, wacht op goedkeuring

## Waarom

De site loopt tegen de limieten van het Netlify-abonnement aan. Elke wijziging
die de eigenaar in het CMS opslaat is een commit, en elke commit start een
build. De site verhuist daarom naar Cloudflare Pages, op het eigen domein
**bnbdekopstoof.nl**. De eigenaar moet veilig kunnen blijven inloggen in Decap
CMS, zonder GitHub-account.

## Doelen

- Site, functions en foto's draaien op Cloudflare, en Netlify is niet meer nodig.
- De eigenaar logt in met e-mailadres plus een eenmalige code
  (Cloudflare Access). Geen wachtwoord, geen GitHub-account.
- Het GitHub-token met schrijfrechten komt nooit in de browser of in de repo.
- Bezoekers merken niets: zelfde pagina's, zelfde `/api/*`-adressen, foto's
  nog steeds verkleind en in WebP/AVIF.
- De site komt op `bnbdekopstoof.nl`, en `www` stuurt door naar het hoofddomein.

## Niet-doelen

- Geen wijzigingen aan het ontwerp, de content of de CMS-collecties.
- Geen ander CMS (Sveltia e.d.): Decap blijft.
- dekopstoof.nl en de MyOnlineStore-winkel daarop blijven ongemoeid.

## Anti-doelen (mislukt, ook als het technisch werkt)

- De eigenaar heeft een GitHub-account nodig, of krijgt een token te zien.
- Iemand anders dan de toegestane e-mailadressen kan via de worker naar de
  repo schrijven.
- De worker kan meer dan alleen deze ene repo aanpassen.
- De oude Netlify-site gaat uit voordat de nieuwe aantoonbaar werkt.

## Randvoorwaarden

- Cloudflare free plan: Pages (500 builds/maand), Workers free, Zero Trust
  free (tot 50 gebruikers), Image Transformations (5.000 unieke
  verkleiningen/maand gratis).
- bnbdekopstoof.nl staat nu bij Hostnet (nameservers `ns01/ns02.hostnet.nl`),
  parkeer-IP `91.184.0.200`, geen MX, geen Resend-records, wel
  `_dmarc` met `p=reject`. Overzetten naar Cloudflare doet Joost bij Hostnet
  (nameservers wijzigen).
- Repo: `joostjonkheijm/DeKopstoof`, branch `master`.
- Decap staat vast op 3.17.3 (`public/admin/index.html`).

## Aanpakken (CMS-login)

| | Aanpak | Afweging | Besluit |
|---|---|---|---|
| A | DecapBridge (gehoste gateway) | Minste werk, wel e-mail + wachtwoord; externe partij heeft schrijftoegang tot de repo | Niet gekozen |
| **B** | **Eigen worker + Cloudflare Access** | Code per mail, token blijft in de worker, alles bij Cloudflare. Wel eigen code, en Decap via een API-proxy is niet beproefd → eerst een proef | **Gekozen door Joost** |
| C | Eigen worker met eigen wachtwoord | Zelf login, bescherming tegen raden en reset bouwen: meer risico op precies het gevoelige deel | Afgevallen |
| — | Klassieke GitHub-OAuth-worker | Eigenaar heeft geen GitHub-account | Afgevallen |

## Ontwerp

### 1. Hosting: Cloudflare Pages

- Pages-project gekoppeld aan GitHub, productie-branch `master`. Build
  `npm run build`, output `dist`.
- Pages valt zelf terug op `index.html` als er geen `404.html` is, dus de
  SPA-fallback werkt zonder regels. Bestanden die bestaan gaan voor, zoals
  `/admin/` en `/images/uploads/*`.
- `netlify.toml` en de map `netlify/` verdwijnen (de functions verhuizen, zie 2).
- Custom domain `bnbdekopstoof.nl`. `www.bnbdekopstoof.nl` krijgt een 301 naar
  het hoofddomein (Redirect Rule op de zone).

### 2. Functions → Pages Functions

- `netlify/functions/availability.js` → `functions/api/availability.js`
  (`onRequestGet`), en `send-inquiry.js` → `functions/api/send-inquiry.js`
  (`onRequestPost`). De adressen `/api/availability` en `/api/send-inquiry`
  blijven gelijk, dus de frontend verandert niet.
- ESM, `context.env.BOOKING_ICAL_URL` / `context.env.RESEND_API_KEY` in plaats
  van `process.env`, en `Response`-objecten in plaats van `{statusCode, body}`.
- `parseIcal.js` en de tests verhuizen mee naar `functions/utils/`. De
  vitest-`include` in `vite.config.js` gaat mee.
- Mijn keuze: Resend aanroepen met `fetch` naar de REST API in plaats van de
  `resend`-SDK. Dat scheelt een dependency en Node-compatibiliteit in de
  Workers-runtime. De bouwer mag de SDK houden als die zonder
  `nodejs_compat` werkt.
- Secrets als Pages environment variables (encrypted), in Production én Preview.

### 3. Foto's: Cloudflare Image Transformations

- `src/lib/image.js`: `cdnUrl` wordt
  `/cdn-cgi/image/width=${w},quality=75,format=auto${src}`. `WIDTHS`,
  `srcset` en `sizes` blijven gelijk.
- Image Transformations aanzetten op de zone bnbdekopstoof.nl.
- `VITE_IMAGE_CDN=on` staat alleen in de Production-env van Pages.
  `/cdn-cgi/image` werkt niet op `*.pages.dev`, dus previews en lokaal laden de
  originelen, net als nu.

### 4. CMS-login: worker `cms-auth` + Cloudflare Access

Eigen Worker in de map `cms-auth/` (met `wrangler.toml`), gedeployed op
`cms.bnbdekopstoof.nl`. Twee taken:

**a. Inloggen — `GET /auth`** (achter Cloudflare Access)

1. Decap opent een popup naar `https://cms.bnbdekopstoof.nl/auth`.
2. Access vraagt het e-mailadres en mailt een eenmalige code (login method
   "One-time PIN"). De policy laat alleen de ingestelde adressen door: de
   eigenaar en Joost. De adressen staan in het Cloudflare-dashboard, niet in de
   repo.
3. De worker controleert zelf ook de `Cf-Access-Jwt-Assertion` (handtekening
   tegen de Access-certs van het team, `aud`, verloopdatum) en het e-mailadres
   tegen een allowlist in een worker-secret. Dubbel, zodat een verkeerd
   ingestelde Access-policy niet genoeg is om binnen te komen.
4. De worker maakt een **sessietoken**: HMAC-SHA256-ondertekend, met het
   e-mailadres en een verloopdatum (8 uur). Het is géén GitHub-token.
5. De popup stuurt dat terug via de Decap-handshake: eerst `authorizing:github`,
   wachten op het antwoord van het venster dat de popup opende, dan
   `authorization:github:success:{"token":"…","provider":"github"}`. Alles met
   `postMessage`, en alleen naar een origin uit `ALLOWED_ORIGINS`.

**b. GitHub-proxy — `/github/*`** (niet achter Access, zie waarom hieronder)

- Decap praat via `api_root` met de worker in plaats van met `api.github.com`.
- Per request: het sessietoken uit `Authorization` checken (handtekening en
  verloopdatum), dan vervangen door een echt GitHub-token, en doorsturen naar
  `https://api.github.com/<rest>`.
- Alleen paden onder `/repos/joostjonkheijm/DeKopstoof/...` mogen door, plus
  `GET /user`. Al het andere geeft 403.
- `GET /user` beantwoordt de worker zelf, met naam en e-mail uit de sessie.
  Een installatietoken van een GitHub App mag `/user` niet aanroepen.
- `GET /repos/joostjonkheijm/DeKopstoof`: Decap leest daar
  `permissions.push` om te zien of de gebruiker mag schrijven. Bij een
  installatietoken ontbreekt dat veld. De worker vult
  `permissions: {admin: false, push: true, pull: true}` in. (Mijn keuze.)
- CORS en `postMessage`-origin: de toegestane origins komen uit een worker-var
  `ALLOWED_ORIGINS`, in productie alleen `https://bnbdekopstoof.nl`. Tijdens de
  proef en op previews komt daar het `pages.dev`-adres of `localhost` bij.
  Preflight afhandelen. (Mijn keuze.)
- Een verlopen of ongeldig sessietoken geeft 401, zodat Decap opnieuw laat
  inloggen.
- Waarom niet achter Access: Decap stuurt bij `fetch` geen cookies mee, dus de
  Access-cookie komt niet aan. Het sessietoken neemt die rol over.

**GitHub-token — mijn keuze: GitHub App**

- Joost maakt een GitHub App aan, geïnstalleerd op alleen deze repo, met
  rechten *Contents: read & write* en *Metadata: read*.
- De worker maakt per request (of gecachet, ~55 min) een installatietoken met de
  private key van de App (JWT RS256 via WebCrypto). De private key staat als
  worker-secret.
- Waarom niet een fine-grained PAT: die verloopt na hoogstens een jaar, en dan
  valt het CMS stil zonder dat iemand weet waarom. Een App-key verloopt niet.
  Commits komen op naam van `<app>[bot]`.

**Decap-config** (`public/admin/config.yml`):

```yaml
backend:
  name: github
  repo: joostjonkheijm/DeKopstoof
  branch: master
  base_url: https://cms.bnbdekopstoof.nl
  auth_endpoint: auth
  api_root: https://cms.bnbdekopstoof.nl/github
  commit_messages: … (ongewijzigd)
```

`local_backend: true` blijft. Het Identity-script in `public/admin/index.html`
en de invite-token-doorverwijzing in `index.html` verdwijnen.

**Worker-secrets:** `SESSION_SECRET`, `GITHUB_APP_ID`,
`GITHUB_APP_PRIVATE_KEY`, `GITHUB_INSTALLATION_ID`, `ALLOWED_EMAILS`.
**Worker-vars:** `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ALLOWED_ORIGINS`,
`GITHUB_REPO`.

Bewuste afweging: het sessietoken staat in `localStorage` van de site. Iemand
die script op de site krijgt, kan het hoogstens 8 uur gebruiken, en alleen
voor deze repo. Dat vind ik acceptabel. Het echte GitHub-token blijft hoe dan
ook in de worker.

### 5. Proef eerst (vóór de rest)

Decap via een `api_root`-proxy heb ik nergens beschreven gevonden. Daarom eerst
een wegwerp-proef met de worker op een `workers.dev`-adres (Access aan via het
dashboard) en een testbranch in de repo. De proef moet aantonen:

- inloggen, collecties laden en een tekst opslaan (commit komt op de branch);
- een foto van ~10 MB uploaden en verwijderen;
- dat Decap geen verzoeken buiten `api_root` om naar `api.github.com` doet
  (netwerktab).

Lukt dat niet, dan komen we terug op deze keuze. Uitwijkoptie is A
(DecapBridge).

### 6. DNS en mail bij de verhuizing

- Zone bnbdekopstoof.nl toevoegen in Cloudflare, nameservers bij Hostnet
  omzetten. Er draait nu niets op het domein, dus de overstap kan geen
  bezoekers raken.
- **Gevonden:** het contactformulier verstuurt van `noreply@bnbdekopstoof.nl`
  naar `info@bnbdekopstoof.nl`, maar het domein heeft nu geen Resend-records en
  geen MX. Met `p=reject` in DMARC komen die mails waarschijnlijk niet aan, en
  `info@` kan niets ontvangen. Bij de verhuizing:
  - de DNS-records die Resend opgeeft toevoegen (DKIM, SPF/MX op `send.`);
  - mijn keuze: Cloudflare Email Routing om `info@` door te sturen naar een
    bestaande mailbox van de eigenaar (gratis). Naar welke mailbox beslist
    Joost.

### 7. Overstap en opruimen

Volgorde: proef → code-wijzigingen op een branch → Pages-project en worker
live, eerst op `*.pages.dev` testen → domein koppelen → CMS end-to-end testen
door de eigenaar → pas dan Netlify-builds stoppen en de Netlify-site
verwijderen (Identity-gebruikers vervallen mee).

### 8. Documentatie

README: de secties Authenticatie, Foto's en Routing herschrijven voor
Cloudflare, en de handmatige stappen opnemen (Pages-project, Access-app en
policy, GitHub App, secrets, DNS, Email Routing). De eigenaarshandleiding:
inloggen gaat voortaan met een code per mail.

## Proefresultaat (2026-11-21)

Geslaagd. Decap 3.17.3 werkt volledig via een `api_root`-proxy.

- Inloggen via Access (eenmalige code) → sessietoken → collecties laden.
- Tekst gepubliceerd (commit `7f6a615` op `spike/cms-content`).
- Foto van **20 MB** geüpload (`1b5d372`) en verwijderd (`85fa523`).
- Alle verkeer liep via de proxy. 304-antwoorden (ETag) komen goed door.

Lessen voor de bouw:

- **Decap gebruikt `%2F` in paden**, bijvoorbeeld
  `git/trees/master:src%2Fcontent` en `branches/<branch>%2F…`. De padcontrole
  mag `%2F` dus niet weigeren. Veilig blijft het doordat het prefix
  `/repos/<repo>/` letterlijk moet kloppen.
- Paden die Decap aanroept: `GET /user`, `GET /repos/<repo>`,
  `GET …/commits?path=…&sha=…`, `GET …/git/trees/<ref>:<dir>`,
  `GET/POST …/git/blobs`, `GET …/branches/<branch>`, `POST …/git/trees`,
  `POST …/git/commits`, `PATCH …/git/refs/heads/<branch>`.
- **Access op een `workers.dev`-adres geldt voor de hele worker**; een pad
  instellen kan daar niet. In productie dus Access als *public hostname*
  `cms.bnbdekopstoof.nl` met pad `auth`, zoals al ontworpen.
- In de terminal plakt Ctrl+V een stuurteken in `wrangler secret put`;
  gebruik Ctrl+Shift+V.

## Wat Joost zelf moet doen (kan Claude niet)

- Cloudflare: zone toevoegen, Pages koppelen aan GitHub, Zero Trust aanzetten,
  Access-app en policy, Image Transformations aan, Email Routing.
- Hostnet: nameservers omzetten.
- GitHub: App aanmaken en installeren, en de private key als secret zetten.
- Resend: domein (opnieuw) verifiëren.

## Aan de bouwer

- De indeling van de worker-code en tests (de checks voor sessietoken, JWT en
  padfilter verdienen unit-tests).
- Caching van het installatietoken.
- Of `wrangler` als devDependency in de root komt of in `cms-auth/`.
- Exacte foutmeldingen (Nederlands voor alles wat de eigenaar kan zien).
