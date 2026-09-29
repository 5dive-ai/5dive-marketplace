#!/usr/bin/env python3
"""Face-to-frame check for 5dive marketplace portraits (PORTRAITS.md). Needs OpenCV 4.x:
   python3 -m venv /tmp/cv && /tmp/cv/bin/pip install "opencv-python-headless==4.14.0.94"
   /tmp/cv/bin/python scripts/check-portraits.py packs/*/avatar.png
Measures the detected face box (brows to chin) against the image: height, eye line, horizontal
centre; and that the avatar is square and at least 512px.

A pack listed under "## Known exceptions" in PORTRAITS.md is reported as `known`, not failed.
The list is a ratchet: a listed pack that now passes FAILS as `stale`, so it gets removed from
the list instead of staying excused. Exit 1 on any FAIL.

Adapted from OINOA's scripts/check-portraits.py (oinoa/oinoa-marketplace @ c79bbe7); the method
is theirs, the numbers are 5dive's own (DIVE-5188, re-set to the dark house look in DIVE-5222)."""
import os, re, sys
import cv2

# metric: (low, target, high). The target is what frame-portrait.py aims at; low..high passes.
SPEC = {"face_h": (0.45, 0.50, 0.56), "eyes_y": (0.35, 0.40, 0.45), "centre_x": (0.43, 0.50, 0.57)}
MIN_SIDE = 512
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cc = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml"))
ec = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_eye.xml"))


def measure(img):
    """-> {face_h, eyes_y, centre_x} (eyes_y None when no eye is found), or None when no face."""
    h, w = img.shape[:2]; g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = cc.detectMultiScale(g, 1.1, 6, minSize=(w // 8, w // 8))
    if len(faces) == 0:
        return None
    x, y, fw, fh = max(faces, key=lambda r: r[2] * r[3])
    eyes = ec.detectMultiScale(g[y:y + fh // 2, x:x + fw], 1.1, 8)
    return {"face_h": fh / h, "centre_x": (x + fw / 2) / w,
            "eyes_y": (y + sum(ey + eh / 2 for _, ey, _, eh in eyes) / len(eyes)) / h if len(eyes) else None,
            "box": (x, y, fw, fh), "eyes": eyes}


def known_exceptions(path=os.path.join(ROOT, "PORTRAITS.md")):
    """Pack ids listed as `- <id>: ...` under '## Known exceptions' in PORTRAITS.md."""
    ids, inside = set(), False
    for line in open(path, encoding="utf-8"):
        if line.startswith("## "):
            inside = line.strip().lower() == "## known exceptions"
        elif inside and (m := re.match(r"- `?([a-z0-9-]+)`?:", line)):
            ids.add(m.group(1))
    return ids


def check(f):
    """-> (ok, [messages]): the problems, or on a pass the measured numbers."""
    img = cv2.imread(f)
    if img is None:
        return False, ["not a readable image"]
    h, w = img.shape[:2]
    out = []
    if h != w: out.append(f"not square ({w}x{h})")
    if min(h, w) < MIN_SIDE: out.append(f"{min(h, w)}px is under {MIN_SIDE}px")
    m = measure(img)
    if m is None:
        return False, out + ["no face found"]
    out += [f"{k}={m[k]:.2f} (want {lo:.2f}..{hi:.2f})" for k, (lo, _, hi) in SPEC.items()
            if m[k] is not None and not lo <= m[k] <= hi]
    if out:
        return False, out
    return True, [" ".join(f"{k}={m[k]:.2f}" for k in SPEC if m[k] is not None)]


def main(files):
    known, bad = known_exceptions(), 0
    for f in files:
        pack = os.path.basename(os.path.dirname(os.path.abspath(f)))
        ok, msgs = check(f)
        if ok and pack in known:
            print(f"FAIL  {f}: stale known exception, it passes now ({msgs[0]}); remove '{pack}' from PORTRAITS.md"); bad += 1
        elif ok:
            print(f"ok    {f}: {msgs[0]}")
        elif pack in known:
            print(f"known {f}: " + ", ".join(msgs))
        else:
            print(f"FAIL  {f}: " + ", ".join(msgs)); bad += 1
    print(f"{len(files)} checked, {bad} failed")
    return 1 if bad or not files else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
