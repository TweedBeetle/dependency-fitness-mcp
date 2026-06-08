# Directory-seeding playbook

The distribution motion for the kill-criterion test (organic MCP-directory
discovery, **no cold-sell**). Lead every listing with the *differentiator* —
**deprecation / yanked / superseded + a verified safe migration target,
cross-validated** — NOT "version checker" (that term is already owned by free
servers). Search terms to claim: *deprecation, yanked, superseded, migration
target, supply-chain, slopsquatting.*

## Ready-to-paste listing copy

**Name:** `dependency-fitness-mcp`

**Tagline (≤60 chars):**
> Is this npm package safe to depend on — and if not, what to move to?

**One-liner:**
> An MCP server that returns a cross-validated *fitness verdict* for an npm
> package — deprecated / yanked / superseded plus a verified safe migration
> target — reconciled across the npm registry, deps.dev, OSV, and GitHub.

**Full description:** (use the README intro)
> "Is it deprecated?" is already free. This does the part nobody serves as data:
> it infers a migration target from the maintainer's deprecation notice and
> **verifies the successor exists and isn't itself deprecated** before
> recommending it; cross-validates deprecation across sources and flags
> disagreement with a confidence level instead of guessing; refuses to invent a
> target it can't substantiate; and returns a clear not-found verdict for
> hallucinated / slop-squatted package names.

**Install:**
```bash
npx -y dependency-fitness-mcp
```
**Client config:**
```jsonc
{ "mcpServers": { "dependency-fitness": { "command": "npx", "args": ["-y", "dependency-fitness-mcp"] } } }
```
**Tools:** `check_package_fitness` (single), `audit_dependencies` (batch / CI gate).
**Tags:** mcp, npm, dependencies, deprecation, supply-chain, migration, slopsquatting, ai-agents.

## Checklist (order matters)

1. **npm publish** — ✅ **DONE** — live: `dependency-fitness-mcp@0.1.0` (2026-06-06).
2. **GitHub public** — ✅ **DONE** — repo public, discovery topics set.
3. **Official MCP registry** (`server.json` is ready; namespace `io.github.tweedbeetle/dependency-fitness-mcp`):
   ```bash
   # install the publisher CLI (Go) — or use the latest documented install
   brew install mcp-publisher   # or: see registry.modelcontextprotocol.io docs
   mcp-publisher login github   # device-auth in browser — Owner: Christo
   mcp-publisher publish        # reads ./server.json
   ```
   Glama + several aggregators **auto-index from this registry** once published — so step 3 does a lot of step 4's work for free.
