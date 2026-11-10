// Full-page screenshots of every route, for before/after visual comparison.
// Usage: npm run build && npx vite preview --port 4173 &
//        node scripts/screenshots.mjs <outDir> [baseUrl]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outDir = process.argv[2] ?? "screenshots/current";
const baseUrl = process.argv[3] ?? "http://localhost:4173";

const routes = {
  home: "/",
  kamers: "/kamers",
  omgeving: "/omgeving",
  "over-de-kopstoof": "/over-de-kopstoof",
  reviews: "/reviews",
  boeken: "/boeken",
};

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const [vpName, viewport] of Object.entries(viewports)) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
    locale: "nl-NL",
    timezoneId: "Europe/Amsterdam",
  });
  // The embedded Google Map and the availability API are not deterministic.
  await context.route(/maps\.google\.com|google\.com\/maps/, (r) => r.abort());
  await context.route(/\/api\//, (r) =>
    r.fulfill({ status: 503, contentType: "application/json", body: "{}" })
  );
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date("2026-01-15T12:00:00+01:00"));

  for (const [name, route] of Object.entries(routes)) {
    await page.goto(baseUrl + route, { waitUntil: "networkidle" });
    // Load every lazy image up front (headless lazy-loading is timing
    // dependent), scroll through the page, then return to the top.
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img[loading="lazy"]')) {
        img.loading = "eager";
      }
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await document.fonts.ready;
      // Cap the wait so one stuck image cannot hang the run.
      await Promise.race([
        Promise.all(
          // decode() resolves once the image is loaded and ready to paint.
          [...document.images].map((img) => img.decode().catch(() => {}))
        ),
        new Promise((r) => setTimeout(r, 15000)),
      ]);
    });
    await page.waitForTimeout(500);
    const file = path.join(outDir, `${name}-${vpName}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
    console.log("saved", file);
  }
  await context.close();
}

await browser.close();
