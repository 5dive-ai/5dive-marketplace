#!/usr/bin/env node
// DIVE-7794: every pack's three first jobs.
//
// Right after Hire, the Mini App offers three small jobs the new agent can do
// (5dive-frontend lib/first-job.ts firstJobsFor). A pack with no `jobs` falls
// back to its DEPARTMENT's three, which is how Pixel the designer got offered
// marketing jobs (lodar, 2026-11-06: "pixel is designer"). So every pack now
// carries its own three, written in its manifest.json and copied into
// index.json by scripts/build-index.mjs.
//
// The rules lodar set for these: at most 4 words, one line on a phone; the
// agent can do it with no context; it is small; it shows what THIS role does.
// The last two are judgement; this checks the parts a script can:
//   - exactly 3 jobs per pack, in index.json AND in the pack's manifest.json,
//     and the two agree (index.json is what the app reads);
//   - each one a non-empty string of at most 4 words, no repeats in a pack,
//     inside what POST /first-jobs takes (1..300 chars, no control characters).
//
//   node scripts/check-jobs.mjs     # exit 1 and name every bad pack
//
// MARKETPLACE_ROOT points it at another tree (scripts/test-check-jobs.sh).
// Dependency-free on purpose (node:fs/path/url only), so CI runs it bare.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.env.MARKETPLACE_ROOT || join(dirname(fileURLToPath(import.meta.url)), "..");
export const JOBS_PER_PACK = 3;
export const MAX_WORDS = 4;

/** What is wrong with one pack's jobs list ([] when nothing). */
export function jobProblems(jobs) {
  if (!Array.isArray(jobs)) return [`has no 'jobs' (needs exactly ${JOBS_PER_PACK})`];
  const out = [];
  if (jobs.length !== JOBS_PER_PACK) out.push(`has ${jobs.length} jobs (needs exactly ${JOBS_PER_PACK})`);
  const seen = new Set();
  for (const j of jobs) {
    if (typeof j !== "string" || j.trim() === "") { out.push(`has an empty or non-text job: ${JSON.stringify(j)}`); continue; }
    if (j !== j.replace(/\s+/g, " ").trim()) out.push(`job '${j}' has extra spaces`);
    if (/[\u0000-\u001f\u007f]/.test(j) || j.length > 300) out.push(`job '${j}' is not one the API takes`);
    const words = j.trim().split(/\s+/).length;
    if (words > MAX_WORDS) out.push(`job '${j}' is ${words} words (at most ${MAX_WORDS})`);
    if (seen.has(j)) out.push(`job '${j}' is listed twice`);
    seen.add(j);
  }
  return out;
}

const index = JSON.parse(readFileSync(join(ROOT, "index.json"), "utf8"));
const bad = [];
for (const p of index.packs ?? []) {
  for (const why of jobProblems(p.jobs)) bad.push(`${p.slug}: index.json ${why}`);
  const mPath = join(ROOT, "packs", p.slug, "manifest.json");
  if (!existsSync(mPath)) continue; // build-index reds a pack with no files
  const m = JSON.parse(readFileSync(mPath, "utf8"));
  for (const why of jobProblems(m.jobs)) bad.push(`${p.slug}: manifest.json ${why}`);
  if (JSON.stringify(m.jobs ?? null) !== JSON.stringify(p.jobs ?? null)) {
    bad.push(`${p.slug}: index.json jobs differ from manifest.json (run \`node scripts/build-index.mjs\`)`);
  }
}

if (bad.length) {
  console.error(`first jobs: ${bad.length} problem(s):\n  ${bad.join("\n  ")}`);
  process.exit(1);
}
console.log(`first jobs: all ${index.packs.length} packs have ${JOBS_PER_PACK} jobs of at most ${MAX_WORDS} words.`);
