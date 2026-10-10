#!/usr/bin/env bash
# Mutation arms for scripts/voice-samples.mjs --check (DIVE-5649).
#
# Each arm copies the REAL index.json and packs (persona + sample + sidecar) into a
# fixture, plants one defect, and asserts the exit code AND that the message names
# the pack. A rc-only assertion stays green when the guard is deleted. The
# "regenerate" arm uses VOICE_SAMPLE_FAKE_TTS=1, so no arm calls TTS. No `set -e`:
# every arm reports on its own.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
SCRIPT="$HERE/voice-samples.mjs"
FIX="$(mktemp -d)"
pass=0; fail=0
trap 'rm -rf "$FIX"' EXIT

ok()  { printf '  PASS  %s\n' "$1"; pass=$((pass+1)); }
bad() { printf '  FAIL  %s\n' "$1"; fail=$((fail+1)); }

fresh() {
  rm -rf "$FIX/tree"; mkdir -p "$FIX/tree"
  cp "$REPO/index.json" "$FIX/tree/"
  cp "$REPO"/voice-sample-lines*.json "$FIX/tree/"
  [[ -f "$REPO/voice-sample-exceptions.json" ]] && cp "$REPO/voice-sample-exceptions.json" "$FIX/tree/"
  for d in "$REPO"/packs/*/; do
    s=$(basename "$d"); mkdir -p "$FIX/tree/packs/$s"
    cp "$d"/persona.yaml "$FIX/tree/packs/$s/"
    for f in "$d"/voice-sample*.mp3 "$d"/voice-sample*.json; do [[ -f "$f" ]] && cp "$f" "$FIX/tree/packs/$s/"; done
  done
}
run() { out=$(MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" "$@" 2>&1); rc=$?; }
arm() {
  local name="$1" want="$2"; shift 2
  run --check
  if [[ $rc -eq 1 && "$out" == *"$want"* ]]; then ok "$name"; else bad "$name (rc=$rc, want '$want' in: $out)"; fi
}

fresh; run --check
if [[ $rc -eq 0 && "$out" == *"have a current sample"* ]]; then ok "the real packs pass"; else bad "the real packs pass (rc=$rc: $out)"; fi

# A RENDERED pack (marcus) whose style changes with nobody re-rendering -> red. This
# is also the negative control for the supplied exemption below: it runs on the
# same tree in which dave's clip is supplied.
R=marcus
grep -q '"source": "supplied"' "$REPO/packs/$R/voice-sample.json" && bad "fixture: $R must be a rendered pack"
fresh; sed -i 's/^    style: Calm, precise, grounded\./    style: Soft Scottish lilt./' "$FIX/tree/packs/$R/persona.yaml"
grep -q 'Soft Scottish lilt' "$FIX/tree/packs/$R/persona.yaml" || bad "fixture: $R style mutation did not apply"
arm "$R's style changed without a new mp3 is refused" "$R: voice sample is STALE (style changed"
# ... and green once it is regenerated (in every language it has: the style is shared).
for L in "" ru zh; do VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" ${L:+--lang=$L} $R >/dev/null 2>&1; done
out=$(VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --check 2>&1); rc=$?
if [[ $rc -eq 0 ]]; then ok "after re-rendering $R the check is green"; else bad "after re-render (rc=$rc: $out)"; fi

fresh; sed -i 's/^    base: Charon$/    base: Puck/' "$FIX/tree/packs/$R/persona.yaml"
arm "$R's base changed is refused" "$R: voice sample is STALE (base changed"

fresh; node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));j[process.argv[2]]="A different line.";require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/voice-sample-lines.json" $R
arm "$R's line changed is refused" "$R: voice sample is STALE (text changed"

fresh; node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));delete j[process.argv[2]];require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/voice-sample-lines.json" $R
arm "a sample whose line was deleted is refused" "$R: voice sample is STALE (text changed"

fresh; node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));j.inputs.model="google/gemini-3.8-flash-tts";j.inputsSha256=require("crypto").createHash("sha256").update(JSON.stringify(j.inputs)).digest("hex");require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/packs/$R/voice-sample.json"
arm "a sample rendered on another model is refused" "$R: voice sample is STALE (model changed"

fresh; printf 'x' >> "$FIX/tree/packs/$R/voice-sample.mp3"
arm "an mp3 swapped by hand is refused" "$R: voice-sample.mp3 is not the file"

fresh; rm "$FIX/tree/packs/$R/voice-sample.json"
arm "an mp3 with no sidecar is refused" "$R: voice-sample.mp3 has no voice-sample.json"

fresh; rm "$FIX/tree/packs/$R/voice-sample.mp3"
arm "a sidecar with no mp3 is refused" "$R: voice-sample.json names a sample but voice-sample.mp3 is missing"

# The fake-TTS seam must never ship: its placeholder bytes are refused outside the arms.
fresh; VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --force $R >/dev/null 2>&1
out=$(MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --check 2>&1); rc=$?
if [[ $rc -eq 1 && "$out" == *"$R: voice-sample.mp3 is a VOICE_SAMPLE_FAKE_TTS placeholder"* ]]; then ok "a fake-TTS placeholder is refused"; else bad "fake placeholder (rc=$rc: $out)"; fi

# A pack with NO sample at all is refused (DIVE-5980), unless it is a named exception.
# Negative control: delete one existing pack's sample and the check must go red.
fresh; rm "$FIX/tree/packs/$R/voice-sample.mp3" "$FIX/tree/packs/$R/voice-sample.json"
arm "a pack with no sample at all is refused" "$R: has no voice-sample.mp3, so its card plays nothing"
setx() { node -e 'const f=process.argv[1],fs=require("fs"),j=fs.existsSync(f)?JSON.parse(fs.readFileSync(f)):{};if(process.argv[3]===undefined)delete j[process.argv[2]];else j[process.argv[2]]=process.argv[3];fs.writeFileSync(f,JSON.stringify(j))' "$FIX/tree/voice-sample-exceptions.json" "$@"; }
setx $R "fixture: awaiting a decision"
run --check
if [[ $rc -eq 0 && "$out" == *"excepted, no sample: "*"$R (fixture: awaiting a decision)"* ]]; then ok "a named exception with no sample passes and is listed with its reason"; else bad "named exception (rc=$rc: $out)"; fi
setx $R ""
arm "an exception with no reason is refused" "$R: has no voice-sample.mp3, so its card plays nothing"
fresh; setx $R "fixture: stale"
arm "an exception for a pack that has a sample is refused" "$R: is in voice-sample-exceptions.json but has a voice-sample.mp3"
fresh; setx no-such-pack "fixture: typo"
arm "an exception for no pack is refused" "no-such-pack: is in voice-sample-exceptions.json but no such pack exists"
# Only English is required: a pack with no ru/zh clip is still fine.
fresh; rm -f "$FIX/tree/packs/$R"/voice-sample.{ru,zh}.{mp3,json}
run --check
if [[ $rc -eq 0 ]]; then ok "a pack with an English sample but no ru/zh clip passes"; else bad "no ru/zh (rc=$rc: $out)"; fi

# IMPORT: a clip spoken on a box is recorded against the CURRENT inputs, so a later
# line change still reds it.
fresh; VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --import $R "$REPO/packs/$R/voice-sample.mp3" >/dev/null 2>&1
run --check
if [[ $rc -eq 0 ]]; then ok "an imported clip is current"; else bad "import (rc=$rc: $out)"; fi
node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));j[process.argv[2]]="A different line.";require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/voice-sample-lines.json" $R
arm "an imported clip goes stale when its line changes" "$R: voice sample is STALE (text changed"

# SUPPLIED: a hand-picked recording (dave, from lodar) is not stale when the style
# changes, because nothing rendered it ...
S=dave
fresh; VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --supply $S "$REPO/packs/$S/voice-sample.mp3" --by=fixture >/dev/null 2>&1
# Only the supplied English clip is under test here; dave's ru/zh clips are rendered,
# so a style change rightly reds them (covered by the language arms below).
rm -f "$FIX/tree/packs/$S"/voice-sample.{ru,zh}.{mp3,json}
sed -i 's/East London Cockney/Soft Scottish lilt/' "$FIX/tree/packs/$S/persona.yaml"
grep -q 'Soft Scottish lilt' "$FIX/tree/packs/$S/persona.yaml" || bad "fixture: $S style mutation did not apply"
run --check
if [[ $rc -eq 0 && "$out" == *"supplied, not rendered: $S (by fixture)"* ]]; then ok "a supplied clip survives a style change and is named as supplied"; else bad "supplied + style change (rc=$rc: $out)"; fi
# ... but its bytes are still pinned ...
printf 'x' >> "$FIX/tree/packs/$S/voice-sample.mp3"
arm "a supplied clip swapped by hand is refused" "$S: voice-sample.mp3 is not the file"
# ... it needs a name behind it ...
fresh; node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));j.source="supplied";delete j.suppliedBy;require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/packs/$R/voice-sample.json"
arm "a supplied mark with no suppliedBy is refused" "$R: voice-sample.json marks the sample supplied but names no suppliedBy"
# ... and a bulk re-render leaves it alone.
fresh; VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --supply $S "$REPO/packs/$S/voice-sample.mp3" --by=fixture >/dev/null 2>&1
before=$(sha256sum < "$FIX/tree/packs/$S/voice-sample.mp3")
sed -i 's/^    style: Calm, precise, grounded\./    style: Soft Scottish lilt./' "$FIX/tree/packs/$R/persona.yaml"
out=$(VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" 2>&1)
after=$(sha256sum < "$FIX/tree/packs/$S/voice-sample.mp3")
if [[ "$before" == "$after" && "$out" == *"SKIP $S (supplied by fixture"* && "$out" == *"OK   $R"* ]]; then ok "a bulk render skips the supplied clip and renders the stale one"; else bad "bulk render vs supplied ($out)"; fi

# OTHER LANGUAGES (DIVE-5659): the ru/zh clips are held to the same rules, under
# their own names, and an English change does not touch them.
for L in ru zh; do
  [[ -f "$REPO/packs/$R/voice-sample.$L.json" ]] || { bad "fixture: $R must have a $L sample"; continue; }
  fresh; node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));j[process.argv[2]]="A different line.";require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/voice-sample-lines.$L.json" $R
  arm "$R's $L line changed is refused" "$R: $L voice sample is STALE (text changed"
  VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --lang=$L $R >/dev/null 2>&1
  out=$(VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --check 2>&1); rc=$?
  if [[ $rc -eq 0 ]]; then ok "after re-rendering $R $L the check is green"; else bad "after $L re-render (rc=$rc: $out)"; fi
  fresh; sed -i 's/^    style: Calm, precise, grounded\./    style: Soft Scottish lilt./' "$FIX/tree/packs/$R/persona.yaml"
  arm "$R's style changed reds the $L clip too" "$R: $L voice sample is STALE (style changed"
  fresh; printf 'x' >> "$FIX/tree/packs/$R/voice-sample.$L.mp3"
  arm "a $L mp3 swapped by hand is refused" "$R: voice-sample.$L.mp3 is not the file"
  fresh; rm "$FIX/tree/packs/$R/voice-sample.$L.json"
  arm "a $L mp3 with no sidecar is refused" "$R: voice-sample.$L.mp3 has no voice-sample.$L.json"
  fresh; node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));j[process.argv[2]]="A different line.";require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/voice-sample-lines.json" $R
  run --check
  if [[ $rc -eq 1 && "$out" != *"$R: $L voice sample is STALE"* ]]; then ok "an English line change does not red the $L clip"; else bad "English change vs $L (rc=$rc: $out)"; fi
done

echo "test-voice-samples: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
