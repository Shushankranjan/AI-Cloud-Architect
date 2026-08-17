import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.DOMPurify = undefined;

const { default: mermaid } = await import("mermaid");
mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

const srcIndex = process.argv.indexOf("--src");
if (srcIndex !== -1) {
  const srcPath = process.argv[srcIndex + 1];
  if (!srcPath) {
    console.error("ERROR: --src requires a file path");
    process.exit(2);
  }
  const source = readFileSync(srcPath, "utf-8");
  try {
    await mermaid.parse(source);
    console.log("OK");
    process.exit(0);
  } catch (e) {
    console.error(`ERROR: ${e.message ?? e}`);
    process.exit(1);
  }
}

const fixtureDir = join(import.meta.dirname, "..", "..", "contract", "fixtures");
let checked = 0;
let failed = 0;

function collectMermaid(value, path, out) {
  if (typeof value === "string" && value.trim().startsWith("flowchart")) {
    out.push({ path, source: value });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => collectMermaid(v, `${path}[${i}]`, out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collectMermaid(v, `${path}.${k}`, out);
  }
}

const diagrams = [];
for (const file of readdirSync(fixtureDir)) {
  if (!file.endsWith(".json")) continue;
  const data = JSON.parse(readFileSync(join(fixtureDir, file), "utf-8"));
  collectMermaid(data, file, diagrams);
}

for (const { path, source } of diagrams) {
  checked++;
  try {
    await mermaid.parse(source);
    console.log(`PASS  ${path}`);
  } catch (e) {
    failed++;
    console.error(`FAIL  ${path}\n      ${e.message ?? e}`);
  }
}

console.log(`\n${checked - failed}/${checked} fixture diagrams are valid Mermaid`);
process.exit(failed > 0 ? 1 : 0);
