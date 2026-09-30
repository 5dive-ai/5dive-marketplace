---
name: diagnose
description: >-
  Work out how bad a suspected security problem is and what caused it: a leaked key, a
  strange login, a scanner or provider alert, a CVE notice, a box acting oddly, or "did we
  get hacked?". Assumes exposure and measures its scope: what is exposed, since when,
  reachable by whom, and whether it was used. Covers secrets in git history, listening
  ports, login keys and auth logs, vulnerable dependencies and risky permissions, then
  containment (rotate first), root cause, and a report that says what was checked and what
  was not. Use for incident triage, "this key was in a public repo", "why is this port
  open", a dependency CVE alert, or a periodic exposure sweep of a box or repo you own.
compatibility: "A Linux shell and the repo. Probes are read-only; fixes that can break a live service need the owner's yes unless pre-agreed."
metadata:
  author: 5dive
  version: "2.0"
  license: company-agnostic
---

# diagnose

Assume it is already exposed. The question is scope: what, since when, reachable by whom,
and whether anyone used it. The output is a located finding and what was done about it,
not a feeling about "security posture".

## The one rule that governs everything

**A probe that did not run looks exactly like a clean result.** "Permission denied", a tool
that is not installed, a wrong path and an empty grep all print nothing alarming. So every
probe gets a positive control: the same probe, run the same way, against something you know
is there. Only after the control hits does silence count as "clean". A perfectly uniform
clean sweep is the tell that something did not run.

## Procedure

1. **Write down the trigger and start the clock.** What was seen, where, and the earliest
   moment it could have started: the commit date of the leaked file, the first odd log line,
   the day the vulnerable version was deployed. Exposure runs from then, not from when
   someone noticed.
2. **Contain first if a secret is out.** A key, token or password that reached a public
   place is burned. Rotate it and revoke the sessions or tokens it could have minted. If you
   do not hold that authority, the first message is "rotate this now", with the exact steps.
   If rotating will break a live service, show the exact change and get a yes. The
   post-mortem comes second.
3. **Test what the credential could really reach.** Having a key is not proof of what it can
   see. List its scopes, then try a harmless read against the actual target. "It is an admin
   key" is a claim until tested.
4. **Sweep the usual holes** with the probes below, each with its control: secrets in the
   repo and its history, listening ports, login keys, auth failures and successes,
   vulnerable dependencies, loose permissions.
5. **Read the logs for use, not just exposure.** Was it used, from where, doing what,
   between the start of the clock and containment? That is the difference between
   "exposed" and "breached". No logs for that window is "unknown", not "no".
6. **Find the root cause.** A key in a commit means a `.env` that git did not ignore, or a
   script that printed it into a log. Fix the cause or the next key leaks the same way.
7. **Report** in the shape below, every finding located to a file and line, a port, or a
   log entry.

## Probes

Read-only. Run each control first, or right after, the same way.

```bash
# Secrets in the working tree and full git history.
# Prefer a real scanner if installed (gitleaks detect / trufflehog git file://.).
git log -p --all | grep -nE 'AKIA[0-9A-Z]{16}|sk_live_[0-9A-Za-z]{20,}|ghp_[0-9A-Za-z]{36}|xox[abpr]-[0-9A-Za-z-]+|-----BEGIN [A-Z ]*PRIVATE KEY-----' | head -20
#   control: write a fake key in that shape to a scratch file and grep it the same way

# Secret-looking files git is tracking
git ls-files | grep -iE '(^|/)\.env($|\.)|secret|credential|\.pem$|id_rsa'

# Listening ports and the address they bind (0.0.0.0 or [::] means every interface)
sudo ss -tlnp
#   control: the SSH port you are connected through must appear

# Keys that can log in, for root and every real user
for d in /root $(getent passwd | awk -F: '$3>=1000 && $3<65534 {print $6}'); do
  f="$d/.ssh/authorized_keys"; sudo test -f "$f" && echo "== $f" && sudo cat "$f"
done
#   control: your own key must be listed

# Recent logins, accepted and failed
sudo journalctl -u ssh -u sshd --since "-7 days" --no-pager | grep -iE 'accepted|failed|invalid' | tail -50
last -n 20

# Dependencies with published CVEs (whichever applies)
npm audit --omit=dev   # or: pip-audit | cargo audit | govulncheck ./...

# World-writable config, and setuid binaries outside the usual system dirs
sudo find /etc -maxdepth 3 -perm -o+w -type f 2>/dev/null
sudo find / -xdev \( -perm -4000 -o -perm -2000 \) -type f 2>/dev/null | grep -vE '^/(usr/)?(s?bin|lib)'
```

If `sudo` is refused or a tool is missing, that probe's result is "could not check". Say so in
the report. Never fold it into "clean".

## Report shape

```
STATUS:  exposed | breached | clean (controls passed) | could not check
CLOCK:   exposed since <time>, contained at <time>

FINDINGS  (most severe first)
- [high] <what> at <file:line | port | log line>. reachable by <who>. used: yes / no / unknown.

DONE:        what was rotated, revoked or closed, and when
ROOT CAUSE:  one sentence; "likely" if not proven, and what would prove it
NEEDS YOU:   anything waiting on a yes (a rotation that breaks a live service)

CHECKED:     each probe, with its control result
NOT CHECKED: what you could not reach, and why
```

"Not checked" is not optional. A report that lists only what you looked at reads as
"everything else is fine".

## Rules

- **Denied is not absent.** "Permission denied" and "not there" are different findings.
- **Never paste, attach or log a secret**, including in the report. The first four
  characters and where it lives is enough to act on.
- **Never share a file you have not read.** Logs and configs carry secrets you did not
  expect.
- **Probe only what your human owns or is authorised to test.**
- **Fix one thing at a time and re-check it:** try the old key after rotating, scan the port
  after closing it.
- **Never call a system secure.** Say what was checked, what was not, and why.

## Worked example

Illustrative. A provider emails: "a secret was found in a public repository".

```
STATUS:  breached (key used by an unknown address after the leak)
CLOCK:   exposed since the commit that added .env to the repo (the leak commit's date),
         contained at the time of rotation

FINDINGS
- [high] live payment API key in .env, committed to the public repo. reachable by anyone.
  used: yes, provider log shows calls from an address nobody on the team recognises.
- [medium] .env not in .gitignore. every future secret would leak the same way.

DONE:        key rotated and old key revoked; old key tested, now refused.
ROOT CAUSE:  .env was never ignored, and an "add all" commit picked it up.
NEEDS YOU:   the new key must go into the checkout service's settings, or checkout
             stops working at the next deploy.

CHECKED:     full git history for key patterns (control: fake key found), tracked files
NOT CHECKED: what the unknown caller did with the key; the provider's per-call detail
             needs an owner login.
```

What this report refuses to do: call it "exposed" when the log shows use, skip the
unchecked part, or paste the key.
