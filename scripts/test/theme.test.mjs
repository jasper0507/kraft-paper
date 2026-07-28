/**
 * Smoke seams: token parity, no raw colors in structure, monofiles fresh, dark print.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  ROOT,
  buildTheme,
  findHardcodedColors,
  tokenNames,
} from "../lib/theme.mjs";

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("dark tokens cover every light token name (dark may add scrollbar-*)", () => {
  const light = tokenNames(read("src/tokens/light.css"));
  const dark = new Set(tokenNames(read("src/tokens/dark.css")));
  for (const name of light) {
    assert.ok(dark.has(name), `dark missing ${name}`);
  }
});

test("structure and dark-only have no raw hex/rgba outside comments", () => {
  for (const file of ["src/structure.css", "src/dark-only.css"]) {
    const hits = findHardcodedColors(read(file));
    assert.equal(
      hits.length,
      0,
      `${file}:\n` + hits.map((h) => `  L${h.line}: ${h.text}`).join("\n")
    );
  }
});

test("disk monofiles match buildTheme", () => {
  assert.equal(read("kraft-paper.css"), buildTheme("light"));
  assert.equal(read("kraft-paper-dark.css"), buildTheme("dark"));
});

test("dark print injects light paper tokens", () => {
  const css = buildTheme("dark");
  const print = css.slice(css.indexOf("@media print"));
  assert.match(print, /--bg-color:\s*#faf9f5/i);
  assert.match(print, /--accent-color:\s*#c15f3c/i);
  assert.doesNotMatch(css, /__INJECT_PRINT_LIGHT_TOKENS__/);
});
