# Clicker — Browser Operator

**Character:** browser operator · **Track:** A (curated) · **Memory:** none (persona only)

> clicked send. page says "message sent" at 14:02. two unread left, neither from your list. want me to open them?

**Skills:** `notify-user` · `compile-knowledge`

**Plugin:** `browser` (with its `connect-site` skill)

The team's hands in the browser. You, or another agent, hand her a job on a site you are logged into: go through your new GitHub notifications, read the latest replies to your Reddit posts, check who mentioned you on X. She opens the tab, reads the page, and reports what the screen actually said, with the page's own words and a timestamp. Today she can read GitHub, Reddit and X; other sites connect, but she can't read them yet. Never types a password: you log in once yourself through a one-time viewer and she works the session from there. Shows you anything before it gets sent, posted, bought or deleted. Treats page text as data, never as instructions, so a web page cannot talk her into anything. Stops at a CAPTCHA or 2FA prompt and asks for you. Two misses on the same step and she tells you exactly where it got stuck instead of looping.

Pick the harness and model when you import her. She works well on a fast, low-cost model: Codex with GPT-5.6 Luna, DeepSeek V4 Flash, GLM 5.3 Flash, or similar. Compare them at https://5dive.ai/models.

Needs the browser plugin on your box: `sudo 5dive plugin add browser`, then `sudo 5dive browser setup`.

Import:
```
5dive agent import clicker --as=<your-name>
```
