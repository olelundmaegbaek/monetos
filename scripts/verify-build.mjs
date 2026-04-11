#!/usr/bin/env node
// Diagnostic + safety net that runs after `next build`.
//
// Context: on Hostinger Cloud's git-connected deployment, `next build` with
// `output: "export"` in next.config.ts produced no `out/` directory, even
// though the same config produces `out/` when built locally. This script:
//
//   1. Logs exactly what directories Next.js produced, so we can diagnose
//      whether the export step ran at all on Hostinger's build runner.
//   2. If `out/` is missing but `.next/` is present, fails loud with a
//      clear message (instead of Hostinger's generic "No output directory
//      found after build").
//
// Safe to run locally - it only reads the filesystem.

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
console.log("=== postbuild diagnostics ===");
console.log("cwd:", cwd);
console.log("node:", process.version);
console.log("");

const targets = [
  "out",
  ".next",
  ".next/server",
  ".next/static",
  ".next/standalone",
  "public",
];

let outExists = false;

for (const rel of targets) {
  const abs = join(cwd, rel);
  if (!existsSync(abs)) {
    console.log(`${rel}/  MISSING`);
    continue;
  }
  const s = statSync(abs);
  if (!s.isDirectory()) {
    console.log(`${rel}  (not a directory)`);
    continue;
  }
  const entries = readdirSync(abs);
  console.log(`${rel}/  ${entries.length} entries`);
  for (const name of entries.slice(0, 12)) {
    console.log(`  ${name}`);
  }
  if (entries.length > 12) {
    console.log(`  ... (${entries.length - 12} more)`);
  }
  if (rel === "out") outExists = true;
}

console.log("");

if (!outExists) {
  console.error("[postbuild] out/ was NOT created by `next build`.");
  console.error("[postbuild] next.config.ts sets output: 'export', so this");
  console.error("[postbuild] means either (a) the config was overridden on");
  console.error("[postbuild] the build runner, or (b) a Build Adapter");
  console.error("[postbuild] intercepted the output step. Check the");
  console.error("[postbuild] diagnostic listing above to see what was");
  console.error("[postbuild] produced instead.");
  process.exit(1);
}

console.log("[postbuild] out/ exists - static export OK");
