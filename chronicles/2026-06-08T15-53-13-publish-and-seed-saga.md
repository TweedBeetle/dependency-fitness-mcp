---
date: 2026-06-08T15:53:13
title: dependency-fitness-mcp — Publish & Seed Saga
type: progress
author: "Claude"
ai_generated: true
ai_model: "claude-opus-4-8"
session_id: dc650d5b-38ce-49aa-af00-508893e55850
---

## Summary

Took the already-built MCP server from local repo to **live on npm + the official MCP registry + public GitHub**, plus an open awesome-mcp-servers PR — fighting through a long npm-2FA / registry-auth gauntlet. Renamed `depcheck-mcp` → `dependency-fitness-mcp` (npm name was taken). The last domino (Glama listing → score badge → awesome PR merge) is deferred to reminder `25f066` (2026-06-11), pending Glama's auto-sync from the registry.

## What Was Done

- **Backups:** created private GitHub repos for `revenue-paths`, `depcheck-mcp`, `pinball-price-guide`; read both build chronicles; verified both BUILD deliverables (depcheck = real MCP server, 31/31 tests; pinball = real 14k-sale corpus).
- **Rename:** `depcheck-mcp` is taken on npm (unrelated "MCP server for DepCheck"), and `depcheck` is a famous unused-dep tool → confusingly adjacent. Renamed everything to **`dependency-fitness-mcp`** (leads with the fitness/migration-target differentiator). Repo renamed, made public, topic-tagged.
- **npm publish gauntlet** (the bulk of the session — see `~/.claude/docs/mcp-server-publishing.md` for the distilled rules):
  - First `npm publish` E404 → npm's misleading "unauthenticated" (login token lapsed).
  - Then EOTP repeatedly → 2FA-on-writes. `--otp` failed (npm 2FA is **security-key/WebAuthn**, no TOTP to fetch from 1Password; the `op item get npm --otp` returned empty). The in-session `!` shell lacks a TTY for npm's browser web-OTP, so it errored instead of opening it.
  - Resolution: drove the browser (Claude-in-Chrome) to create a **granular access token with "Bypass 2FA"**, scoped read+write to the one package, 90-day max. Took **two** attempts — the React checkbox silently reverts (`form_input` doesn't stick; needed a real click set *last* + zoom-verify), and the first token (made by Christo after shortening the name) lacked the bypass flag, so it still EOTP'd. Confirmed the package's Publishing-access was already the permissive "2FA *or* bypass token" mode (not the blocker).
  - Final: token stored in 1Password (`npm` item, field `dependency-fitness-mcp-pub`), `~/.npmrc` set to an env-placeholder (`${NPM_TOKEN}`, no secret on disk). `NPM_TOKEN=$(op item get … --reveal) npm publish` → **`dependency-fitness-mcp@0.1.1` live, no OTP.**
- **Official MCP registry:** two blockers fixed — namespace `io.github.<User>` is **case-sensitive** (had to fix to `TweedBeetle`), and the npm package must declare **`mcpName`** in package.json (→ bump to 0.1.1 + republish so the registry reads it from the tarball). Also: server.json description ≤100 chars + migrated to the 2025-12-11 schema; the Registry JWT expires in minutes (chained `login && publish`). **Published: `io.github.TweedBeetle/dependency-fitness-mcp@0.1.1`.**
- **awesome-mcp-servers PR #7494:** opened (Developer Tools). CI bot + maintainer (punkpeye) both gate merge on a **Glama listing + score badge**. Added a verified `Dockerfile` (builds + answers `initialize`/`tools/list` over stdio) for Glama's introspection check.
- **Glama:** still not auto-indexed; "Add Server" requires account signup + CAPTCHA (agent can't). Set reminder `25f066` to add the badge once Glama auto-syncs from the registry.

## Steering / reasoning notes

- **"you could have executed that"** — Christo flagged that I'd handed him commands I could run myself. True for `mcp-publisher publish` and (once authed) `npm publish`; the genuine blockers were credential actions I'm barred from (npm login, OTP entry, account creation, CAPTCHA). I over-delegated a couple of steps before driving them directly. Calibration: drive everything up to the actual credential wall, don't punt the runnable parts.
- **High persistence paid off** — the publish failed ~5 different ways; each failure was a fixable config bug, not a dead end. Christo stayed in it (re-logging in, generating tokens, approving Touch IDs) rather than abandoning the unattended-token goal.
- **The token route was worth it** despite the friction: future releases are now one-Touch-ID (`op` fetch) instead of an interactive security-key dance every time.

## Implications

- BUILD 1 of the revenue-paths portfolio is **shipped + (mostly) seeded**. The kill-criterion clock (~$500 MRR via organic MCP-directory discovery) starts as listings land.
- The publishing gotchas are now a reusable doc — the portfolio plans more MCP endpoints (PyPI fast-follow, more "stamps"), so this gauntlet shouldn't recur from scratch.

## Open Threads

1. **Glama → badge → PR #7494 merge** — reminder `25f066` (2026-06-11). Check `glama.ai/api/mcp/v1/servers/TweedBeetle/dependency-fitness-mcp`; if indexed, add the score badge to the PR branch + comment.
2. **Remaining directory submits** — mcp.so / Smithery / PulseMCP, each needs Christo's login; ready-to-paste copy in `SEEDING.md`. Optional, not blocking.
3. **Pinball "stamp #1"** (`~/projects/pinball-price-guide`) — built but not deployed/seeded; the next BUILD-phase move.
4. **npm token expires ~2026-09-06** (90-day max for write tokens) — will need re-minting then.
5. **`/register-project`** depcheck-mcp + pinball into memex Active Projects Overview so `/next` sees them (not done).
