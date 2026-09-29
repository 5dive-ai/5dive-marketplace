#!/usr/bin/env bash
# Mutation arms for scripts/check-portraits.py: a check that cannot go red is not a check.
# Plants off-ratio copies of the reference avatar (packs/desk) in a scratch packs/ tree and
# asserts each is refused, then that the known-exception ratchet refuses a stale entry.
#   PY=/path/to/python-with-opencv bash scripts/test-check-portraits.sh
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PY="${PY:-python3}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
pass=0; fail=0
okk() { echo "ok: $1"; pass=$((pass+1)); }
bad() { echo "FAIL: $1"; fail=$((fail+1)); }

# A scratch repo root: the checker reads PORTRAITS.md next to its own scripts/ dir.
mkdir -p "$TMP/scripts" "$TMP/packs"
cp "$ROOT/scripts/check-portraits.py" "$ROOT/scripts/frame-portrait.py" "$TMP/scripts/"
cp "$ROOT/PORTRAITS.md" "$TMP/PORTRAITS.md"
plant() { # <pack> <python expr over img -> out>
  mkdir -p "$TMP/packs/$1"
  "$PY" - "$ROOT/packs/desk/avatar.png" "$TMP/packs/$1/avatar.png" "$2" <<'EOF'
import sys, cv2, numpy as np
img = cv2.imread(sys.argv[1]); h, w = img.shape[:2]
out = eval(sys.argv[3]); cv2.imwrite(sys.argv[2], out)
EOF
}
check() { OUT=$("$PY" "$TMP/scripts/check-portraits.py" "$@" 2>&1); RC=$?; }

# The positive control: the unmodified reference passes.
plant ref 'img'
check "$TMP/packs/ref/avatar.png"
(( RC == 0 )) && [[ "$OUT" == "ok "* ]] && okk 'the unmodified reference (desk) passes' || bad "reference: rc=$RC $OUT"

# Too loose: the reference shrunk onto a same-colour canvas twice its size (face_h halves).
plant loose 'cv2.copyMakeBorder(img, h//2, h//2, w//2, w//2, cv2.BORDER_REPLICATE)'
check "$TMP/packs/loose/avatar.png"
(( RC == 1 )) && [[ "$OUT" == *"face_h="* ]] && okk 'a too-loose (OINOA-style) avatar fails on face_h' || bad "loose: rc=$RC $OUT"

# Too tight: the middle 70% of the reference, upscaled back (face_h grows ~1.4x).
plant tight 'cv2.resize(img[int(h*.15):int(h*.85), int(w*.15):int(w*.85)], (w, h))'
check "$TMP/packs/tight/avatar.png"
(( RC == 1 )) && [[ "$OUT" == *"face_h="* ]] && okk 'a too-tight avatar fails on face_h' || bad "tight: rc=$RC $OUT"

# Off-centre: shift the reference 20% to the right, filling with the edge colour.
plant offx 'cv2.warpAffine(img, np.float32([[1,0,w*.2],[0,1,0]]), (w, h), borderMode=cv2.BORDER_REPLICATE)'
check "$TMP/packs/offx/avatar.png"
(( RC == 1 )) && [[ "$OUT" == *"centre_x="* ]] && okk 'an off-centre avatar fails on centre_x' || bad "offx: rc=$RC $OUT"

# Not square, and under 512px.
plant wide 'cv2.copyMakeBorder(img, 0, 0, w//4, w//4, cv2.BORDER_REPLICATE)'
check "$TMP/packs/wide/avatar.png"
(( RC == 1 )) && [[ "$OUT" == *"not square"* ]] && okk 'a non-square avatar fails' || bad "wide: rc=$RC $OUT"
plant small 'cv2.resize(img, (256, 256), interpolation=cv2.INTER_AREA)'
check "$TMP/packs/small/avatar.png"
(( RC == 1 )) && [[ "$OUT" == *"under 512px"* ]] && okk 'an avatar under 512px fails' || bad "small: rc=$RC $OUT"

# No face at all.
plant blank 'np.full_like(img, 225)'
check "$TMP/packs/blank/avatar.png"
(( RC == 1 )) && [[ "$OUT" == *"no face found"* ]] && okk 'an avatar with no face fails' || bad "blank: rc=$RC $OUT"

# One bad file among good ones reds the whole run.
check "$TMP/packs/ref/avatar.png" "$TMP/packs/loose/avatar.png"
(( RC == 1 )) && okk 'one failing avatar among passing ones fails the run' || bad "mixed: rc=$RC"

# The known-exception ratchet: a listed pack is excused while it fails, and FAILS once it passes.
printf -- '- loose: planted by the test\n- ref: planted by the test\n' >>"$TMP/PORTRAITS.md"
check "$TMP/packs/loose/avatar.png"
(( RC == 0 )) && [[ "$OUT" == "known "* ]] && okk 'a listed failing pack is reported as known, not failed' || bad "known: rc=$RC $OUT"
check "$TMP/packs/ref/avatar.png"
(( RC == 1 )) && [[ "$OUT" == *"stale known exception"* ]] && okk 'a listed pack that now passes fails as stale' || bad "stale: rc=$RC $OUT"

# An empty file list is not a pass (a bad glob must not go green).
check
(( RC == 1 )) && okk 'no files checked is a failure' || bad "empty: rc=$RC"

# frame-portrait.py brings the loose plant back into the band.
"$PY" "$TMP/scripts/frame-portrait.py" "$TMP/packs/loose/avatar.png" "$TMP/reframed.png" >/dev/null 2>&1
mkdir -p "$TMP/packs/reframed" && mv "$TMP/reframed.png" "$TMP/packs/reframed/avatar.png"
check "$TMP/packs/reframed/avatar.png"
(( RC == 0 )) && okk 'frame-portrait.py reframes the loose plant into the band' || bad "reframe: rc=$RC $OUT"

echo "pass=$pass fail=$fail"
(( pass > 0 && fail == 0 ))
