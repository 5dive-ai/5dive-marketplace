#!/usr/bin/env node
// Each pack's voice sample: the clip a buyer plays on the marketplace card before
// hiring (DIVE-5649). It is rendered EXACTLY as a box speaks the pack, so what the
// card plays is what the agent will sound like:
//
//   OpenRouter /audio/speech, model google/gemini-3.8-flash-lite-tts,
//   voice = voice.audio.base, instructions = voice.audio.style, pcm -> mp3.
//   text  = "I'm <name>. <index.json sample, or the tagline>"
//
// Keep the style in `instructions`. Putting it into the spoken text instead
// (a prompt prefix) made Gemini read the style aloud on some packs; one clip ran
// 32 s. That is also why this does not use the free Gemini key directly.
//
//   node scripts/voice-samples.mjs --check        # exit 1 on a stale or orphaned sample (CI)
//   node scripts/voice-samples.mjs [slug...]      # (re)render stale or missing samples
//   node scripts/voice-samples.mjs --force <slug> # re-render even when current
//
// Each sample sits beside a sidecar, packs/<slug>/voice-sample.json, that records a
// hash of the inputs it was rendered from (model, base, style, text) and of the mp3
// itself. --check recomputes the input hash from persona.yaml + index.json, so a PR
// that changes a pack's voice, style or sample line without re-rendering goes red.
// CI never calls TTS. A pack with no sample is allowed (its card shows no play
// button); a sidecar without its mp3, or an mp3 without its sidecar, is not.
//
// Rendering needs ffmpeg/ffprobe and an OpenRouter key: $OPENROUTER_API_KEY, or
// the box connector file /etc/5dive/connectors/openrouter (run with sudo).
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
const MP3 = "voice-sample.mp3";
const SIDECAR = "voice-sample.json";

const packsDir = join(ROOT, "packs");
const index = JSON.parse(readFileSync(join(ROOT, "index.json"), "utf8"));
const entries = Object.fromEntries(index.packs.map((p) => [p.slug, p]));

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function inputsFor(slug) {
  const entry = entries[slug];
  if (!entry) throw new Error(`${slug}: not in index.json`);
  const doc = YAML.parse(readFileSync(join(packsDir, slug, "persona.yaml"), "utf8")) || {};
  const audio = (doc.voice && doc.voice.audio) || {};
  const base = typeof audio.base === "string" ? audio.base.trim() : "";
  const style = typeof audio.style === "string" ? audio.style.trim() : "";
  const text = `I'm ${entry.name}. ${entry.sample || entry.tagline || ""}`.trim();
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
  for (const slug of slugs) {
    const mp3 = join(packsDir, slug, MP3);
    const side = join(packsDir, slug, SIDECAR);
    const hasMp3 = existsSync(mp3);
    const hasSide = existsSync(side);
    if (!hasMp3 && !hasSide) { missing.push(slug); continue; }
    if (!hasSide) { errors.push(`${slug}: ${MP3} has no ${SIDECAR}; render it with scripts/voice-samples.mjs, do not drop an mp3 in by hand.`); continue; }
    if (!hasMp3) { errors.push(`${slug}: ${SIDECAR} names a sample but ${MP3} is missing.`); continue; }
    let rec;
    try { rec = JSON.parse(readFileSync(side, "utf8")); } catch (e) { errors.push(`${slug}: ${SIDECAR} does not parse (${e.message})`); continue; }
    const bytes = readFileSync(mp3);
    if (process.env.VOICE_SAMPLE_FAKE_TTS !== "1" && bytes.subarray(0, 13).toString() === "fake mp3 for ") {
      errors.push(`${slug}: ${MP3} is a VOICE_SAMPLE_FAKE_TTS placeholder, not audio; render it for real.`);
      continue;
    }
    if (rec.mp3Sha256 !== sha256(bytes)) {
      errors.push(`${slug}: ${MP3} is not the file its ${SIDECAR} recorded; re-render it with scripts/voice-samples.mjs.`);
      continue;
    }
    const now = inputsFor(slug);
    if (rec.inputsSha256 !== now.hash) {
      const what = ["model", "base", "style", "text"].filter((k) => (rec.inputs || {})[k] !== now[k]);
      errors.push(`${slug}: voice sample is STALE (${what.join(", ") || "inputs"} changed since it was rendered); run: node scripts/voice-samples.mjs ${slug}`);
    }
  }
  if (errors.length) {
    for (const e of errors) console.error(`FAIL ${e}`);
    console.error(`voice-samples: ${errors.length} finding(s) across ${slugs.length} packs.`);
    process.exit(1);
  }
  const have = slugs.length - missing.length;
  console.log(`voice-samples: ${have} of ${slugs.length} packs have a current sample${missing.length ? `; none yet: ${missing.join(", ")}` : ""}.`);
}

function apiKey() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY.trim();
  return readFileSync("/etc/5dive/connectors/openrouter", "utf8").trim();
}

async function render(slug, inp, key) {
  const mp3 = join(packsDir, slug, MP3);
  if (process.env.VOICE_SAMPLE_FAKE_TTS === "1") {
    writeFileSync(mp3, `fake mp3 for ${slug} ${inp.hash}\n`);
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
  const raw = join(packsDir, slug, ".voice-sample.pcm");
  writeFileSync(raw, pcm);
  try {
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, "-c:a", "libmp3lame", "-q:a", "4", mp3]);
  } finally {
    rmSync(raw, { force: true });
  }
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString();
  return Math.round(parseFloat(out) * 10) / 10;
}

async function generate(args) {
  const force = args.includes("--force");
  const wanted = args.filter((a) => !a.startsWith("--"));
  for (const s of wanted) if (!slugs.includes(s)) throw new Error(`unknown pack: ${s}`);
  const todo = wanted.length ? wanted : slugs;
  let key = null;
  let failed = 0;
  for (const slug of todo) {
    const inp = inputsFor(slug);
    const side = join(packsDir, slug, SIDECAR);
    if (!force && existsSync(side) && existsSync(join(packsDir, slug, MP3))) {
      const rec = JSON.parse(readFileSync(side, "utf8"));
      if (rec.inputsSha256 === inp.hash) { console.log(`SKIP ${slug} (current)`); continue; }
    }
    if (!inp.base) { console.error(`FAIL ${slug}: no voice.audio.base, nothing to render`); failed++; continue; }
    if (key === null && process.env.VOICE_SAMPLE_FAKE_TTS !== "1") key = apiKey();
    try {
      const seconds = await render(slug, inp, key);
      const { hash, ...inputs } = inp;
      const rec = { inputs, inputsSha256: hash, mp3Sha256: sha256(readFileSync(join(packsDir, slug, MP3))), seconds };
      writeFileSync(side, JSON.stringify(rec, null, 2) + "\n");
      console.log(`OK   ${slug} ${seconds}s`);
    } catch (e) {
      console.error(`FAIL ${slug}: ${e.message}`);
      failed++;
    }
  }
  if (failed) process.exit(1);
  console.log("now run: node scripts/build-index.mjs  (index.json carries voiceSample + voiceSampleSeconds)");
}

const args = process.argv.slice(2);
if (args.includes("--check")) check();
else await generate(args);
