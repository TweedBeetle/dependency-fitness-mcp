# Kill criterion, validation design & roadmap

This project is a **fast, cheap, salvage-positive validation bet**, not a
flagship. Its job is to test one thing: *can a narrow "agent-data endpoint,
distributed via MCP directories" find paying users through organic directory
discovery alone — with zero cold outreach?*

## The kill criterion (the load-bearing line)

> **If dependency-fitness-mcp cannot reach ~$500 MRR via organic MCP-directory discovery
> alone — no cold outreach, within a defined window — rotate the ecosystem
> (npm → PyPI) once, then conclude and reallocate to the collectibles
> portfolio.**

~$500 MRR ≈ 26 subscribers at $19/mo, or the equivalent in usage credits. That is
the documented floor for a viable lifestyle-tier dev-data MCP; the realistic
*ceiling* for a well-positioned one is ~$2–6K/mo. This is a modest node by
design — fine for a portfolio, never the whole bet.

**Why this is safe to test cheaply:** the entire data loop is free and
sanctioned (npm registry, deps.dev, OSV, GitHub — no keys, no scraping, no ToS
grey area), and the build itself is publishable build-in-public content
regardless of outcome. Even a "fails the MRR test" result yields the audience
keystone (the deprecation / slopsquatting findings, the live endpoint) as
salvage. There is no outcome where this build is wasted.

## What "organic directory discovery alone" means

The test is the *channel*, so the rule is: **no cold-selling.** The only
allowed motion is:

1. Ship a genuinely useful **free tier** as the hook (usage-based, non-expiring
   credits — solo devs and deployed agents consume very differently).
2. **Seed every MCP directory** and own the *differentiated* listing term.
3. Publish the build-in-public artifact (counts as audience-building, not
   cold-sell).

If users and conversions don't arrive through those passive surfaces, the
channel thesis is disconfirmed — which is exactly the cheap signal we want.

## Directory-seeding checklist (the distribution motion)

The generic "package version checker" listing term is already taken by free
servers. The **open** term is the differentiator — lead every listing with
*migration target + cross-validation*, not "version checker."

- [ ] npm publish (claims the `dependency-fitness-mcp` package name + `npx` install path)
- [ ] GitHub repo public (the canonical home + build-in-public surface)
- [ ] [mcp.so](https://mcp.so)
- [ ] [smithery.ai](https://smithery.ai)
- [ ] [glama.ai/mcp](https://glama.ai/mcp)
- [ ] [PulseMCP](https://www.pulsemcp.com) (and chase a weekly-digest feature — a high-signal editorial boost)
- [ ] [Official MCP registry](https://registry.modelcontextprotocol.io) (publish `server.json`)
- [ ] PR to [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

Servers on 5+ directories see materially more installs. Listing copy should hit
the search terms the free version-checkers structurally can't claim:
*deprecation, yanked, superseded, migration target, supply-chain, slopsquatting.*

## Productization shape (free hook → paid verified/batch)

The code is tier-agnostic today; these are the intended commercial tiers, not
built-in gates yet:

- **Free (the hook):** N verdict-queries/month, full single-package verdict.
- **Standard (~$9–19/mo):** generous query allotment + full migration reasoning.
- **CI / batch (~$49–149/mo):** `audit_dependencies` over a whole manifest as a
  pre-merge gate — higher willingness-to-pay because it gates a release.

Per-call / x402 is a possible rail but demand is thin; subscription is the
revenue.

## Roadmap (documented, deliberately not yet built)

The thin npm verdict ships first; these are the next layers, in order of value:

- **De-facto-successor inference.** Beyond parsing the maintainer's deprecation
  string: learn the *real* successor by mining what high-trust packages actually
  depend on now. This is the deepest part of the moat and the heaviest build —
  an agent-fleet "freshness treadmill" workload.
- **PyPI** as the fast-follow ecosystem (the one rotation the kill criterion
  allows before concluding). PyPI's deprecation story is less mature, so it's
  *more* synthesis work, not less.
- **Freshness treadmill.** Scheduled re-verification of a covered corpus so
  `last_verified` stays meaningful — the thing that justifies paying over a
  one-off `npm outdated`.

## The honest competitive read

The window is real but narrowing. deps.dev could add a "recommended replacement"
field; Socket/SafeDep could extend into currency; GitHub's Copilot could do
native migration inference. That's *why* this is a fast cheap test rather than a
slow careful build — and why the durable asset is the published methodology and
the directory positions, not the endpoint itself.
