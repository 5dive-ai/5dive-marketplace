#!/usr/bin/env node
// Each pack's voice sample: the clip a buyer plays on the marketplace card before
// hiring (DIVE-5649). It is rendered EXACTLY as a box speaks the pack, so what the
// card plays is what the agent will sound like:
//
//   model google/gemini-3.8-flash-lite-tts (a box's default),
//   voice = voice.audio.base, instructions = voice.audio.style,
//   text  = the pack's in-character line in voice-sample-lines.json.
//
// The committed clips were spoken by a real box's own 5dive-speak and brought in
// with --import (lodar reviewed each one, 2026-10-06). This script can also render
// the same inputs through OpenRouter /audio/speech (pcm -> mp3).
//
// Keep the style in `instructions`. Putting it into the spoken text instead
// (a prompt prefix) made Gemini read the style aloud on some packs; one clip ran
// 32 s. That is also why this does not use the free Gemini key directly.
//
//   node scripts/voice-samples.mjs --check        # exit 1 on a stale or orphaned sample (CI)
//   node scripts/voice-samples.mjs [slug...]      # (re)render stale or missing samples
//   node scripts/voice-samples.mjs --force <slug> # re-render even when current
//   node scripts/voice-samples.mjs --import <slug> <file.mp3>
//                                                 # record a clip spoken elsewhere (a box) from the current inputs
//   node scripts/voice-samples.mjs --supply <slug> <file.mp3> --by=<who> [--note=<why>]
//                                                 # use a hand-supplied clip instead of a render
//
// Add --lang=ru or --lang=zh to any of the last four for the same pack's clip in that
// language (DIVE-5659): packs/<slug>/voice-sample.<lang>.mp3 + .<lang>.json, its line in
// voice-sample-lines.<lang>.json. Same voice, same style, same model; only the line
// differs, and it is the agent's own words in that language. --check covers every
// language; the English files keep their names.
//
// Each sample sits beside a sidecar, packs/<slug>/voice-sample.json, that records a
// hash of the inputs it was rendered from (model, base, style, text) and of the mp3
// itself. --check recomputes the input hash from persona.yaml + index.json, so a PR
// that changes a pack's voice, style or sample line without re-rendering goes red.
// CI never calls TTS. A pack with no sample is allowed (its card shows no play
// button); a sidecar without its mp3, or an mp3 without its sidecar, is not.
//
// A SUPPLIED sample (sidecar "source": "supplied") is a real recording somebody
// chose for the card, e.g. dave's clip from lodar. Nothing rendered it, so a style
// change cannot make it stale: --check still pins its mp3 hash and names it in its
// summary, and the generator skips it unless --force re-renders over it.
//
// Rendering needs ffmpeg/ffprobe and an OpenRouter key: $OPENROUTER_API_KEY, or a
// box connector file under /etc/5dive/connectors (see KEY_FILES; run with sudo).
// MARKETPLACE_ROOT points it at a fixture tree (scripts/test-voice-samples.sh);
// VOICE_SAMPLE_FAKE_TTS=1 writes placeholder bytes instead of calling the API,
// for those arms only; --check refuses a placeholder unless the same flag is set.

import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.MARKETPLACE_ROOT || join(__dirname, "..");
const require = createRequire(import.meta.url);

// Same resolution as build-index.mjs: yaml comes from openagent's package context.
const OA = process.env.OPENAGENT_DIR || join(dirname(require.resolve("@5dive/openagent/lib/validate.js")), "..");
const YAML = createRequire(join(OA, "package.json"))("yaml");

export const MODEL = "google/gemini-3.8-flash-lite-tts";
// "" is English, the card's default clip; the others are optional per pack.
const LANGS = ["", "ru", "zh"];
const at = (lang) => ({
  MP3: lang ? `voice-sample.${lang}.mp3` : "voice-sample.mp3",
  SIDECAR: lang ? `voice-sample.${lang}.json` : "voice-sample.json",
  LINES: lang ? `voice-sample-lines.${lang}.json` : "voice-sample-lines.json",
  what: lang ? `${lang} voice sample` : "voice sample",
  flag: lang ? ` --lang=${lang}` : "",
});

