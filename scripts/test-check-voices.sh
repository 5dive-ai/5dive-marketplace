#!/usr/bin/env bash
# Mutation arms for scripts/check-voices.mjs (DIVE-5452).
#
# Each arm copies the REAL packs/ and teams/index.json into a fixture, plants one
# defect, and asserts the exit code AND that the message names the pack. A rc-only
# assertion stays green when the guard is deleted, so it grades nothing. No
# `set -e`: every arm reports on its own.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
SCRIPT="$HERE/check-voices.mjs"
FIX="$(mktemp -d)"
pass=0; fail=0
trap 'rm -rf "$FIX"' EXIT

ok()  { printf '  PASS  %s\n' "$1"; pass=$((pass+1)); }
bad() { printf '  FAIL  %s\n' "$1"; fail=$((fail+1)); }

# fresh — a clean copy of every persona.yaml and the team index.
fresh() {
  rm -rf "$FIX/tree"; mkdir -p "$FIX/tree/teams"
  for d in "$REPO"/packs/*/; do
    s=$(basename "$d"); mkdir -p "$FIX/tree/packs/$s"
    cp "$d/persona.yaml" "$FIX/tree/packs/$s/"
  done
  cp "$REPO/teams/index.json" "$FIX/tree/teams/"
}
run() { out=$(MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" 2>&1); rc=$?; }

# arm <name> <want-substring> — expects rc=1 and the substring in the output.
arm() {
  run
  if [[ $rc -eq 1 && "$out" == *"$2"* ]]; then ok "$1"; else bad "$1 (rc=$rc, want '$2' in: $out)"; fi
}

fresh; run
if [[ $rc -eq 0 && "$out" == *"every one has its own Gemini voice"* ]]; then ok "the real packs pass"; else bad "the real packs pass (rc=$rc: $out)"; fi

# The row's own case: cue as it shipped in #76, with voice.written and no voice.audio.
fresh
python3 - "$FIX/tree/packs/cue/persona.yaml" <<'PY'
import re, sys
p = sys.argv[1]; s = open(p).read()
s2 = re.sub(r"\n  audio:\n(    .*\n)+", "\n", s, count=1)
assert s2 != s; open(p, "w").write(s2)
PY
arm "cue with voice.audio removed is refused" "cue: no voice.audio.base"

fresh; sed -i 's/^    base: Algenib$/    base: unset/' "$FIX/tree/packs/dave/persona.yaml"
arm "dave with base: unset is refused" 'dave: no voice.audio.base (it is "unset")'

fresh; sed -i 's/^    base: Erinome$/    base: Erinomee/' "$FIX/tree/packs/ada/persona.yaml"
arm "a typo'd base is refused" 'ada: voice.audio.base "Erinomee" is not a Gemini prebuilt voice'

fresh; sed -i 's/^    base: Erinome$/    base: Erinomee\n    provider: elevenlabs/' "$FIX/tree/packs/ada/persona.yaml"
run
if [[ $rc -eq 0 ]]; then ok "a base under another provider is not checked against Gemini's list"; else bad "another provider (rc=$rc: $out)"; fi

# vesper and olivia are both on 5dive-team.
fresh; sed -i 's/^    base: Despina$/    base: Gacrux/' "$FIX/tree/packs/vesper/persona.yaml"
arm "two packs on one team with the same voice are refused" "team 5dive-team: olivia and vesper both speak as Gacrux"

# mike and dario share Puck but share no team, which is allowed.
fresh; run
if [[ $rc -eq 0 ]] && grep -q "base: Puck" "$FIX/tree/packs/mike/persona.yaml"; then ok "a shared voice across different teams passes"; else bad "shared across teams (rc=$rc)"; fi

printf '%d pass, %d fail\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
