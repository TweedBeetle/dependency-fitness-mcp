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

1. **npm publish** — `npm publish` (account has 2FA → completes the OTP/browser prompt). *Owner: Christo (credential).*
2. **GitHub public** — `gh repo edit TweedBeetle/dependency-fitness-mcp --visibility public --accept-visibility-change-consequences`. *Can be done for you on go-ahead.*
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
   - [glama.ai/mcp](https://glama.ai/mcp) — auto-indexes public GitHub MCP repos; claim the listing via GitHub login.
   - [PulseMCP](https://www.pulsemcp.com) — submit form; then chase a weekly-digest feature (high-signal editorial boost).
5. **awesome-mcp-servers PR** — PR to [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers). *Can be opened for you via `gh` once npm is live.*

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
