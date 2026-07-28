#!/usr/bin/env node
/**
 * CI-facing checks (C3): token parity, structure hex lint, build integrity.
 * Exit 0 on success; non-zero + messages on failure.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(
  process.execPath,
  ["--test", path.join(root, "scripts/test/theme.test.mjs")],
  { stdio: "inherit", cwd: root }
);
process.exit(r.status ?? 1);
