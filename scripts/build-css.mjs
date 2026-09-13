import { readFile, writeFile, mkdir } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const source = path.join(root, "src", "numbers.css");
const out = path.join(root, "dist", "numbers.css");

const ORDER = "@layer arc, theme, base, components, utilities;\n";

async function build() {
  const css = (await readFile(source, "utf8")).trim();
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${ORDER}@layer arc {\n${css}\n}\n`);
  console.log(`[css] built dist/numbers.css (${(css.length / 1024).toFixed(1)}kB)`);
}

await build();

if (process.argv.includes("--watch")) {
  let queued = null;
  watch(path.dirname(source), { recursive: false }, (_event, file) => {
    if (file !== "numbers.css") return;
    clearTimeout(queued);
    queued = setTimeout(() => build().catch(console.error), 40);
  });
  console.log("[css] watching src/numbers.css");
}
