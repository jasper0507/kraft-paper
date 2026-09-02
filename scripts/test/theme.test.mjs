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
  parseTokenMap,
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


const FONT_DIR = path.join(ROOT, "kraft-paper");
const FONT_NAMES = ["--font-body", "--font-ui", "--font-strong", "--font-mono"];

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripDataUris(css) {
  return css.replace(/url\(\s*(['"]?)data:[^)]+\)/gi, "url($1data:omitted)");
}

function fontFaceBlocks(css) {
  return [...stripComments(css).matchAll(/@font-face\s*\{[^}]*\}/gi)].map((m) => m[0]);
}

function networkHaystack(css) {
  return stripDataUris(stripComments(css));
}

test("emphasis @font-face uses unicode-range; strong/b are not a whole-element YaHei swap", () => {
  const structure = read("src/structure.css");
  const faces = fontFaceBlocks(structure);
  assert.ok(faces.length > 0, "expected @font-face in structure");
  const ranged = faces.filter((f) => /unicode-range\s*:/i.test(f));
  assert.ok(ranged.length >= 2, "emphasis split needs unicode-range on more than one face");
  assert.ok(
    ranged.some((f) => /U\+0{0,4}00FF|U\+0000/i.test(f)),
    "latin unicode-range missing"
  );
  assert.ok(
    ranged.some((f) => /U\+4E00/i.test(f)),
    "CJK unicode-range missing"
  );

  const hay = stripComments(structure);
  for (const m of hay.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    const sel = m[1].replace(/\s+/g, " ").trim();
    if (!/(^|[, ]|\()(strong|b)([, :)]|$)/.test(sel)) continue;
    const body = m[2];
    const ff = body.match(/font-family\s*:\s*([^;]+);/i);
    if (!ff) continue;
    assert.doesNotMatch(
      ff[1],
      /Microsoft YaHei|微软雅黑/i,
      `whole-element swap forbidden: ${sel} { font-family: ${ff[1].trim()} }`
    );
  }
});

test("mono stack has Cascadia Code, Consolas, Microsoft YaHei; no Sarasa Mono SC", () => {
  for (const file of ["src/tokens/light.css", "src/tokens/dark.css"]) {
    const mono = parseTokenMap(read(file)).get("--font-mono") ?? "";
    assert.match(mono, /Cascadia Code/);
    assert.match(mono, /Consolas/);
    assert.match(mono, /Microsoft YaHei/);
    assert.doesNotMatch(mono, /Sarasa Mono SC/);
  }
});

test("structure and monofiles make no http(s) / Google Fonts requests", () => {
  const files = {
    "src/structure.css": read("src/structure.css"),
    "kraft-paper.css": buildTheme("light"),
    "kraft-paper-dark.css": buildTheme("dark"),
  };
  for (const [name, css] of Object.entries(files)) {
    const hay = networkHaystack(css);
    assert.doesNotMatch(hay, /@include-when-export/);
    assert.doesNotMatch(hay, /fonts\.googleapis/);
    assert.doesNotMatch(hay, /fonts\.gstatic/);
    assert.doesNotMatch(hay, /https?:\/\//i);
  }
});

test("kraft-paper/ ships Noto Serif SC 400/700 woff2 + OFL; CSS src is relative", () => {
  const ofl = path.join(FONT_DIR, "OFL.txt");
  assert.ok(fs.existsSync(ofl), "kraft-paper/OFL.txt missing");
  assert.match(read("kraft-paper/OFL.txt"), /SIL Open Font License/i);

  const woffs = fs
    .readdirSync(FONT_DIR)
    .filter((f) => f.toLowerCase().endsWith(".woff2"));
  const regular = woffs.find((f) => /regular|400/i.test(f));
  const bold = woffs.find((f) => /bold|700/i.test(f));
  assert.ok(regular, `400/Regular woff2 missing in ${woffs.join(", ")}`);
  assert.ok(bold, `700/Bold woff2 missing in ${woffs.join(", ")}`);
  for (const file of [regular, bold]) {
    const size = fs.statSync(path.join(FONT_DIR, file)).size;
    assert.ok(
      size > 1_000_000,
      `${file} is ${size} bytes; SC long-form CJK should be well above Latin-only`
    );
  }

  const css = stripComments(read("src/structure.css"));
  assert.match(
    css,
    /src\s*:\s*url\(\s*"kraft-paper\/[^"]+\.woff2"\s*\)/
  );
  assert.doesNotMatch(css, /src\s*:\s*url\(\s*["']?https?:/i);
  assert.match(css, new RegExp(regular.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(css, new RegExp(bold.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("@font-face declares font-display: swap", () => {
  const faces = fontFaceBlocks(read("src/structure.css"));
  assert.ok(faces.length > 0, "expected @font-face");
  for (const face of faces) {
    assert.match(face, /font-display\s*:\s*swap/i, face);
  }
});

test("#write rhythm: line-height 1.7, p 0.95em, letter-spacing 0.02em, kerning; code/kbd/fences spacing 0", () => {
  const css = stripComments(read("src/structure.css"));
  const write = css.match(/#write\s*\{[^}]+\}/);
  assert.ok(write, "#write block missing");
  assert.match(write[0], /line-height\s*:\s*1\.7\b/);
  assert.match(write[0], /letter-spacing\s*:\s*0\.02em/);
  assert.match(write[0], /font-kerning\s*:\s*normal/);
  assert.match(css, /#write p[\s\S]*?margin\s*:\s*0\.95em/);

  for (const sel of ["#write code", "#write kbd", ".md-fences"]) {
    const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped + "[\\s\\S]*?letter-spacing\\s*:\\s*0\\b");
    assert.match(css, re, `${sel} letter-spacing: 0`);
  }
});

test("heading weight 600-700; fences 0.9em / 1.65", () => {
  const css = stripComments(read("src/structure.css"));
  const heads = css.match(/#write h1[\s\S]*?#write h6\s*\{[^}]+\}/);
  assert.ok(heads, "grouped heading rule missing");
  const weight = heads[0].match(/font-weight\s*:\s*(\d+)/);
  assert.ok(weight, "heading font-weight missing");
  const n = Number(weight[1]);
  assert.ok(n >= 600 && n <= 700, `heading weight ${n} not in 600-700`);

  const fences = css.match(/\.md-fences\s*\{[^}]+\}/);
  assert.ok(fences, ".md-fences block missing");
  assert.match(fences[0], /font-size\s*:\s*0\.9em/);
  assert.match(fences[0], /line-height\s*:\s*1\.65/);
});

test("light and dark font family tokens match", () => {
  const light = parseTokenMap(read("src/tokens/light.css"));
  const dark = parseTokenMap(read("src/tokens/dark.css"));
  for (const name of FONT_NAMES) {
    assert.equal(light.get(name), dark.get(name), name);
  }
  const body = light.get("--font-body") ?? "";
  assert.match(body, /Noto Serif SC/);
  assert.match(body, /Georgia/);
  assert.match(body, /Times New Roman/);
  assert.match(body, /Songti SC/);
  assert.match(body, /Source Han Serif SC/);
  assert.doesNotMatch(body, /Tiempos|Source Serif 4|WenKai|Sarasa/);
  const ui = light.get("--font-ui") ?? "";
  assert.match(ui, /Segoe UI/);
  assert.match(ui, /Microsoft YaHei/);
  assert.doesNotMatch(ui, /Noto/);
});
