#!/usr/bin/env node
// Every pack speaks in its OWN voice (DIVE-5452).
//
// A pack with no `voice.audio.base` does not fail anywhere: the box quietly speaks
// it in the default voice, Kore, which is a female Gemini voice. That is how cue
// (a man) shipped speaking as a woman, and how 24 of 32 packs ended up sharing one
// voice. This check makes the gap loud at PR time instead of after a customer hears it.
//
//   node scripts/check-voices.mjs        # exit 1 on any finding (CI)
//
// It refuses, per pack:
//   1. no voice.audio.base, or base "unset" (dave carried that placeholder),
//   2. a base that is not one of Gemini's 30 prebuilt voices, when the pack does
//      not name another provider. A typo is not an error on the box either: the
//      TTS call fails and the agent falls back to Kore, the same silent bug.
// and per team template:
//   3. two packs on one roster (teams/index.json) with the same base.
//
// It does NOT judge whether a voice fits the face. Gender and age are a reading of
// the face anchor and avatar, made when the base is chosen; the genders below are
// listed so a reviewer can see which pool a pick came from.
//
// MARKETPLACE_ROOT overrides the repo root so the mutation arms
// (scripts/test-check-voices.sh) can run it against a fixture tree.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.MARKETPLACE_ROOT || join(__dirname, "..");
const require = createRequire(import.meta.url);

// Same resolution as build-index.mjs: yaml comes from openagent's package context.
const OA = process.env.OPENAGENT_DIR || join(dirname(require.resolve("@5dive/openagent/lib/validate.js")), "..");
const YAML = createRequire(join(OA, "package.json"))("yaml");

// Google's Chirp 3 HD list (14 female, 16 male), the same table the box's free
// backend maps from (5dive-api scripts/inc/voice-backend.sh VOICE_EDGE_TABLE).
const GEMINI_VOICES = {
  Zephyr: "F", Kore: "F", Leda: "F", Aoede: "F", Callirrhoe: "F", Autonoe: "F",
  Despina: "F", Erinome: "F", Laomedeia: "F", Achernar: "F", Gacrux: "F",
  Pulcherrima: "F", Vindemiatrix: "F", Sulafat: "F",
  Puck: "M", Charon: "M", Fenrir: "M", Orus: "M", Enceladus: "M", Iapetus: "M",
  Umbriel: "M", Algieba: "M", Algenib: "M", Rasalgethi: "M", Alnilam: "M",
  Schedar: "M", Achird: "M", Zubenelgenubi: "M", Sadachbia: "M", Sadaltager: "M",
};

const errors = [];
const bases = {};
const packsDir = join(ROOT, "packs");
const slugs = readdirSync(packsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(packsDir, d.name, "persona.yaml")))
  .map((d) => d.name)
  .sort();

for (const slug of slugs) {
  let doc;
  try {
    doc = YAML.parse(readFileSync(join(packsDir, slug, "persona.yaml"), "utf8")) || {};
  } catch (e) {
    errors.push(`${slug}: persona.yaml does not parse (${e.message.split("\n")[0]})`);
    continue;
  }
  const audio = (doc.voice && doc.voice.audio) || {};
  const base = typeof audio.base === "string" ? audio.base.trim() : "";
  if (!base || base.toLowerCase() === "unset") {
    errors.push(`${slug}: no voice.audio.base${base ? ' (it is "unset")' : ""}; the agent would speak in the box default, Kore (female). Pick a Gemini voice that matches the character.`);
    continue;
  }
  const provider = audio.provider || "google-gemini";
  if (provider === "google-gemini" && !(base in GEMINI_VOICES)) {
    errors.push(`${slug}: voice.audio.base "${base}" is not a Gemini prebuilt voice; the TTS call would fail and fall back to Kore. One of: ${Object.keys(GEMINI_VOICES).join(", ")}.`);
    continue;
  }
  bases[slug] = base;
}

const teamsIndex = join(ROOT, "teams", "index.json");
if (existsSync(teamsIndex)) {
  for (const company of JSON.parse(readFileSync(teamsIndex, "utf8")).companies || []) {
    const seen = {};
    for (const seat of company.roster || []) {
      const base = seat.pack && bases[seat.pack];
      if (!base) continue;
      if (seen[base] && seen[base] !== seat.pack) {
        errors.push(`team ${company.slug}: ${seen[base]} and ${seat.pack} both speak as ${base}; two agents on one team must not share a voice.`);
      } else {
        seen[base] = seat.pack;
      }
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`);
  console.error(`check-voices: ${errors.length} finding(s) across ${slugs.length} packs.`);
  process.exit(1);
}
console.log(`check-voices: ${slugs.length} packs, every one has its own Gemini voice; no team shares one.`);
