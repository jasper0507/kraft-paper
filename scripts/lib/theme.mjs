/**
 * Kraft Paper theme build primitives.
 * Seam: source tree (tokens + structure + host) → Typora monofile CSS.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");

export const STRUCTURE_FILES = [
  "00-fonts-export.css",
  "01-base.css",
  "02-content.css",
  "03-code.css",
  "04-print.css",
  "05-chrome.css",
  "06-windows.css",
];

/** @param {string} filePath */
export function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/** @param {string} css */
export function parseTokenMap(css) {
  const map = new Map();
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    map.set(m[1], m[2].trim().replace(/\s+/g, " "));
  }
  return map;
}

/**
 * Build checkbox checkmark data-URI from on-accent hex (single source of truth).
 * @param {string} onAccentHex e.g. #faf9f5
 */
export function checkboxCheckImage(onAccentHex) {
  const hex = onAccentHex.trim().replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f]{3,8}$/i.test(hex)) {
    throw new Error(`invalid on-accent for checkbox: ${onAccentHex}`);
  }
  return `url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27none%27 stroke=%27%23${hex}%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M2.5 6.2 5 8.5 9.5 3.5%27/%3E%3C/svg%3E")`;
}

/**
 * Ensure --checkbox-check-image matches --on-accent-color (overwrite if present).
 * @param {string} tokensCss
 */
export function syncCheckboxToken(tokensCss) {
  const map = parseTokenMap(tokensCss);
  const onAccent = map.get("--on-accent-color");
  if (!onAccent) throw new Error("tokens missing --on-accent-color");
  const image = checkboxCheckImage(onAccent);
  if (/--checkbox-check-image\s*:/.test(tokensCss)) {
    return tokensCss.replace(
      /--checkbox-check-image\s*:\s*[^;]+;/,
      `--checkbox-check-image: ${image};`
    );
  }
  // insert after on-accent
  return tokensCss.replace(
    /(--on-accent-color\s*:\s*[^;]+;)/,
    `$1\n    --checkbox-check-image: ${image};`
  );
}

/** @param {string} css */
export function tokenNames(css) {
  return [...parseTokenMap(css).keys()].sort();
}

/**
 * Strip comments and collapse whitespace for structural comparison.
 * @param {string} css
 */
export function normalizeCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find hardcoded colors in rule bodies (not inside :root token defs, not in comments).
 * @param {string} css
 * @returns {{ line: number, text: string }[]}
 */
export function findHardcodedColors(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, (block) =>
    block.replace(/[^\n]/g, " ")
  );
  const lines = withoutComments.split("\n");
  const hits = [];
  let inRoot = false;
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inRoot && /:root\s*\{/.test(line)) {
      inRoot = true;
      depth = 0;
    }

    if (inRoot) {
      for (const ch of line) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (depth <= 0 && line.includes("}")) {
        inRoot = false;
      }
      continue;
    }

    // Allow pure var() usage; flag hex / raw rgb(a) outside tokens
    if (/#[0-9a-fA-F]{3,8}\b/.test(line) || /(?:^|[^a-zA-Z-])rgba?\(/.test(line)) {
      // skip if only inside url() for fonts etc — still flag
      if (trimmed.includes("var(--")) {
        // e.g. box-shadow: var(--x) is fine; mixed is rare
        if (!/#[0-9a-fA-F]{3,8}/.test(line) && !/rgba?\(/.test(line.replace(/var\([^)]*\)/g, ""))) {
          continue;
        }
      }
      if (/#[0-9a-fA-F]{3,8}/.test(line) || /rgba?\(/.test(line)) {
        // ignore empty / at-rules without colors that are only google fonts urls without hex colors
        if (/@include-when-export|fonts\.googleapis/.test(line) && !/#[0-9a-fA-F]{3,8}/.test(line)) {
          continue;
        }
        hits.push({ line: i + 1, text: trimmed });
      }
    }
  }
  return hits;
}

