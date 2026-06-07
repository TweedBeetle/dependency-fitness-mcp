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
6. **Build-in-public post** — the deprecation / slopsquatting findings + the live endpoint are ready-made Show HN / dev.to material. Counts as audience-building, not cold-sell. Salvage-positive regardless of MRR.

## Measure against the kill criterion

Watch installs / conversions arrive (or not) through these passive surfaces only —
no cold outreach. ~$500 MRR via organic discovery alone is the line
(`KILL_CRITERION.md`). If it doesn't clear, that's the cheap channel-disconfirmation
signal; rotate npm→PyPI once, then reallocate to the collectibles portfolio.