const packsDir = join(ROOT, "packs");
const index = JSON.parse(readFileSync(join(ROOT, "index.json"), "utf8"));
const entries = Object.fromEntries(index.packs.map((p) => [p.slug, p]));
// What each pack says on its card: one in-character line, in the agent's own words.
const lines = Object.fromEntries(LANGS.map((lang) => {
  const f = join(ROOT, at(lang).LINES);
  return [lang, existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {}];
}));

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function inputsFor(slug, lang = "") {
  const entry = entries[slug];
  if (!entry) throw new Error(`${slug}: not in index.json`);
  const doc = YAML.parse(readFileSync(join(packsDir, slug, "persona.yaml"), "utf8")) || {};
  const audio = (doc.voice && doc.voice.audio) || {};
  const base = typeof audio.base === "string" ? audio.base.trim() : "";
  const style = typeof audio.style === "string" ? audio.style.trim() : "";
  const text = typeof lines[lang][slug] === "string" ? lines[lang][slug].trim() : "";
  const inputs = { model: MODEL, base, style, text };
  return { ...inputs, hash: sha256(JSON.stringify(inputs)) };
}

const slugs = readdirSync(packsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(packsDir, d.name, "persona.yaml")))
  .map((d) => d.name)
  .sort();

function check() {
  const errors = [];
  const missing = [];
  const supplied = [];
  const langs = Object.fromEntries(LANGS.filter(Boolean).map((l) => [l, 0]));
  for (const slug of slugs) for (const lang of LANGS) {
    const { MP3, SIDECAR, what, flag } = at(lang);
    const mp3 = join(packsDir, slug, MP3);
    const side = join(packsDir, slug, SIDECAR);
    const hasMp3 = existsSync(mp3);
    const hasSide = existsSync(side);
    if (!hasMp3 && !hasSide) { if (!lang) missing.push(slug); continue; }
    if (!hasSide) { errors.push(`${slug}: ${MP3} has no ${SIDECAR}; render it with scripts/voice-samples.mjs${flag}, do not drop an mp3 in by hand.`); continue; }
    if (!hasMp3) { errors.push(`${slug}: ${SIDECAR} names a sample but ${MP3} is missing.`); continue; }
    let rec;
    try { rec = JSON.parse(readFileSync(side, "utf8")); } catch (e) { errors.push(`${slug}: ${SIDECAR} does not parse (${e.message})`); continue; }
    const bytes = readFileSync(mp3);
    if (process.env.VOICE_SAMPLE_FAKE_TTS !== "1" && bytes.subarray(0, 13).toString() === "fake mp3 for ") {
      errors.push(`${slug}: ${MP3} is a VOICE_SAMPLE_FAKE_TTS placeholder, not audio; render it for real.`);
      continue;
    }
    if (rec.mp3Sha256 !== sha256(bytes)) {
      errors.push(`${slug}: ${MP3} is not the file its ${SIDECAR} recorded; re-render it with scripts/voice-samples.mjs${flag}.`);
      continue;
    }
    if (lang) langs[lang]++;
    if (rec.source === "supplied") {
      if (!rec.suppliedBy) errors.push(`${slug}: ${SIDECAR} marks the sample supplied but names no suppliedBy; use --supply ... --by=<who>.`);
      else supplied.push(`${slug}${lang ? ` ${lang}` : ""} (by ${rec.suppliedBy})`);
      continue;
    }
    const now = inputsFor(slug, lang);
    if (rec.inputsSha256 !== now.hash) {
      const moved = ["model", "base", "style", "text"].filter((k) => (rec.inputs || {})[k] !== now[k]);
      errors.push(`${slug}: ${what} is STALE (${moved.join(", ") || "inputs"} changed since it was rendered); run: node scripts/voice-samples.mjs${flag} ${slug}`);
    }
  }
  if (errors.length) {
    for (const e of errors) console.error(`FAIL ${e}`);
    console.error(`voice-samples: ${errors.length} finding(s) across ${slugs.length} packs.`);
    process.exit(1);
  }
  const have = slugs.length - missing.length;
  const other = Object.entries(langs).map(([l, n]) => `${l} ${n}`).join(", ");
  console.log(`voice-samples: ${have} of ${slugs.length} packs have a current sample (other languages: ${other})${supplied.length ? `; supplied, not rendered: ${supplied.join(", ")}` : ""}${missing.length ? `; none yet: ${missing.join(", ")}` : ""}.`);
}

