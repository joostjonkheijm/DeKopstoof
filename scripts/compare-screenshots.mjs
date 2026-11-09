// Pixel-compare two screenshot folders produced by scripts/screenshots.mjs.
// Usage: node scripts/compare-screenshots.mjs <beforeDir> <afterDir> [diffDir]
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [beforeDir, afterDir, diffDir = "screenshots/diff"] = process.argv.slice(2);
if (!beforeDir || !afterDir) {
  console.error("Usage: compare-screenshots.mjs <beforeDir> <afterDir> [diffDir]");
  process.exit(2);
}

await mkdir(diffDir, { recursive: true });
const files = (await readdir(beforeDir)).filter((f) => f.endsWith(".png")).sort();
let failed = 0;

for (const file of files) {
  const a = PNG.sync.read(await readFile(path.join(beforeDir, file)));
  const b = PNG.sync.read(await readFile(path.join(afterDir, file)));
  if (a.width !== b.width || a.height !== b.height) {
    console.log(`${file}: SIZE DIFFERS ${a.width}x${a.height} -> ${b.width}x${b.height}`);
    failed++;
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.1,
  });
  if (changed > 0) {
    // Report the vertical band that changed, to locate the section.
    let top = a.height;
    let bottom = 0;
    for (let y = 0; y < a.height; y++) {
      for (let x = 0; x < a.width; x++) {
        const i = (y * a.width + x) * 4;
        if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          break;
        }
      }
    }
    await writeFile(path.join(diffDir, file), PNG.sync.write(diff));
    console.log(`${file}: ${changed} px differ (rows ${top}-${bottom} of ${a.height})`);
    failed++;
  } else {
    console.log(`${file}: identical`);
  }
}

process.exit(failed ? 1 : 0);
