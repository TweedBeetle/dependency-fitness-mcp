# depcheck-mcp — project memory

The "fast-validate" bet from the revenue-paths sequenced portfolio: an
MCP server that returns a **cross-validated npm dependency fitness verdict**
with an **inferred + verified safe migration target**. Origin brief:
`~/projects/revenue-paths/evidence/dossier/package-version-mcp.md`. User-facing
overview: `README.md`. Validation design + kill criterion: `KILL_CRITERION.md`.

## The product invariant (the moat — don't erode it)

The value is NOT "is it deprecated" (deps.dev serves that free). It is:
1. **migration-target inference** — parse the maintainer's deprecation notice for
   a successor, then **verify that successor exists and isn't itself deprecated**
   before recommending it; and
2. **cross-validation** across npm + deps.dev + OSV + GitHub with an explicit
   confidence level. **Never guess a migration target** — deprecated-with-no-clean-
   successor must return low confidence + "manual evaluation required", not a
   plausible-but-wrong package. The adversarial case the parser must keep passing:
   `request-promise` names `request` as the *reason* it's deprecated, NOT a target.

## Commands

```bash
npm run build   # tsc -> dist/  (noEmitOnError; shebang in src/index.ts is preserved by tsc)
npm test        # vitest, offline/deterministic — the synthesis logic (parser, cross-val, migration)
npm run smoke   # live: hits real npm/deps.dev/OSV/GitHub, prints verdicts for representative pkgs
npm run dev     # run the stdio server from source
npx tsx scripts/mcp-client-test.ts   # e2e: drives the built server as a real MCP client
```

## Layout

- `src/sources/{npm,depsdev,osv,github}.ts` — one client per data source. npm is
  authoritative (may throw on hard failure); the other three are best-effort
  corroborators (a failure lowers confidence + adds a warning, never fabricates).
- `src/verdict.ts` — the synthesis. Pure, unit-tested helpers (`parseMigrationHint`,
  `crossValidateDeprecation`, `selectMigrationTarget`, `computeSuperseded`,
  `computeConfidence`) + the `getVerdict` orchestrator (source clients injectable
  via `VerdictDeps` for deterministic tests).
- `src/audit.ts` — batch / package.json parsing (CI tier). `src/render.ts` —
  human-readable mirror of the verdict. `src/index.ts` — MCP server (2 tools).
- `src/types.ts` — zod schemas; `Verdict` is the contract.

## Build gotchas (SDK 1.29 + zod v4)

- `@modelcontextprotocol/sdk` 1.29 accepts zod v4 (`^3.25 || ^4.0`). `registerTool`
  takes `inputSchema`/`outputSchema` as **zod raw shapes** — pass `VerdictSchema.shape`,
  not the wrapped object. When `outputSchema` is set, return `structuredContent`
  (we `VerdictSchema.parse(...)` before returning so a mismatch fails in our code).
- `tsconfig` needs `"types": ["node"]` or `process`/`fetch`/`AbortSignal` won't resolve.

## ⚠️ Publishing is gated on explicit approval

`npm publish`, creating/pushing the public GitHub repo, and submitting to MCP
directories are public, hard-to-reverse outward actions. They are the GTM motion
in `KILL_CRITERION.md`, deliberately NOT done autonomously. Get a go-ahead first.

## Kill criterion

~$500 MRR via organic MCP-directory discovery alone → else rotate npm→PyPI once,
then conclude and reallocate to the collectibles portfolio. Salvage-positive
(build-in-public content regardless of outcome).
