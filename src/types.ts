import { z } from "zod";

/**
 * The shape of a dependency-fitness verdict.
 *
 * This is the product. Everything else in the codebase exists to populate
 * one of these objects honestly: a cross-validated, liability-aware answer
 * to "is this package@version fit to depend on, and if not, what do I move to?"
 *
 * Design rule: we never *guess* a migration target. When sources disagree or
 * a successor can't be established from maintainer-provided signal, we say so
 * (low confidence + a warning) rather than inventing one. A wrong "use X
 * instead" is worse than an honest "deprecated, no successor named."
 */

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

/** Where a migration-target recommendation came from (provenance = trust). */
export const MigrationSourceSchema = z.enum([
  "npm-deprecation-hint", // parsed "use X instead" from the maintainer's deprecation string
  "advisory-fixed-in", // an advisory names a fixed version to upgrade to
  "dist-tag-latest", // superseded within the same package; move to the maintained line
  "none", // deprecated/unfit but no successor could be established — do NOT guess
]);
export type MigrationSource = z.infer<typeof MigrationSourceSchema>;

export const MigrationTargetSchema = z.object({
  /** Successor package name. null => same package, just a different version. */
  package: z.string().nullable(),
  /** Recommended version (or range). null => unspecified / use the target's latest. */
  version: z.string().nullable(),
  /** Plain-English why, citing the signal it came from. Always present. */
  rationale: z.string(),
  source: MigrationSourceSchema,
  confidence: ConfidenceSchema,
});
export type MigrationTarget = z.infer<typeof MigrationTargetSchema>;

export const AdvisorySchema = z.object({
  id: z.string(),
  source: z.string(), // OSV, GHSA, etc.
  severity: z.string().nullable(),
  summary: z.string(),
  /** Versions the advisory says the fix landed in (used to bound a safe target). */
  fixed_in: z.array(z.string()),
  malicious: z.boolean(), // OSV MAL-* marker
});
export type Advisory = z.infer<typeof AdvisorySchema>;

export const SupersededSchema = z.object({
  latest: z.string(), // dist-tags.latest
  queried_is_latest: z.boolean(),
  majors_behind: z.number(),
  /** True when moving to latest crosses at least one major (breaking) boundary. */
  breaking_boundary: z.boolean(),
});
export type Superseded = z.infer<typeof SupersededSchema>;

/** Per-source transparency so a caller can audit *why* we concluded what we did. */
export const SourceSignalsSchema = z.object({
  npm: z
    .object({
      deprecated_string: z.string().nullable(),
      latest: z.string().nullable(),
      version_found: z.boolean(),
      security_hold: z.boolean(),
    })
    .nullable(),
  depsdev: z
    .object({
      is_deprecated: z.boolean().nullable(),
      is_default: z.boolean().nullable(),
      advisory_count: z.number(),
    })
    .nullable(),
  osv: z
    .object({
      vuln_count: z.number(),
      malicious: z.boolean(),
    })
    .nullable(),
  github: z
    .object({
      archived: z.boolean().nullable(),
      pushed_at: z.string().nullable(),
      stale_months: z.number().nullable(),
    })
    .nullable(),
});
export type SourceSignals = z.infer<typeof SourceSignalsSchema>;

export const VerdictSchema = z.object({
  package: z.string(),
  ecosystem: z.literal("npm"),
  /** The version the caller asked about (exact, range, or null = "latest"). */
  queried_version: z.string().nullable(),
  /** The concrete version the verdict is actually about. */
  resolved_version: z.string().nullable(),

  /** Does this package exist in the registry at all? (anti-slopsquatting) */
  exists: z.boolean(),

  deprecated: z.boolean(),
  deprecated_reason: z.string().nullable(),
  /** npm has no true "yank"; this captures security-holds / unpublished holes. */
  yanked: z.boolean(),
  malicious: z.boolean(),

  superseded_by: SupersededSchema.nullable(),
  safe_migration_target: MigrationTargetSchema.nullable(),
  advisories: z.array(AdvisorySchema),

  /** Overall trust in this verdict, after cross-validation. */
  confidence: ConfidenceSchema,
  /** Did the deprecation sources corroborate each other? */
  agreement: z.object({
    deprecation_sources_agree: z.boolean(),
    notes: z.array(z.string()),
  }),
  /** Liability-aware caveats. Empty = clean, high-trust verdict. */
  warnings: z.array(z.string()),

  signals: SourceSignalsSchema,
  sources_consulted: z.array(z.string()),
  /** ISO-8601 timestamp. Freshness is a first-class product attribute. */
  last_verified: z.string(),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const AuditSummarySchema = z.object({
  total: z.number(),
  deprecated: z.number(),
  yanked: z.number(),
  malicious: z.number(),
  vulnerable: z.number(),
  superseded: z.number(),
  not_found: z.number(),
  needs_migration: z.number(),
  clean: z.number(),
});
export type AuditSummary = z.infer<typeof AuditSummarySchema>;
