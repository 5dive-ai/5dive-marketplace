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
  for d in "$REPO"/packs/*/; do
    s=$(basename "$d"); mkdir -p "$FIX/tree/packs/$s"
    cp "$d"/persona.yaml "$FIX/tree/packs/$s/"
    for f in voice-sample.mp3 voice-sample.json; do [[ -f "$d/$f" ]] && cp "$d/$f" "$FIX/tree/packs/$s/"; done
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

# The row's acceptance: dave's style changes and nobody re-renders -> red ...
fresh; sed -i 's/East London Cockney/Soft Scottish lilt/' "$FIX/tree/packs/dave/persona.yaml"
grep -q 'Soft Scottish lilt' "$FIX/tree/packs/dave/persona.yaml" || bad "fixture: dave style mutation did not apply"
arm "dave's style changed without a new mp3 is refused" "dave: voice sample is STALE (style changed"
# ... and green once it is regenerated.
VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" dave >/dev/null 2>&1
out=$(VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --check 2>&1); rc=$?
if [[ $rc -eq 0 ]]; then ok "after re-rendering dave the check is green"; else bad "after re-render (rc=$rc: $out)"; fi

fresh; sed -i 's/^    base: Algenib$/    base: Puck/' "$FIX/tree/packs/dave/persona.yaml"
arm "dave's base changed is refused" "dave: voice sample is STALE (base changed"

fresh; node -e 'const f=process.argv[1],j=JSON.parse(require("fs").readFileSync(f));j.packs.find(p=>p.slug==="dave").sample="new line";require("fs").writeFileSync(f,JSON.stringify(j))' "$FIX/tree/index.json"
arm "dave's sample line changed is refused" "dave: voice sample is STALE (text changed"

fresh; printf 'x' >> "$FIX/tree/packs/dave/voice-sample.mp3"
arm "an mp3 swapped by hand is refused" "dave: voice-sample.mp3 is not the file"

fresh; rm "$FIX/tree/packs/dave/voice-sample.json"
arm "an mp3 with no sidecar is refused" "dave: voice-sample.mp3 has no voice-sample.json"

fresh; rm "$FIX/tree/packs/dave/voice-sample.mp3"
arm "a sidecar with no mp3 is refused" "dave: voice-sample.json names a sample but voice-sample.mp3 is missing"

# The fake-TTS seam must never ship: its placeholder bytes are refused outside the arms.
fresh; VOICE_SAMPLE_FAKE_TTS=1 MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --force dave >/dev/null 2>&1
out=$(MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" --check 2>&1); rc=$?
if [[ $rc -eq 1 && "$out" == *"dave: voice-sample.mp3 is a VOICE_SAMPLE_FAKE_TTS placeholder"* ]]; then ok "a fake-TTS placeholder is refused"; else bad "fake placeholder (rc=$rc: $out)"; fi

fresh; rm "$FIX/tree/packs/dave/voice-sample.mp3" "$FIX/tree/packs/dave/voice-sample.json"
run --check
if [[ $rc -eq 0 && "$out" == *"dave"* ]]; then ok "a pack with no sample at all is allowed (listed, not refused)"; else bad "no sample (rc=$rc: $out)"; fi

echo "test-voice-samples: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
