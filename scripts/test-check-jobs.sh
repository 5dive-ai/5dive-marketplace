#!/usr/bin/env bash
# Mutation arms for scripts/check-jobs.mjs (DIVE-7794).
#
# Each arm copies the REAL index.json and every manifest.json into a fixture,
# plants one defect, and asserts exit 1 AND that the message names the pack and
# the defect. A rc-only assertion stays green when the guard is deleted. No
# `set -e`: every arm reports on its own.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
SCRIPT="$HERE/check-jobs.mjs"
FIX="$(mktemp -d)"
pass=0; fail=0
trap 'rm -rf "$FIX"' EXIT

ok()  { printf '  PASS  %s\n' "$1"; pass=$((pass+1)); }
bad() { printf '  FAIL  %s\n' "$1"; fail=$((fail+1)); }

fresh() {
  rm -rf "$FIX/tree"; mkdir -p "$FIX/tree/packs"
  cp "$REPO/index.json" "$FIX/tree/"
  for d in "$REPO"/packs/*/; do
    s=$(basename "$d"); mkdir -p "$FIX/tree/packs/$s"
    cp "$d/manifest.json" "$FIX/tree/packs/$s/"
  done
}
run() { out=$(MARKETPLACE_ROOT="$FIX/tree" node "$SCRIPT" 2>&1); rc=$?; }
# edit <file> <js expression on `d`> — rewrite a JSON file in the fixture.
edit() { node -e 'const f=process.argv[1];const fs=require("fs");const d=JSON.parse(fs.readFileSync(f,"utf8"));(new Function("d",process.argv[2]))(d);fs.writeFileSync(f,JSON.stringify(d,null,2))' "$FIX/tree/$1" "$2"; }
# both <slug> <js on `p`> — the same edit to the index entry and the manifest, so only the rule under test trips.
both() { edit index.json "const p=d.packs.find(x=>x.slug==='$1');$2"; edit "packs/$1/manifest.json" "const p=d;$2"; }

arm() {
  local name="$1" want="$2"
  run
  if [ "$rc" = 1 ] && grep -qF -- "$want" <<<"$out"; then ok "$name"
  else bad "$name (rc=$rc, wanted '$want')"; printf '%s\n' "$out" | sed 's/^/        /'; fi
}

echo "check-jobs mutation arms"

fresh; run
if [ "$rc" = 0 ]; then ok "the real tree passes"; else bad "the real tree passes (rc=$rc)"; printf '%s\n' "$out"; fi

fresh; both pixel 'delete p.jobs';                          arm "a pack with no jobs"           "pixel: index.json has no 'jobs'"
fresh; both pixel 'p.jobs=p.jobs.slice(0,2)';               arm "a pack with two jobs"          "pixel: index.json has 2 jobs"
fresh; both pixel 'p.jobs.push("Draw a mascot")';           arm "a pack with four jobs"         "pixel: index.json has 4 jobs"
fresh; both quant 'p.jobs[0]="Sum up all of today'"'"'s markets"'; arm "a six-word job"      "is 6 words (at most 4)"
fresh; both dojo 'p.jobs[1]=p.jobs[0]';                     arm "a job listed twice"            "dojo: index.json job"
fresh; both clicker 'p.jobs[2]="  "';                       arm "an empty job"                  "clicker: index.json has an empty"
fresh; both clicker 'p.jobs[2]="Screenshot  a website"';    arm "a job with a double space"     "has extra spaces"
fresh; edit packs/pixel/manifest.json 'd.jobs[0]="Draw a mascot"'; arm "manifest and index disagree" "pixel: index.json jobs differ from manifest.json"
fresh; edit packs/pixel/manifest.json 'delete d.jobs';      arm "a manifest with no jobs"       "pixel: manifest.json has no 'jobs'"

echo "$pass pass, $fail fail"
[ "$fail" = 0 ]
