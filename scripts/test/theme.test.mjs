/**
 * Seams under test:
 * 1. tokenNames — light/dark token interface alignment
 * 2. findHardcodedColors — structure rule body has no hex/rgba
 * 3. buildTheme — monofile composition (header + tokens + structure [+ dark-only])
 * 4. applyPrintInjection — dark print embeds light color tokens
 * 5. renderPaletteMarkdown / syncReadmePalette — docs single source
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  ROOT,
  STRUCTURE_FILES,
  applyPrintInjection,
  buildTheme,
  checkboxCheckImage,
  findHardcodedColors,
  normalizeCss,
  parseTokenMap,
  read,
  renderPaletteMarkdown,
  syncReadmePalette,
  tokenNames,
} from "../lib/theme.mjs";

test("light and dark tokens expose the same custom-property names", () => {
  const light = tokenNames(read(path.join(ROOT, "src/tokens/light.css")));
  const dark = tokenNames(read(path.join(ROOT, "src/tokens/dark.css")));
  assert.deepEqual(light, dark);
  assert.ok(light.includes("--on-accent-color"));
  assert.ok(light.includes("--shadow-panel"));
  assert.ok(light.includes("--checkbox-check-image"));
});

test("font stacks match across light and dark tokens", () => {
  const light = parseTokenMap(read(path.join(ROOT, "src/tokens/light.css")));
  const dark = parseTokenMap(read(path.join(ROOT, "src/tokens/dark.css")));
  for (const name of ["--font-body", "--font-ui", "--font-strong", "--font-mono"]) {
    assert.equal(light.get(name), dark.get(name), name);
  }
});

test("built checkbox image tracks on-accent color", () => {
  for (const mode of ["light", "dark"]) {
    const css = buildTheme(mode);
    // only the primary :root (print injects a second :root in dark)
    const rootStart = css.search(/:root\s*\{/);
    let i = css.indexOf("{", rootStart);
    let depth = 0;
    let end = -1;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    const map = parseTokenMap(css.slice(rootStart, end));
    const expected = checkboxCheckImage(map.get("--on-accent-color"));
    assert.equal(map.get("--checkbox-check-image"), expected, mode);
  }
});

test("structure partials have no hardcoded hex/rgba outside comments", () => {
  for (const file of STRUCTURE_FILES) {
    const css = read(path.join(ROOT, "src/structure", file));
    const hits = findHardcodedColors(css);
    assert.equal(
      hits.length,
      0,
      `${file} has hardcoded colors:\n` +
        hits.map((h) => `  L${h.line}: ${h.text}`).join("\n")
    );
  }
  const darkOnly = read(path.join(ROOT, "src/host/dark-only.css"));
  assert.equal(findHardcodedColors(darkOnly).length, 0);
});

test("buildTheme(light) starts with Kraft Paper header and light bg token", () => {
  const css = buildTheme("light");
  assert.match(css, /^\/\*\*\n \* Kraft Paper\n/);
  assert.match(css, /--bg-color:\s*#faf9f5/i);
  assert.doesNotMatch(css, /暗色专属/);
  assert.doesNotMatch(css, /__INJECT_PRINT_LIGHT_TOKENS__/);
});

test("buildTheme(dark) includes dark-only host adapter and print light tokens", () => {
  const css = buildTheme("dark");
  assert.match(css, /Kraft Paper Dark/);
  assert.match(css, /--bg-color:\s*#262624/i);
  assert.match(css, /暗色专属/);
  assert.match(css, /#typora-source \.cm-header/);
  // print injection should re-assert light paper
  const printIdx = css.indexOf("@media print");
  assert.ok(printIdx > 0);
  const printBlock = css.slice(printIdx, printIdx + 1200);
  assert.match(printBlock, /--bg-color:\s*#faf9f5/i);
  assert.match(printBlock, /--accent-color:\s*#c15f3c/i);
});

test("applyPrintInjection removes marker for light and embeds tokens for dark", () => {
  const structure = "x\n@media print {\n    /* __INJECT_PRINT_LIGHT_TOKENS__ */\n\n    html {}\n}\n";
  const lightTokens = ":root { --bg-color: #faf9f5; --font-body: serif; }\n";
  const lightOut = applyPrintInjection(structure, lightTokens, false);
  assert.doesNotMatch(lightOut, /__INJECT_PRINT_LIGHT_TOKENS__/);
  assert.doesNotMatch(lightOut, /--bg-color/);
  const darkOut = applyPrintInjection(structure, lightTokens, true);
  assert.match(darkOut, /--bg-color:\s*#faf9f5/);
  assert.doesNotMatch(darkOut, /--font-body/);
});

