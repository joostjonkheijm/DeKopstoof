// Renders every route and fails on any uncaught page error.
// Used to check that pages survive empty or missing CMS content.
// Usage: node scripts/smoke-empty-content.mjs [baseUrl]
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:4173";
const routes = ["/", "/kamers", "/omgeving", "/over-de-kopstoof", "/reviews", "/boeken"];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.route(/maps\.google\.com|\/api\//, (r) => r.abort());
const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));

for (const route of routes) {
  await page.goto(baseUrl + route, { waitUntil: "networkidle" });
  const rendered = await page.locator("#root > *").count();
  if (!rendered) errors.push(`${route}: nothing rendered`);
  console.log(route, rendered ? "rendered" : "EMPTY");
}
await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
