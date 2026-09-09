#!/usr/bin/env bun
/**
 * Bundle the Claude holistic report background job for Netlify (~15 min runtime).
 */
// @ts-nocheck
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "scripts/holistic-health-report-background-entry.ts");
const outdir = join(root, "netlify/functions");

mkdirSync(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: [entry],
  outdir,
  target: "node",
  format: "cjs",
  sourcemap: "none",
  minify: false,
  naming: "holistic-health-report-background.js",
  // Keep Prisma / native clients external so Netlify can resolve platform binaries.
  external: [
    "@prisma/client",
    ".prisma/client",
    "@anthropic-ai/sdk",
    "next",
    "next-auth",
    "next-auth/providers/*",
  ],
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}

const output = result.outputs?.[0]?.path || join(outdir, "holistic-health-report-background.js");
console.log(`Wrote ${output}`);
