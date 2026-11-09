// Verifies that public/admin/config.yml and src/content/*.json describe the
// same content model: every JSON key has a CMS field and every CMS field
// exists in the JSON. Run with `npm run check:cms`.
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const config = parse(readFileSync("public/admin/config.yml", "utf8"), { merge: true, maxAliasCount: -1 });
const problems = [];

function check(fields, value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    problems.push(`${path}: expected an object in JSON`);
    return;
  }
  const names = new Set(fields.map((f) => f.name));
  for (const key of Object.keys(value)) {
    if (!names.has(key)) problems.push(`${path}.${key}: in JSON but not in config.yml`);
  }
  for (const field of fields) {
    const here = `${path}.${field.name}`;
    const v = value[field.name];
    if (v === undefined) {
      problems.push(`${here}: in config.yml but not in JSON`);
    } else if (field.widget === "object") {
      check(field.fields, v, here);
    } else if (field.widget === "list") {
      if (!Array.isArray(v)) problems.push(`${here}: expected a list in JSON`);
      else if (field.fields) v.forEach((item, i) => check(field.fields, item, `${here}[${i}]`));
      else if (v.some((item) => typeof item !== "string")) problems.push(`${here}: expected a list of strings`);
    } else if (typeof v !== "string") {
      problems.push(`${here}: expected text in JSON`);
    } else if (field.widget === "select") {
      const allowed = field.options.map((o) => o.value ?? o);
      if (!allowed.includes(v)) problems.push(`${here}: "${v}" is not one of ${allowed.join(", ")}`);
    }
  }
}

let files = 0;
for (const collection of config.collections) {
  for (const file of collection.files ?? []) {
    files++;
    check(file.fields, JSON.parse(readFileSync(file.file, "utf8")), file.name);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} mismatch(es) between config.yml and content JSON.`);
  process.exit(1);
}
console.log(`config.yml matches all ${files} content files.`);
