#!/usr/bin/env node
// Derive each pack's `rarity` in index.json from its persona.yaml — the single
// source of truth. Rarity is COMPUTED by openagent's computeTier(), never hand
// typed, so the catalog and the spec's deterministic ladder can never drift.
//
//   node scripts/build-index.mjs          # rewrite index.json in place
//   node scripts/build-index.mjs --check  # exit 1 if index.json is stale (CI)
//
// openagent (computeTier + validateDoc + the persona schema) is resolved from
// the @5dive/openagent dependency, or from $OPENAGENT_DIR for a local checkout.
//
// Note on Mythical: the file-derived tier tops out at Legendary. Mythical is
// CONFERRED at runtime by the CLI's signature-verified registry layer (it is
// not farmable from the file), so it is deliberately not stored here.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const require = createRequire(import.meta.url);

function resolveOpenagent() {
  if (process.env.OPENAGENT_DIR) return process.env.OPENAGENT_DIR;
  // package.json: dirname of the resolved entry's lib/ — walk up from validate.js.
  const validatePath = require.resolve("@5dive/openagent/lib/validate.js");
  return join(dirname(validatePath), "..");
}

const OA = resolveOpenagent();
// Resolve transitive runtime dependencies from openagent's package context so
// both npm's hoisted layout and a nested install work.
const requireFromOpenagent = createRequire(join(OA, "package.json"));
const { computeTier } = require(join(OA, "lib", "tier.js"));
const { validateDoc } = require(join(OA, "lib", "validate.js"));
const { didKeyFromPublicKey } = require(join(OA, "lib", "provenance.js"));
const YAML = requireFromOpenagent("yaml");

// Controlled department vocabulary. `department` and `role` in index.json are
// HAND-maintained (persona.yaml is openagent-schema-validated, so they cannot
// live there) — this guard is what keeps them from drifting into free text.
// A department outside the vocabulary is a typo and FAILS --check; a pack with
// no department yet only warns, so adding a pack never reds CI.
const DEPARTMENTS = [
  "Engineering", "Marketing", "Sales", "Finance", "Legal", "Ops",
  "Support", "Creative", "Research", "Leadership", "Personal",
];

const PACKS_DIR = join(ROOT, "packs");
const INDEX_PATH = join(ROOT, "index.json");

function rarityFor(slug) {
  const dir = join(PACKS_DIR, slug);
  const personaPath = join(dir, "persona.yaml");
  if (!existsSync(personaPath)) {
    throw new Error(`pack '${slug}' has no persona.yaml — every pack needs the canonical identity file`);
  }
  const doc = YAML.parse(readFileSync(personaPath, "utf8"));
  const verdict = validateDoc(doc);
  if (!verdict.ok) {
    throw new Error(`pack '${slug}' persona.yaml is not schema-valid:\n  - ${verdict.errors.join("\n  - ")}`);
  }
  // faceResolved: face.ref actually points at a shipped image in the pack.
  const ref = (doc.face && doc.face.ref) || "";
  const faceResolved = ref.startsWith("./") && existsSync(join(dir, ref.slice(2)));
  // inRegistry:false — Mythical is conferred at runtime, not stored (see header).
  const t = computeTier(doc, { faceResolved, schemaValid: true, inRegistry: false });
  // did:key — the persona's portable public address, derived from its signing key.
  // Surfaced in index.json so the gallery can build friendly ids + verified badges
  // for the official cast (Track A). null if a pack persona isn't signed yet.
  let did = null;
  const pubkey = doc.provenance && doc.provenance.created_by && doc.provenance.created_by.key;
  if (pubkey) {
    try { did = didKeyFromPublicKey(pubkey); } catch (_) { did = null; }
  }
  // Skills are CAPABILITY (a separate layer from identity). The pack manifest is
  // the single source of truth — sync them into index.json so the catalog can't
  // drift from what the pack actually bundles. Empty if no manifest/skills.
  let skills = [];
  const manifestPath = join(dir, "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (Array.isArray(m.skills)) skills = m.skills.filter((s) => typeof s === "string");
    } catch (_) { /* leave empty */ }
  }
  // Voice sample (DIVE-5649): the card's play button. Only a sample with its
  // sidecar counts (scripts/voice-samples.mjs --check guards that they agree), so a
  // pack without one carries no field and its card shows no button.
  let voiceSample = null;
  let voiceSampleSeconds = null;
  const sidecarPath = join(dir, "voice-sample.json");
  if (existsSync(sidecarPath) && existsSync(join(dir, "voice-sample.mp3"))) {
    voiceSample = `packs/${slug}/voice-sample.mp3`;
    try {
      const s = JSON.parse(readFileSync(sidecarPath, "utf8")).seconds;
      if (typeof s === "number" && s > 0) voiceSampleSeconds = s;
    } catch (_) { /* leave null; voice-samples --check reds the bad sidecar */ }
  }
  return { rarity: t.tier.toLowerCase(), completeness: t.completeness, level: t.level, did, skills, voiceSample, voiceSampleSeconds };
}

