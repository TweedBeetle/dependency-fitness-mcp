#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getVerdict } from "./verdict.js";
import { auditPackages, parseSpec, parsePackageJson, MAX_BATCH, type PackageSpec } from "./audit.js";
import { renderVerdict, renderSummary } from "./render.js";
import { VerdictSchema, AuditSummarySchema } from "./types.js";

const VERSION = "0.1.1";

const server = new McpServer(
  { name: "dependency-fitness-mcp", version: VERSION },
  {
    instructions:
      "Cross-validated dependency FITNESS verdicts for npm packages. Before writing or upgrading " +
      "a dependency, call check_package_fitness to learn whether a package@version is deprecated, " +
      "yanked, superseded, or malicious — and, when it is, what to safely migrate to. The verdict " +
      "is reconciled across the npm registry, deps.dev, OSV, and GitHub, with an explicit confidence " +
      "level and warnings when sources disagree. It will NOT guess a migration target it can't " +
      "substantiate. Use audit_dependencies to check a whole package.json at once.",
  },
);

// ---------------------------------------------------------------------------
// Tool 1: single-package fitness verdict
// ---------------------------------------------------------------------------
server.registerTool(
  "check_package_fitness",
  {
    title: "Check npm package fitness",
    description:
      "Return a cross-validated fitness verdict for an npm package: is it deprecated / yanked / " +
      "superseded / malicious, and if so what is the safe migration target. Unlike a plain " +
      "'is it deprecated' lookup, this reconciles the npm registry, deps.dev, OSV and GitHub into " +
      "one confidence-scored answer, infers a safe replacement when one exists, and flags " +
      "disagreement instead of guessing. Also detects non-existent / hallucinated package names.",
    inputSchema: {
      package: z.string().describe("npm package name, e.g. 'request' or '@babel/core'"),
      version: z
        .string()
        .optional()
        .describe("Exact version, semver range, or dist-tag. Omit to check the current 'latest'."),
    },
    outputSchema: VerdictSchema.shape,
  },
  async ({ package: pkg, version }) => {
    try {
      const verdict = await getVerdict(pkg, version ?? null);
      return {
        content: [{ type: "text", text: renderVerdict(verdict) }],
        structuredContent: verdict,
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error checking "${pkg}": ${(e as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool 2: batch audit (the CI / whole-package.json shape)
// ---------------------------------------------------------------------------
server.registerTool(
  "audit_dependencies",
  {
    title: "Audit npm dependencies",
    description:
      "Audit many npm dependencies at once and return a per-package fitness verdict plus a summary " +
      "(how many are deprecated / malicious / vulnerable / behind). Accepts a list of package specs " +
      "(e.g. ['react@18.2.0', 'request']) and/or the raw contents of a package.json. Ideal for a " +
      `CI / pre-merge dependency gate. Capped at ${MAX_BATCH} packages per call.`,
    inputSchema: {
      packages: z
        .array(z.string())
        .optional()
        .describe("Package specs, e.g. ['lodash@^4', '@babel/core', 'request@2.88.2']."),
      package_json: z
        .string()
        .optional()
        .describe("Raw package.json contents; all dependency sections are extracted."),
    },
    outputSchema: {
      summary: AuditSummarySchema,
      results: z.array(VerdictSchema),
      truncated: z.number(),
    },
  },
  async ({ packages, package_json }) => {
    const specs: PackageSpec[] = [];
    if (Array.isArray(packages)) {
      for (const s of packages) {
        const parsed = parseSpec(s);
        if (parsed) specs.push(parsed);
      }
    }
    if (package_json) {
      try {
        specs.push(...parsePackageJson(package_json));
      } catch (e) {
        return {
          content: [{ type: "text", text: `Could not parse package_json: ${(e as Error).message}` }],
          isError: true,
        };
      }
    }
    if (specs.length === 0) {
      return {
        content: [{ type: "text", text: "Provide at least one of: 'packages' (specs) or 'package_json'." }],
        isError: true,
      };
    }
    try {
      const { summary, results, truncated } = await auditPackages(specs);
      const header = renderSummary(summary);
      const truncNote =
        truncated > 0 ? `\n(⚠ ${truncated} package(s) beyond the ${MAX_BATCH}-package cap were not audited.)` : "";
      const body = results.map(renderVerdict).join("\n\n");
      return {
        content: [{ type: "text", text: `${header}${truncNote}\n\n${body}` }],
        structuredContent: { summary, results, truncated },
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Audit failed: ${(e as Error).message}` }],
        isError: true,
      };
    }
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr only — stdout is the JSON-RPC channel and must not be polluted.
  process.stderr.write(`dependency-fitness-mcp v${VERSION} ready (stdio)\n`);
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${(e as Error).stack || e}\n`);
  process.exit(1);
});
