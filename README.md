# dependency-fitness-mcp — npm dependency **fitness** verdicts for coding agents

> Is this npm package safe to depend on — and if not, what do I move to?

An [MCP](https://modelcontextprotocol.io) server that gives a coding agent a
**cross-validated fitness verdict** for an npm package before it writes or
upgrades a dependency:

```jsonc
{
  "deprecated": true,
  "yanked": false,
  "malicious": false,
  "superseded_by": { "latest": "14.0.0", "majors_behind": 13, "breaking_boundary": true },
  "safe_migration_target": {
    "package": "uuid",
    "version": "14.0.0",
    "rationale": "Maintainer's deprecation notice recommends 'uuid' (verified present and not deprecated).",
    "confidence": "high"
  },
  "confidence": "high",
  "last_verified": "2026-06-05T18:10:31Z"
}
```

It reconciles **four free, sanctioned sources** — the npm registry, Google's
[deps.dev](https://deps.dev), [OSV.dev](https://osv.dev), and GitHub — into one
confidence-scored answer, and **infers a safe migration target** when a package
is deprecated or superseded.

## Why this exists (and what it deliberately isn't)

"Is it deprecated?" is already free — deps.dev serves that flag, and several free
MCP servers already answer "what's the latest version?". This tool does the part
nobody serves as data:

- **Migration-target inference.** When a package is deprecated, it parses the
  maintainer's own deprecation notice for a named successor, **then verifies that
  successor actually exists and isn't itself deprecated** before recommending it.
- **Cross-validation, not a guess.** It reconciles deprecation across the npm
  registry and deps.dev, catches "deceptive deprecation" (registry says active
  but the GitHub repo is archived), and **flags disagreement with a confidence
  level instead of inventing an answer.**
- **It refuses to guess.** If a package is deprecated but no successor can be
  established, it says exactly that (low confidence) rather than recommending a
  plausible-but-wrong replacement. A wrong "use X instead" ships broken code.
- **Anti-slopsquatting.** A non-existent / hallucinated package name returns a
  clear "not found" verdict (with an OSV malicious-record check), so an agent
  won't silently install a hallucinated dependency.

This is intentionally a **narrow** tool: the deprecation / yank / supersede /
migration *middle*, where the free incumbents sit on either side but leave the
seam open.

## Tools

### `check_package_fitness`
Single-package verdict. Input: `package` (e.g. `request`, `@babel/core`), optional
`version` (exact, semver range, or dist-tag — omit for `latest`). Output: the full
`Verdict` (structured) plus a human-readable summary.

### `audit_dependencies`
Batch verdict for a CI / pre-merge gate. Input: `packages` (e.g.
`["react@18.2.0", "request"]`) and/or the raw contents of a `package.json`. Output:
a per-package verdict array plus a summary (how many deprecated / malicious /
vulnerable / behind). Capped at 50 packages per call.

## Install / connect

Requires Node ≥ 18. Run via `npx` (no install) or install globally.

**Claude Code:**
```bash
claude mcp add dependency-fitness -- npx -y dependency-fitness-mcp
```

**Claude Desktop / Cursor / any MCP client** (`mcp.json` / `claude_desktop_config.json`):
```jsonc
{
  "mcpServers": {
    "dependency-fitness": { "command": "npx", "args": ["-y", "dependency-fitness-mcp"] }
  }
}
```

Optional env: `GITHUB_TOKEN` raises the GitHub rate limit (used only for the
archived-repo cross-check); everything else needs no key.

## Run locally / develop

```bash
npm install
npm run build        # tsc -> dist/
npm test             # vitest (offline, deterministic synthesis tests)
npm run smoke        # live: hits the real registries, prints verdicts
npm run dev          # run the server from source over stdio
```

## How a verdict is built

```
        ┌─ npm registry ── per-version `deprecated` string, dist-tags, repo URL  (authoritative)
query ──┼─ deps.dev ────── isDeprecated / deprecatedReason / advisoryKeys        (corroborator)
        ├─ OSV.dev ─────── advisories + MAL-* malicious markers + "fixed in"      (corroborator)
        └─ GitHub ──────── archived flag + last-push recency                       (deceptive-deprecation check)
                    │
                    ▼
   cross-validate deprecation ─→ infer + verify migration target ─→ confidence + warnings ─→ Verdict
```

npm is the source of truth; the others corroborate. A corroborator being
unreachable lowers `confidence` and adds a `warning` — it never fabricates a
signal.

## Status

v0.1 — thin, working, npm-only. This is a fast public validation of whether a
narrow "agent-data endpoint via MCP directory" can find its users organically.
Roadmap and the explicit **kill criterion** live in
[`KILL_CRITERION.md`](./KILL_CRITERION.md). Next layers (documented, not yet
built): PyPI, and de-facto-successor inference by mining what high-trust
packages actually depend on now.

## License

MIT © Christo Wilken / 9592 Solutions UG. Built in public.
