---
name: clicker-site-notes
description: >-
  How public websites behave, from real browser jobs, on top of the seed lessons: a first screenshot can still be loading, a typed address can lose its first letters, typing goes wherever focus is, a counter stuck at 0 means the text did not land, a relative time is an estimate, a preview is not the post, check the author line, a short link carries no post id, a magic link is not sent to an unknown address, a dashboard may not list what you submitted, a submit link can lead nowhere, a red "!" on a chat message means not delivered, a comment only you can see may be dead, ads declined for one reason share their text, a GitHub edit on someone else's repo forks first, plus LinkedIn, TikTok and Telegram quirks.
metadata:
  type: reference
---

# Clicker — site notes

Lessons about how public websites behave, kept from Clicker's own browser jobs. They add to the seed lessons; nothing here repeats one.

## Any site

1. **a first screenshot can still be loading** (a spinner, grey boxes, an empty list). wait for the page to settle and shoot again before you read it or judge signed in or out.
2. **a typed address can lose its first letters** and land on a search page instead of the site. check the address bar in the screenshot after every go-to.
3. **in screenshot-only mode, typing goes wherever focus is.** in a chat app, close the open chat and re-shoot before you click search, then confirm the target before Enter. if text lands in the wrong box, clear it and send nothing.
4. **a character counter that stays at 0 means the field took nothing**, even if you clicked it. when no caret shows, use the other text field the form offers rather than typing the same text again.
5. **a relative time label ("6m", "2h") is an estimate.** record the time as estimated and say so.
6. **a preview is not the post.** notification and feed previews show part of the text and no link. a record built from one is partial; label it, or open the post itself.
7. **check the author line before you record a post as someone's.** a repost in a person's feed is somebody else's post.
8. **a short redirect link carries no post id.** get the full post URL from the address bar. if the menu that holds "copy link" does not appear, re-shoot once with the post in view, then report the link as missing. never guess an id.
9. **a magic-link sign-in sends nothing to an address the site does not know.** it may redirect to a sign-up form instead, which can carry a bot check. read the page after you press; never report "link sent" without the site saying so.
10. **a directory's dashboard may not list what you submitted.** if it shows no listing and its obvious account pages are not found, report "status not visible from the dashboard" instead of guessing more URLs.
11. **a red "!" beside a sent chat message, gone after a reload, means it was never delivered.** report "not delivered". do not resend without a new go, and do not assume the account is limited.
12. **a comment only you can see may be dead.** a forum can hide a new account's comments with no notice (Hacker News marks them dead). check from a signed-out view before reporting "posted". if it is dead, stop posting there and tell the owner; never make another account.
13. **when an ad platform declines several ads for the same reason, the shared text is the cause**, not the channel they run in. do not resubmit the same words.
14. **a submit link can lead nowhere.** the domain may now be a for-sale page, or the "add" link may be an unfilled form-builder link (`tally.so/r/_____`). report "no way to submit" and move on; do not hunt for another form.

## GitHub

15. **editing a file in a repo the account does not own asks to fork it first.** that is expected. before you open the pull request, check the compare view shows one commit and exactly the lines you meant. text in another script (Chinese, full-width punctuation) can only be checked by eye in the diff, so say so.

## LinkedIn

16. **following someone leaves the bell on "Most relevant".** choose "All", save, and reopen it to confirm the page says the save worked. sometimes the bell only highlights and the dialog does not open; click it again.
17. **clicking a notification can open the feed with `highlightedUpdateUrn=urn:li:activity:<id>` in the address bar.** that is the post's id; read it from the address bar, since the post text does not carry it.

## TikTok

18. **a signed-out session can look odd rather than signed out.** a profile page can redirect to a blank feed, and the first tab can be titled "Verification" with no puzzle on screen. treat it as signed out and have the owner reconnect; do not call it a bot check unless you see one.

## Telegram

19. **channel keyword search is a poor way to find channels.** it returns mostly small channels or ones in another language. ask for a list of handles to check directly instead.
