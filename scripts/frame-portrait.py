#!/usr/bin/env python3
"""Normalise a portrait's framing to PORTRAITS.md by cropping around the detected face, then resizing.
   frame-portrait.py <in.jpg|png> <out.png> [size=512]      (OpenCV 4.x, as check-portraits.py)
The source must be larger than the output (1000px sources -> 512px avatars): the crop never upscales past it.
The targets are the middle of check-portraits.py's bands, read from its SPEC, so the two cannot drift.

Adapted from OINOA's scripts/frame-portrait.py (oinoa/oinoa-marketplace @ c79bbe7); the numbers are 5dive's
(DIVE-5188). Check the result with check-portraits.py, and look at it: the tool reports the target it aimed
at, not the picture it made."""
import importlib.util, os, sys
import cv2

_spec = importlib.util.spec_from_file_location("check_portraits", os.path.join(os.path.dirname(os.path.abspath(__file__)), "check-portraits.py"))
cp = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(cp)
FACE_H, EYES_Y, CENTRE_X = (cp.SPEC[k][1] for k in ("face_h", "eyes_y", "centre_x"))

if len(sys.argv) < 3: sys.exit(__doc__)
src, dst = sys.argv[1], sys.argv[2]; size = int(sys.argv[3]) if len(sys.argv) > 3 else 512
img = cv2.imread(src)
if img is None: sys.exit(f"{src}: not a readable image")
H, W = img.shape[:2]
m = cp.measure(img)
if m is None: sys.exit(f"{src}: no face found")
x, y, fw, fh = m["box"]
ey = m["eyes_y"] * H if m["eyes_y"] is not None else y + fh * 0.42
C = min(int(fh / FACE_H), H, W)                     # crop side so the face box is FACE_H of it
top = int(min(max(ey - EYES_Y * C, 0), H - C)); left = int(min(max(x + fw / 2 - CENTRE_X * C, 0), W - C))
if C < size: print(f"warn: {src}: crop {C}px is smaller than the {size}px output; re-render the source wider", file=sys.stderr)
out = cv2.resize(img[top:top + C, left:left + C], (size, size), interpolation=cv2.INTER_AREA)
cv2.imwrite(dst, out); print(f"{os.path.basename(src)} -> {dst}: crop {C}px at ({left},{top})")
