#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  renderPaletteMarkdown,
  syncReadmePalette,
  writeThemes,
} from "./lib/theme.mjs";

const { light, dark } = writeThemes();
console.log(
  `built kraft-paper.css (${light.split("\n").length} lines), kraft-paper-dark.css (${dark.split("\n").length} lines)`
);

const readmePath = path.join(ROOT, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");
if (readme.includes("<!-- palette:start -->")) {
  fs.writeFileSync(
    readmePath,
    syncReadmePalette(readme, renderPaletteMarkdown())
  );
  console.log("synced README palette table");
}
