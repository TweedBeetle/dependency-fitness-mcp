---
date: 2026-06-08T20:27:20
title: Build-in-Public Launch — X Thread Live, Reddit Parked
type: progress
author: "Claude"
ai_generated: true
ai_model: "claude-opus-4-8"
session_id: dc650d5b-38ce-49aa-af00-508893e55850
---

## Summary

Kicked off the build-in-public distribution motion for `dependency-fitness-mcp`: posted a 5-tweet X thread (live, verified) and prepared a r/mcp post that got **parked** once the only natural Reddit identity (`Tweed_Beetle`) was confirmed banned. Net: X is the distribution win; Reddit waits for a healthy account.

## Context

Day-0 follow-up after publishing the MCP server (npm + official registry, 2026-06-08). Checked the real leading indicators first — all zero, but the honest read was "the discovery channel isn't open yet" (Glama not indexed, directories unseeded), not "no demand." The kill criterion's real channel is organic MCP-directory discovery; build-in-public is the *other* allowed lever and was unstarted. User chose to draft + post the build-in-public artifact to **X + Reddit r/mcp**.

## What Was Done

- **Drafts** (voice-playbook applied; builder-disclosure, no em dashes, no pronoun drops, specific feedback ask). Angle: agents add deprecated/missing npm deps → the deprecated-recommends-deprecated trap → slopsquatting → four-source cross-validation → install + CTA. Grounded in the actual build (README + the 2026-06-05 build chronicle), no fabricated first-person usage claims.
- **X thread — LIVE + verified** on @TweedBeetle, 5 tweets chained 1→2→3→4→5:
  - head: https://x.com/TweedBeetle/status/2064041479589273793
- **Reddit r/mcp — PARKED.** Draft (title + body) preserved in `SEEDING.md` under "Build-in-public posts" with the warming checklist, so warming a fresh account later picks up here.
- **State synced:** `SEEDING.md` (X done + r/mcp draft), `revenue-paths/CLAUDE.md` current-state (build-in-public started), `~/.claude/reddit-accounts.json` (`Tweed_Beetle` → `BANNED`). depcheck-mcp commit `f6e256d` pushed.

## Steering / reasoning visible this session

- **Premature tweet-1 post → recovered.** Building the thread via the X composer, an "Add post" (+) coordinate measured on the empty composer went stale after typing (the toolbar shifts down as the editor grows); the click landed on **Post** and fired tweet 1 alone. Recovered by building 2–5 as a self-reply chain (reply to each previous tweet's status page, click Reply by `find` ref, verify chaining by conversation order). Captured the trap + the thread method in the `x-browser-post` skill.
- **Refused to post Reddit into the void.** User said "give it a go" on `Tweed_Beetle` ("might not be shadowbanned idk"). A cheap pre-check (logged-out Playwright load — curl 403s from this IP regardless, Claude-in-Chrome is blocked from Reddit) showed the profile H1 **"This account has been banned"** — an escalation from the documented 2026-05-25 stealth shadowban. Posting would have been invisible theater, so I parked it and surfaced the finding instead. User: "park the mcp post for now, i'll warm up a new acc soon."
- **Account-identity was the load-bearing decision, not the posting mechanics.** Neither known account fit: `Tweed_Beetle` banned, `PurplePerson270` a persona mismatch (and a cross-persona linkage I stripped from the public repo before pushing).
- **Honesty on "when did it get banned?"** Couldn't date the shadowban→visible-ban transition (only two observation points, different endpoints); said so rather than guessing. What's solid: trouble started 2026-05-25 from API posting tripping Reddit's automation classifier.

## Implications

- BUILD 1's build-in-public motion is live on X (the more MCP-dev-native channel anyway). Reddit reach was always bonus.
- The kill-criterion clock still hinges on organic MCP-directory discovery — Glama listing + directory seeds (reminder `25f066`, 2026-06-11).

## Open Threads

1. **r/mcp post** — parked, draft ready in `SEEDING.md`. Needs a fresh, warmed, healthy Reddit account (≥30d age + comment karma, no links first ~2 weeks). User to warm one "soon," then post via the browser flow (Alumnium/Playwright; Claude-in-Chrome can't do Reddit). Verify account health logged-out before posting.
2. **Glama → badge → awesome-mcp PR #7494** — reminder `25f066` (2026-06-11), unchanged.
3. **Tweed_Beetle** — banned; appeal-not-churn is the documented path (reddit.com/appeals, user only). Separate track from this post.
4. Remaining directory submits (mcp.so / Smithery / PulseMCP), pinball stamp-#1 deploy, `/register-project` for both repos, build-in-public for the pinball stamp — all still open from prior sessions.