/** @param {string} tokensCss :root block */
export function printTokenOverrideBlock(tokensCss) {
  const map = parseTokenMap(tokensCss);
  // Color-related tokens only (skip fonts / checkbox image / shadows for print readability)
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
  for (const [name, value] of map) {
    if (skip.has(name)) continue;
    lines.push(`        ${name}: ${value};`);
  }
  lines.push("    }");
  return lines.join("\n");
}

/**
 * Inject light tokens into @media print marker for dark builds.
 * @param {string} structureCss
 * @param {string} lightTokensCss
 * @param {boolean} inject
 */
export function applyPrintInjection(structureCss, lightTokensCss, inject) {
  const marker = "/* __INJECT_PRINT_LIGHT_TOKENS__ */";
  if (!structureCss.includes(marker)) {
    throw new Error("missing print injection marker in structure");
  }
  if (!inject) {
    return structureCss.replace(/\s*\/\* __INJECT_PRINT_LIGHT_TOKENS__ \*\/\n?/, "\n");
  }
  const block = printTokenOverrideBlock(lightTokensCss);
  return structureCss.replace(
    marker,
    `/* 暗色主题直接导出会得到深底白字; 打印时注入亮色 token */\n${block}`
  );
}

/** @param {'light' | 'dark'} mode */
export function loadStructure(mode = "light") {
  const parts = STRUCTURE_FILES.map((f) =>
    read(path.join(ROOT, "src/structure", f))
  );
  let structure = parts.join("\n");
  const lightTokens = read(path.join(ROOT, "src/tokens/light.css"));
  structure = applyPrintInjection(structure, lightTokens, mode === "dark");
  return structure;
}

/** @param {'light' | 'dark'} mode */
export function buildTheme(mode) {
  const header = read(path.join(ROOT, "src/headers", `${mode}.txt`));
  const tokens = syncCheckboxToken(
    read(path.join(ROOT, "src/tokens", `${mode}.css`))
  );
  let structure = loadStructure(mode);
  const darkOnly =
    mode === "dark"
      ? "\n" + read(path.join(ROOT, "src/host/dark-only.css")).trimEnd() + "\n"
      : "";

  const out = [
    header.trimEnd(),
    "",
    tokens.trimEnd(),
    "",
    structure.trimEnd(),
    darkOnly.trimEnd(),
    "",
  ]
    .filter((chunk, i, arr) => !(chunk === "" && arr[i - 1] === ""))
    .join("\n");

  // Ensure single trailing newline
  return out.replace(/\n*$/, "\n");
}

export function writeThemes() {
  const light = buildTheme("light");
  const dark = buildTheme("dark");
  fs.writeFileSync(path.join(ROOT, "kraft-paper.css"), light);
  fs.writeFileSync(path.join(ROOT, "kraft-paper-dark.css"), dark);
  return { light, dark };
}

/**
 * README palette rows from token files (single source).
 * @returns {{ role: string, token: string, light: string, dark: string }[]}
 */
export function paletteRows() {
  const light = parseTokenMap(read(path.join(ROOT, "src/tokens/light.css")));
  const dark = parseTokenMap(read(path.join(ROOT, "src/tokens/dark.css")));
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
  return roles.map(([role, token]) => ({
    role,
    token,
    light: light.get(token) ?? "—",
    dark: dark.get(token) ?? "—",
  }));
}

/** Render markdown table for README §色板 */
export function renderPaletteMarkdown() {
  const rows = paletteRows();
  const lines = [
    "| 角色 | 浅色 | 深色 |",
    "| --- | --- | --- |",
    ...rows.map(
      (r) => `| ${r.role} | \`${r.light}\` | \`${r.dark}\` |`
    ),
  ];
  return lines.join("\n");
}

/**
 * Replace the palette table between markers in README.
 * @param {string} readme
 * @param {string} tableMarkdown
 */
export function syncReadmePalette(readme, tableMarkdown) {
  const start = "<!-- palette:start -->";
  const end = "<!-- palette:end -->";
  if (!readme.includes(start) || !readme.includes(end)) {
    throw new Error("README missing palette markers");
  }
  const re = /<!-- palette:start -->[\s\S]*?<!-- palette:end -->/;
  return readme.replace(
    re,
    `${start}\n${tableMarkdown}\n${end}`
  );
}