4. **Submission surfaces** (each needs that site's own login — *Owner: Christo*, copy above is ready to paste):
   - [mcp.so](https://mcp.so) — submit form (GitHub login). Often auto-pulls from the official registry.
   - [smithery.ai](https://smithery.ai) — "Add server", connect the public GitHub repo.
   - [glama.ai/mcp](https://glama.ai/mcp) — **submit at https://glama.ai/mcp/servers** (GitHub login). Repo ships a verified `Dockerfile` (builds + responds to `initialize`/`tools/list`) so Glama's introspection check passes. **This is the gate on the awesome-mcp-servers PR** — see step 5.
   - [PulseMCP](https://www.pulsemcp.com) — submit form; then chase a weekly-digest feature (high-signal editorial boost).
5. **awesome-mcp-servers PR** — opened [#7494](https://github.com/punkpeye/awesome-mcp-servers/pull/7494) (Developer Tools). ⚠️ **Merge gated on Glama**: maintainer (punkpeye) + CI bot both require the server listed on Glama + a score badge in the entry. Once Glama indexes it, add this after the repo link, push, and the gate clears:
   ```markdown
   [![TweedBeetle/dependency-fitness-mcp MCP server](https://glama.ai/mcp/servers/TweedBeetle/dependency-fitness-mcp/badges/score.svg)](https://glama.ai/mcp/servers/TweedBeetle/dependency-fitness-mcp)
   ```

   Entry text (Developer Tools / package section):
   ```markdown
   - [TweedBeetle/dependency-fitness-mcp](https://github.com/TweedBeetle/dependency-fitness-mcp) 📇 ☁️ - Cross-validated npm dependency *fitness* verdicts (deprecated / yanked / superseded + a verified safe migration target), reconciled across npm, deps.dev, OSV, and GitHub.
   ```
6. **Build-in-public post** — the deprecation / slopsquatting findings + the live endpoint are ready-made Show HN / dev.to material. Counts as audience-building, not cold-sell. Salvage-positive regardless of MRR. **Status + ready drafts: see "Build-in-public posts" below.**
   - [x] **X thread** — live 2026-06-08 (@TweedBeetle): https://x.com/TweedBeetle/status/2064041479589273793
   - [ ] **r/mcp** — PARKED 2026-06-08, needs a healthy account (draft below).

## Measure against the kill criterion

Watch installs / conversions arrive (or not) through these passive surfaces only —
no cold outreach. ~$500 MRR via organic discovery alone is the line
(`KILL_CRITERION.md`). If it doesn't clear, that's the cheap channel-disconfirmation
signal; rotate npm→PyPI once, then reallocate to the collectibles portfolio.

## Build-in-public posts

### X — POSTED 2026-06-08
Live as a 5-tweet thread on @TweedBeetle (head): https://x.com/TweedBeetle/status/2064041479589273793
Angle: agents add deprecated/missing npm deps → the deprecated-recommends-deprecated trap → slopsquatting → four-source cross-validation → install + CTA.

### r/mcp — PARKED 2026-06-08 (draft ready)
Blocked on account, not content. The prior dev account is **banned** (logged-out profile shows "This account has been banned" — escalated from a 2026-05-25 API-posting shadowban), and no other healthy on-brand account exists yet. Warm a fresh, healthy account (≥30d age + comment karma, no links first ~2 weeks — see `reddit-browser-post` warming notes), then post via the browser flow (Claude-in-Chrome is blocked on Reddit; use Alumnium-cookies or Playwright). Verify the account is healthy logged-out before posting.

**Title:**
> An MCP server that gives a coding agent a dependency "fitness verdict" before it installs an npm package

**Body:**
> Coding agents will happily add an npm dependency that's deprecated, a major version behind, or that doesn't actually exist. I built a small MCP server that gives the agent a fitness verdict on a package before it commits to depending on it.
>
> You give it a package name (optionally a version), and it returns a structured verdict: whether it's deprecated / yanked / malicious, how far behind latest it is, and if it's deprecated, a *verified* safe migration target.
>
> Two things turned out to be more interesting than I expected:
>
> - "Just read the deprecation notice and use what it recommends" is a trap. Some deprecated packages name a successor that is itself deprecated. So it parses the maintainer's named successor, then does an extra check that the successor actually exists and isn't also dead before recommending it. If it can't establish a clean target, it says so instead of inventing one.
> - Slopsquatting. If the agent hallucinates a package name, it returns a clear not-found verdict and checks OSV for known-malicious records, so the agent doesn't silently install something that shouldn't exist.
>
> Under the hood it reconciles four free, keyless sources (the npm registry, deps.dev, OSV, and GitHub) into one confidence-scored answer. npm is the source of truth, the others corroborate, and when they disagree it flags the disagreement rather than guessing.
>
> Two tools: check_package_fitness (single) and audit_dependencies (batch, for a CI / pre-merge gate over a whole package.json).
>
> Add it: claude mcp add dependency-fitness -- npx -y dependency-fitness-mcp
>
> It's deliberately narrow (the deprecated / yanked / superseded / migration seam, where the free tools sit on either side but leave the middle open), v0.1, npm-only, free, MIT, built in public: https://github.com/TweedBeetle/dependency-fitness-mcp
>
> I'd be curious whether the migration-target inference is the part you'd actually use, or whether you'd just want the raw cross-validated deprecation flags. And whether npm is the right first ecosystem, or if PyPI would be more useful.
