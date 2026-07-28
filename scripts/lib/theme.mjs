/**
 * Build Typora monofiles from src/: tokens + structure (+ dark-only).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const PRINT_MARKER = "/* __INJECT_PRINT_LIGHT_TOKENS__ */";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/** @param {string} css */
export function parseTokenMap(css) {
  const map = new Map();
  for (const m of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) {
    map.set(m[1], m[2].trim().replace(/\s+/g, " "));
  }
  return map;
}

/** @param {string} css */
export function tokenNames(css) {
  return [...parseTokenMap(css).keys()].sort();
}

/** Drop :root {…}, then flag hex/rgba in remaining rules. */
export function findHardcodedColors(css) {
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/:root\s*\{[\s\S]*?\n\}/, "");
  return stripped
    .split("\n")
    .map((text, i) => ({ line: i + 1, text: text.trim() }))
    .filter(
      ({ text }) =>
        text &&
        !text.includes("fonts.googleapis") &&
        (/#[0-9a-fA-F]{3,8}\b/.test(text) || /(?:^|[^a-zA-Z-])rgba?\(/.test(text))
    );
}

/** Color tokens from light :root for dark @media print. */
function printLightTokenBlock(lightTokensCss) {
  const skip = new Set([
    "--font-body",
    "--font-ui",
    "--font-strong",
    "--font-mono",
    "--checkbox-check-image",
    "--shadow-tooltip",
    "--shadow-panel",
    "--shadow-menu",
    "--scrollbar-thumb-color",
    "--scrollbar-thumb-hover-color",
  ]);
  const lines = ["    :root {"];
  for (const [name, value] of parseTokenMap(lightTokensCss)) {
    if (!skip.has(name)) lines.push(`        ${name}: ${value};`);
  }
  lines.push("    }");
  return lines.join("\n");
}

function withPrintInjection(structure, injectLight) {
  if (!structure.includes(PRINT_MARKER)) {
    throw new Error("structure.css missing print injection marker");
  }
  if (!injectLight) {
    return structure.replace(/\s*\/\* __INJECT_PRINT_LIGHT_TOKENS__ \*\/\n?/, "\n");
  }
  const block = printLightTokenBlock(read("src/tokens/light.css"));
  return structure.replace(
    PRINT_MARKER,
    `/* 暗色打印切回亮色纸面 */\n${block}`
  );
}

/** @param {'light' | 'dark'} mode */
export function buildTheme(mode) {
  const header = read(`src/header-${mode}.txt`).trimEnd();
  const tokens = read(`src/tokens/${mode}.css`).trimEnd();
  let structure = withPrintInjection(read("src/structure.css"), mode === "dark");
  const darkOnly =
    mode === "dark" ? "\n\n" + read("src/dark-only.css").trimEnd() : "";
  return `${header}\n\n${tokens}\n\n${structure.trimEnd()}${darkOnly}\n`;
}

export function writeThemes() {
  const light = buildTheme("light");
  const dark = buildTheme("dark");
  fs.writeFileSync(path.join(ROOT, "kraft-paper.css"), light);
  fs.writeFileSync(path.join(ROOT, "kraft-paper-dark.css"), dark);
  return { light, dark };
}

/** README palette table from tokens (roles only; hand list is fine). */
export function renderPaletteMarkdown() {
  const light = parseTokenMap(read("src/tokens/light.css"));
  const dark = parseTokenMap(read("src/tokens/dark.css"));
  const roles = [
    ["页面底色", "--bg-color"],
    ["侧栏底", "--side-bar-bg-color"],
    ["正文", "--text-color"],
    ["标题", "--heading-color"],
    ["次级文本", "--control-text-color"],
    ["强调色 `--accent-color`", "--accent-color"],
    ["强调悬停", "--accent-hover-color"],
    ["强调上前景 `--on-accent-color`", "--on-accent-color"],
    ["边线", "--border-color"],
    ["高亮 `==mark==`", "--mark-bg-color"],
    ["行内代码字色", "--inline-code-color"],
  ];
  return [
    "| 角色 | 浅色 | 深色 |",
    "| --- | --- | --- |",
    ...roles.map(
      ([role, token]) =>
        `| ${role} | \`${light.get(token) ?? "—"}\` | \`${dark.get(token) ?? "—"}\` |`
    ),
  ].join("\n");
}

export function syncReadmePalette(readme, table) {
  if (!readme.includes("<!-- palette:start -->")) {
    throw new Error("README missing palette markers");
  }
  return readme.replace(
    /<!-- palette:start -->[\s\S]*?<!-- palette:end -->/,
    `<!-- palette:start -->\n${table}\n<!-- palette:end -->`
  );
}