test("built light and dark share normalized structure outside tokens and dark-only", () => {
  const light = buildTheme("light");
  const dark = buildTheme("dark");

  function structureBody(css, mode) {
    // drop header comment
    let body = css.replace(/^\/\*\*[\s\S]*?\*\/\s*/, "");
    // drop first :root block
    const rootStart = body.search(/:root\s*\{/);
    let i = body.indexOf("{", rootStart);
    let depth = 0;
    let end = -1;
    for (; i < body.length; i++) {
      if (body[i] === "{") depth++;
      else if (body[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    body = body.slice(end);
    if (mode === "dark") {
      const idx = body.indexOf(
        "/* ============================================================\n * 暗色专属"
      );
      if (idx >= 0) body = body.slice(0, idx);
      // strip print :root override from dark for comparison
      body = body.replace(
        /(@media print\s*\{)\s*\/\* 暗色主题[\s\S]*?\*\/\s*:root\s*\{[\s\S]*?\n\s*\}/,
        "$1"
      );
    }
    return normalizeCss(body);
  }

  const ls = structureBody(light, "light");
  const ds = structureBody(dark, "dark");
  assert.equal(ls, ds, "structure should match after stripping tokens and dark-only/print override");
});

test("table styles only target content paths and exclude md-grid-board", () => {
  const content = read(path.join(ROOT, "src/structure/02-content.css"));
  // bare `#write table` would paint edit chrome
  assert.doesNotMatch(content, /#write table\s*\{/);
  assert.doesNotMatch(content, /#write table,/);
  assert.doesNotMatch(content, /表格悬浮工具修复/);
  // content paths only
  assert.match(content, /#write \.md-table-fig > table:not\(\.md-grid-board\)/);
  assert.match(content, /#write > table:not\(\.md-grid-board\)/);
  // must not reintroduce wide parent :not() that still hits nested edit chrome
  assert.doesNotMatch(
    content,
    /#write :not\(\.md-table-edit\):not\(\.md-grid-board\):not\(\.md-table-resize\) > table/
  );
});

test("disk monofiles match buildTheme (no stale deliverables)", () => {
  for (const [mode, file] of [
    ["light", "kraft-paper.css"],
    ["dark", "kraft-paper-dark.css"],
  ]) {
    const disk = read(path.join(ROOT, file));
    const built = buildTheme(mode);
    assert.equal(
      disk,
      built,
      `${file} is stale — run npm run build`
    );
  }
});

test("README palette table matches tokens", () => {
  const readme = read(path.join(ROOT, "README.md"));
  const table = renderPaletteMarkdown();
  assert.ok(
    readme.includes(table),
    "README palette out of sync — run npm run build"
  );
});

test("palette markdown includes on-accent and sync replaces markers", () => {
  const table = renderPaletteMarkdown();
  assert.match(table, /on-accent-color/);
  assert.match(table, /#faf9f5/i);
  assert.match(table, /#262624/i);
  const stub = "# x\n\n<!-- palette:start -->\nold\n<!-- palette:end -->\n\n# y\n";
  const synced = syncReadmePalette(stub, table);
  assert.match(synced, /<!-- palette:start -->\n\| 角色 \|/);
  assert.doesNotMatch(synced, /old/);
});

test("parseTokenMap reads checkbox image token", () => {
  const map = parseTokenMap(read(path.join(ROOT, "src/tokens/light.css")));
  assert.ok(map.get("--checkbox-check-image")?.startsWith("url("));
});