// The box's dedicated key for this script comes first. The general connector key is
// capped and ran out partway through the first full render (2026-10-06).
const KEY_FILES = ["/etc/5dive/connectors/openrouter-voice-samples", "/etc/5dive/connectors/openrouter"];

function apiKey() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY.trim();
  for (const f of KEY_FILES) if (existsSync(f)) return readFileSync(f, "utf8").trim();
  throw new Error(`no OpenRouter key: set OPENROUTER_API_KEY or provide ${KEY_FILES.join(" or ")}`);
}

async function render(slug, inp, key, lang) {
  const mp3 = join(packsDir, slug, at(lang).MP3);
  if (process.env.VOICE_SAMPLE_FAKE_TTS === "1") {
    writeFileSync(mp3, `fake mp3 for ${slug}${lang ? ` ${lang}` : ""} ${inp.hash}\n`);
    return 1;
  }
  const body = { model: MODEL, input: inp.text, voice: inp.base, response_format: "pcm" };
  if (inp.style) body.instructions = inp.style;
  const res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const pcm = Buffer.from(await res.arrayBuffer());
  if (res.status !== 200 || pcm.length === 0) throw new Error(`http ${res.status}: ${pcm.subarray(0, 200).toString()}`);
  const raw = join(packsDir, slug, `.${at(lang).MP3}.pcm`);
  writeFileSync(raw, pcm);
  try {
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, "-c:a", "libmp3lame", "-q:a", "4", mp3]);
  } finally {
    rmSync(raw, { force: true });
  }
  return probeSeconds(mp3);
}

function probeSeconds(mp3) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString();
  return Math.round(parseFloat(out) * 10) / 10;
}

function langOf(args) {
  const lang = (args.find((a) => a.startsWith("--lang=")) || "").slice(7);
  if (!LANGS.includes(lang)) throw new Error(`--lang must be one of: ${LANGS.filter(Boolean).join(", ")}`);
  return lang;
}

function supply(args) {
  const [slug, file] = args.filter((a) => !a.startsWith("--"));
  const opt = (k) => (args.find((a) => a.startsWith(`--${k}=`)) || "").slice(k.length + 3);
  const by = opt("by");
  if (!slug || !file || !by) throw new Error("usage: --supply <slug> <file.mp3> --by=<who> [--note=<why>]");
  if (!slugs.includes(slug)) throw new Error(`unknown pack: ${slug}`);
  const lang = langOf(args);
  const { MP3, SIDECAR } = at(lang);
  const bytes = readFileSync(file);
  const mp3 = join(packsDir, slug, MP3);
  writeFileSync(mp3, bytes);
  const seconds = process.env.VOICE_SAMPLE_FAKE_TTS === "1" ? 1 : probeSeconds(mp3);
  const rec = { source: "supplied", suppliedBy: by, ...(opt("note") ? { note: opt("note") } : {}), mp3Sha256: sha256(bytes), seconds };
  writeFileSync(join(packsDir, slug, SIDECAR), JSON.stringify(rec, null, 2) + "\n");
  console.log(`OK   ${slug}${lang ? ` ${lang}` : ""} supplied by ${by}, ${seconds}s`);
  console.log("now run: node scripts/build-index.mjs  (index.json carries voiceSample + voiceSampleSeconds)");
}