const index = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
const rows = [];
let changed = false;
for (const pack of index.packs) {
  const { rarity, completeness, level, did, skills, voiceSample, voiceSampleSeconds } = rarityFor(pack.slug);
  rows.push({ slug: pack.slug, was: pack.rarity, now: rarity, completeness, level });
  if (pack.rarity !== rarity) changed = true;
  if (pack.did !== did) changed = true;
  if (JSON.stringify(pack.skills || []) !== JSON.stringify(skills)) changed = true;
  pack.rarity = rarity;
  pack.did = did;
  pack.skills = skills;
  for (const [k, v] of [["voiceSample", voiceSample], ["voiceSampleSeconds", voiceSampleSeconds]]) {
    if ((pack[k] ?? null) !== v) changed = true;
    if (v === null) delete pack[k];
    else pack[k] = v;
  }
}
// Reflect the last build date so the catalog timestamp tracks regeneration.
const everyDir = readdirSync(PACKS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const missing = everyDir.filter((d) => !index.packs.some((p) => p.slug === d));
if (missing.length) console.warn(`warning: packs without an index entry: ${missing.join(", ")}`);

// Validate the hand-maintained facet fields (see DEPARTMENTS above).
const badDepartments = index.packs
  .filter((p) => p.department !== undefined && !DEPARTMENTS.includes(p.department))
  .map((p) => `${p.slug}: '${p.department}'`);
const noDepartment = index.packs.filter((p) => p.department === undefined).map((p) => p.slug);
if (noDepartment.length) {
  console.warn(
    `warning: packs with no 'department' (they will not appear under any marketplace filter chip): ${noDepartment.join(", ")}\n` +
      `  pick one of: ${DEPARTMENTS.join(", ")}`,
  );
}

// Russian/Chinese storefront copy is hand-maintained too. Every pack must carry
// all six fields as non-empty strings, and none may be the English tagline
// pasted verbatim (an untranslated copy-paste). Both FAIL --check and the build.
const I18N_FIELDS = ["nameRu", "nameZh", "roleRu", "roleZh", "taglineRu", "taglineZh"];
const badI18n = [];
for (const p of index.packs) {
  const en = typeof p.tagline === "string" ? p.tagline.trim() : "";
  for (const f of I18N_FIELDS) {
    const v = p[f];
    if (typeof v !== "string" || v.trim() === "") {
      badI18n.push(`${p.slug}: '${f}' is missing or empty`);
    } else if (en && v.includes(en)) {
      badI18n.push(`${p.slug}: '${f}' contains the English tagline verbatim (untranslated?)`);
    }
  }
}

const table = rows
  .map((r) => `  ${r.slug.padEnd(8)} ${String(r.was).padEnd(10)} -> ${r.now.padEnd(10)} (L${r.level}, ${r.completeness}% complete)`)
  .join("\n");

if (badDepartments.length) {
  console.error(
    `index.json has departments outside the controlled vocabulary:\n  ${badDepartments.join("\n  ")}\n` +
      `  allowed: ${DEPARTMENTS.join(", ")}`,
  );
  process.exit(1);
}

if (badI18n.length) {
  console.error(`index.json has missing or untranslated Russian/Chinese fields:\n  ${badI18n.join("\n  ")}`);
  process.exit(1);
}

if (process.argv.includes("--check")) {
  if (changed) {
    console.error("index.json rarity is STALE — run `node scripts/build-index.mjs`:\n" + table);
    process.exit(1);
  }
  console.log("index.json rarity is up to date with computed tiers.");
  process.exit(0);
}

const serialized = JSON.stringify(index, null, 2) + "\n";
writeFileSync(INDEX_PATH, serialized);
console.log("computed rarity from persona.yaml (was -> now):\n" + table);