function importClip(args) {
  const [slug, file] = args.filter((a) => !a.startsWith("--"));
  if (!slug || !file) throw new Error("usage: --import <slug> <file.mp3>");
  if (!slugs.includes(slug)) throw new Error(`unknown pack: ${slug}`);
  const lang = langOf(args);
  const { MP3, SIDECAR, LINES } = at(lang);
  const inp = inputsFor(slug, lang);
  if (!inp.base || !inp.text) throw new Error(`${slug}: needs voice.audio.base and a line in ${LINES}`);
  const bytes = readFileSync(file);
  const mp3 = join(packsDir, slug, MP3);
  writeFileSync(mp3, bytes);
  const seconds = process.env.VOICE_SAMPLE_FAKE_TTS === "1" ? 1 : probeSeconds(mp3);
  const { hash, ...inputs } = inp;
  writeFileSync(join(packsDir, slug, SIDECAR), JSON.stringify({ inputs, inputsSha256: hash, mp3Sha256: sha256(bytes), seconds }, null, 2) + "\n");
  console.log(`OK   ${slug}${lang ? ` ${lang}` : ""} imported, ${seconds}s`);
}

async function generate(args) {
  const force = args.includes("--force");
  const lang = langOf(args);
  const { MP3, SIDECAR, LINES } = at(lang);
  const tag = lang ? ` ${lang}` : "";
  const wanted = args.filter((a) => !a.startsWith("--"));
  for (const s of wanted) if (!slugs.includes(s)) throw new Error(`unknown pack: ${s}`);
  const todo = wanted.length ? wanted : slugs;
  let key = null;
  let failed = 0;
  for (const slug of todo) {
    const inp = inputsFor(slug, lang);
    const side = join(packsDir, slug, SIDECAR);
    if (!force && existsSync(side) && existsSync(join(packsDir, slug, MP3))) {
      const rec = JSON.parse(readFileSync(side, "utf8"));
      if (rec.source === "supplied") { console.log(`SKIP ${slug}${tag} (supplied by ${rec.suppliedBy}; --force renders over it)`); continue; }
      if (rec.inputsSha256 === inp.hash) { console.log(`SKIP ${slug}${tag} (current)`); continue; }
    }
    if (!inp.base) { console.error(`FAIL ${slug}${tag}: no voice.audio.base, nothing to render`); failed++; continue; }
    if (!inp.text) {
      // An optional language skips a pack with no line in it; English has always failed here.
      if (lang && !wanted.length) { console.log(`SKIP ${slug}${tag} (no line in ${LINES})`); continue; }
      console.error(`FAIL ${slug}${tag}: no line in ${LINES}, nothing to say`); failed++; continue;
    }
    if (key === null && process.env.VOICE_SAMPLE_FAKE_TTS !== "1") key = apiKey();
    try {
      const seconds = await render(slug, inp, key, lang);
      const { hash, ...inputs } = inp;
      const rec = { inputs, inputsSha256: hash, mp3Sha256: sha256(readFileSync(join(packsDir, slug, MP3))), seconds };
      writeFileSync(side, JSON.stringify(rec, null, 2) + "\n");
      console.log(`OK   ${slug}${tag} ${seconds}s`);
    } catch (e) {
      console.error(`FAIL ${slug}${tag}: ${e.message}`);
      failed++;
    }
  }
  if (failed) process.exit(1);
  console.log("now run: node scripts/build-index.mjs  (index.json carries voiceSample + voiceSampleSeconds + voiceSampleLang)");
}

const args = process.argv.slice(2);
if (args.includes("--check")) check();
else if (args[0] === "--supply") supply(args.slice(1));
else if (args[0] === "--import") importClip(args.slice(1));
else await generate(args);
