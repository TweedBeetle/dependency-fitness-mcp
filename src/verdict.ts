import semver from "semver";
import {
  type Verdict,
  type MigrationTarget,
  type Advisory,
  type Superseded,
  type Confidence,
  VerdictSchema,
} from "./types.js";
import { fetchNpm, resolveVersion, type NpmResult } from "./sources/npm.js";
import { fetchDepsDev } from "./sources/depsdev.js";
import { fetchOsv } from "./sources/osv.js";
import { fetchGithub } from "./sources/github.js";

// ---------------------------------------------------------------------------
// Pure helpers (no network) — these are the synthesis logic and are unit-tested
// directly. The orchestrator below wires source clients into them.
// ---------------------------------------------------------------------------

const NODE_BUILTINS = new Set([
  "fs", "path", "http", "https", "url", "crypto", "stream", "events", "util",
  "os", "buffer", "child_process", "net", "dns", "zlib", "assert", "timers",
  "tls", "fetch", "process", "querystring",
]);

// Tokens that follow "use"/"recommend" but are not a successor package.
const STOPWORDS = new Set([
  "this", "it", "that", "them", "these", "those", "the", "a", "an", "your",
  "our", "one", "something", "instead", "node", "npm", "version", "latest",
]);

const NPM_NAME = /^(?:@[a-z0-9-][a-z0-9-._]*\/)?[a-z0-9-][a-z0-9-._]*$/;

export interface ParsedHint {
  name: string;
  kind: "npm" | "builtin" | "native";
}

/**
 * Extract a maintainer-named successor from a deprecation string.
 *
 * This is deliberately conservative. It only fires on explicit "use / recommend
 * / in favor of / replaced by / migrate to / renamed to" phrasings, because the
 * cost of a wrong successor (a coding agent installs the wrong thing) is high.
 * Crucially it must NOT mistake a package named as the *reason* for one named as
 * the *successor* — e.g. request-promise's "extends the now deprecated request
 * package" names no successor and must return null.
 */
export function parseMigrationHint(
  message: string | null | undefined,
  ownName: string,
): ParsedHint | null {
  if (!message) return null;
  const patterns: RegExp[] = [
    /\bin\s+favou?r\s+of\s+[`'"]?([@a-zA-Z0-9._/:-]+)/i,
    /\brecommend(?:s|ed|ing)?\s+(?:using\s+)?(?:the\s+)?[`'"]?([@a-zA-Z0-9._/:-]+)/i,
    /\b(?:migrate|switch|moved?)\s+to\s+(?:the\s+)?[`'"]?([@a-zA-Z0-9._/:-]+)/i,
    /\breplaced?\s+(?:by|with)\s+(?:the\s+)?[`'"]?([@a-zA-Z0-9._/:-]+)/i,
    /\bsuperseded\s+by\s+[`'"]?([@a-zA-Z0-9._/:-]+)/i,
    /\brenamed\s+to\s+[`'"]?([@a-zA-Z0-9._/:-]+)/i,
    /\buse\s+(?:the\s+)?[`'"]?([@a-zA-Z0-9._/:-]+)/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (!m) continue;
    const tok = m[1].replace(/^[`'"(]+/, "").replace(/[`'".,!?;:)]+$/, "").trim();
    if (!tok) continue;
    const lower = tok.toLowerCase();
    if (STOPWORDS.has(lower)) continue;
    if (lower === ownName.toLowerCase()) continue; // can't migrate to self
    if (/:\/\//.test(tok)) continue; // a URL slipped through
    if (tok.startsWith("node:") || NODE_BUILTINS.has(lower)) return { name: tok, kind: "builtin" };
    if (NPM_NAME.test(tok)) return { name: tok, kind: "npm" };
    return { name: tok, kind: "native" }; // e.g. URLSearchParams, String.prototype.padStart()
  }
  return null;
}

export function computeSuperseded(
  resolvedVersion: string | null,
  latest: string | null,
): Superseded | null {
  if (!resolvedVersion || !latest) return null;
  const rv = semver.valid(resolvedVersion) ? resolvedVersion : semver.valid(semver.coerce(resolvedVersion));
  const lv = semver.valid(latest) ? latest : semver.valid(semver.coerce(latest));
  if (!rv || !lv) {
    return { latest, queried_is_latest: resolvedVersion === latest, majors_behind: 0, breaking_boundary: false };
  }
  const majors = Math.max(0, semver.major(lv) - semver.major(rv));
  return {
    latest,
    queried_is_latest: semver.eq(rv, lv),
    majors_behind: majors,
    breaking_boundary: majors > 0,
  };
}

export interface DeprecationCrossCheck {
  deprecated: boolean;
  agree: boolean;
  notes: string[];
  warnings: string[];
}

export function crossValidateDeprecation(
  npmDeprecatedStr: string | null,
  depsdevIsDeprecated: boolean | null,
  githubArchived: boolean | null,
): DeprecationCrossCheck {
  const npmFlag = !!npmDeprecatedStr;
  const deprecated = npmFlag || depsdevIsDeprecated === true;
  const notes: string[] = [];
  const warnings: string[] = [];
  let agree = true;

  if (depsdevIsDeprecated !== null && npmFlag !== depsdevIsDeprecated) {
    agree = false;
    notes.push(
      `npm registry and deps.dev disagree on deprecation (npm=${npmFlag}, deps.dev=${depsdevIsDeprecated}).`,
    );
  } else if (depsdevIsDeprecated !== null) {
    notes.push(`npm registry and deps.dev agree (deprecated=${deprecated}).`);
  }

  if (!deprecated && githubArchived === true) {
    warnings.push(
      "Not formally deprecated, but its GitHub repository is archived — possible 'deceptive deprecation' (unmaintained but unflagged).",
    );
  }
  return { deprecated, agree, notes, warnings };
}

export interface SuccessorCheck {
  exists: boolean;
  deprecated: boolean;
  latest: string | null;
}

export interface MigrationInput {
  deprecated: boolean;
  malicious: boolean;
  hint: ParsedHint | null;
  hintCheck: SuccessorCheck | null;
  advisories: Advisory[];
  resolvedVersion: string | null;
}

/**
 * Decide the safe migration target — or honestly decline to.
 *
 * The governing rule (liability): emit a target only when there is an actual
 * fitness problem (deprecated / malicious / vulnerable). A merely-behind but
 * healthy package gets no "upgrade" push — superseded_by already carries the gap.
 * And when a problem exists but no successor can be established, we say so with
 * low confidence rather than guessing.
 */
export function selectMigrationTarget(input: MigrationInput): MigrationTarget | null {
  const { deprecated, malicious, hint, hintCheck, advisories, resolvedVersion } = input;

  if ((deprecated || malicious) && hint) {
    if (hint.kind === "builtin") {
      return {
        package: hint.name,
        version: null,
        source: "npm-deprecation-hint",
        rationale: `Maintainer's deprecation notice recommends the runtime built-in '${hint.name}'.`,
        confidence: "medium",
      };
    }
    if (hint.kind === "native") {
      return {
        package: null,
        version: null,
        source: "npm-deprecation-hint",
        rationale: `Maintainer recommends a language/runtime API ('${hint.name}'), not an npm package — replace the usage in code rather than swapping a dependency.`,
        confidence: "medium",
      };
    }
    // npm successor — trust depends on the cross-validation result.
    if (hintCheck && !hintCheck.exists) {
      return {
        package: hint.name,
        version: null,
        source: "npm-deprecation-hint",
        rationale: `Maintainer names '${hint.name}' as the successor, but it was NOT found in the npm registry — verify before adopting.`,
        confidence: "low",
      };
    }
    if (hintCheck && hintCheck.deprecated) {
      return {
        package: hint.name,
        version: null,
        source: "npm-deprecation-hint",
        rationale: `Maintainer names '${hint.name}' as the successor, but '${hint.name}' is ITSELF deprecated — do not adopt without checking.`,
        confidence: "low",
      };
    }
    return {
      package: hint.name,
      version: hintCheck?.latest ?? null,
      source: "npm-deprecation-hint",
      rationale: `Maintainer's deprecation notice recommends '${hint.name}'${hintCheck?.latest ? ` (current ${hintCheck.latest}, verified present and not deprecated)` : ""}.`,
      confidence: hintCheck ? "high" : "medium",
    };
  }

  if (deprecated || malicious) {
    return {
      package: null,
      version: null,
      source: "none",
      rationale: `Marked ${malicious ? "malicious" : "deprecated"}, but the maintainer named no successor and none could be reliably inferred. Manual evaluation required — we do not guess.`,
      confidence: "low",
    };
  }

  if (advisories.length && resolvedVersion) {
    const fixes = advisories.flatMap((a) => a.fixed_in).filter((v) => semver.valid(v));
    const ahead = fixes.filter((v) => semver.gt(v, resolvedVersion)).sort(semver.compare);
    if (ahead.length) {
      return {
        package: null,
        version: `>=${ahead[0]}`,
        source: "advisory-fixed-in",
        rationale: `Version ${resolvedVersion} is affected by ${advisories.length} advisory(ies); upgrade to >= ${ahead[0]} (first version with a published fix).`,
        confidence: "high",
      };
    }
    return {
      package: null,
      version: null,
      source: "none",
      rationale: `Affected by ${advisories.length} advisory(ies) with no fixed version published — consider replacing the dependency.`,
      confidence: "medium",
    };
  }

  return null; // healthy, or only behind — no migration pushed
}

export function computeConfidence(args: {
  depsdevOk: boolean;
  agree: boolean;
  versionResolved: boolean;
}): Confidence {
  if (!args.agree) return "low"; // sources actively disagree on a binary fact
  let level: Confidence = "high";
  if (!args.depsdevOk) level = "medium"; // could not corroborate deprecation
  if (!args.versionResolved) level = "medium";
  return level;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface VerdictDeps {
  fetchNpm: typeof fetchNpm;
  fetchDepsDev: typeof fetchDepsDev;
  fetchOsv: typeof fetchOsv;
  fetchGithub: typeof fetchGithub;
  now: () => Date;
}

const defaultDeps: VerdictDeps = {
  fetchNpm,
  fetchDepsDev,
  fetchOsv,
  fetchGithub,
  now: () => new Date(),
};

async function buildNotFoundVerdict(
  name: string,
  queried: string | null,
  deps: VerdictDeps,
  now: Date,
): Promise<Verdict> {
  // A 404 is authoritative for "does not exist", but a name removed for malware
  // returns 404 too — so we still ask OSV, which keeps MAL-* records by name.
  const osv = await deps.fetchOsv(name, null).catch(() => ({ ok: false, vulns: [] as const }));
  const malRecord = osv.ok && osv.vulns.some((v) => v.malicious);
  const warnings = [
    `Package "${name}" was not found in the npm registry. It may be unpublished, typo-squatted, or a hallucinated package name (slopsquatting) — do not install without verifying.`,
  ];
  if (malRecord) {
    warnings.push(
      "OSV has a malicious-package (MAL-*) record under this exact name — strong indicator the name was removed for security reasons.",
    );
  }
  return VerdictSchema.parse({
    package: name,
    ecosystem: "npm",
    queried_version: queried,
    resolved_version: null,
    exists: false,
    deprecated: false,
    deprecated_reason: null,
    yanked: false,
    malicious: malRecord,
    superseded_by: null,
    safe_migration_target: null,
    advisories: osv.ok
      ? osv.vulns.map((v) => ({
          id: v.id,
          source: v.malicious ? "OSV-malicious" : "OSV",
          severity: v.severity,
          summary: v.summary,
          fixed_in: v.fixed,
          malicious: v.malicious,
        }))
      : [],
    confidence: "high",
    agreement: { deprecation_sources_agree: true, notes: ["package not found"] },
    warnings,
    signals: {
      npm: { deprecated_string: null, latest: null, version_found: false, security_hold: false },
      depsdev: null,
      osv: osv.ok ? { vuln_count: osv.vulns.length, malicious: malRecord } : null,
      github: null,
    },
    sources_consulted: osv.ok ? ["npm-registry", "osv.dev"] : ["npm-registry"],
    last_verified: now.toISOString(),
  });
}

/**
 * Produce a cross-validated fitness verdict for an npm `package` (optionally at a
 * specific version/range). npm registry is authoritative and may throw on a hard
 * network failure; deps.dev / OSV / GitHub are best-effort corroborators whose
 * absence degrades confidence (surfaced in `warnings`) but never fabricates data.
 */
export async function getVerdict(
  name: string,
  queried: string | null = null,
  deps: VerdictDeps = defaultDeps,
): Promise<Verdict> {
  const now = deps.now();
  const npm: NpmResult = await deps.fetchNpm(name);
  if (!npm.found || !npm.packument) {
    return buildNotFoundVerdict(name, queried, deps, now);
  }
  const pk = npm.packument;
  const { version: resolved, found: versionFound } = resolveVersion(pk, queried);
  const npmDeprecatedStr = resolved ? pk.deprecatedByVersion[resolved] ?? null : null;

  const [dd, osv, gh] = await Promise.all([
    resolved
      ? deps.fetchDepsDev(name, resolved).catch(() => ({
          ok: false,
          isDeprecated: null,
          deprecatedReason: null,
          isDefault: null,
          advisoryKeys: [],
        }))
      : Promise.resolve({ ok: false, isDeprecated: null, deprecatedReason: null, isDefault: null, advisoryKeys: [] }),
    deps.fetchOsv(name, resolved).catch(() => ({ ok: false, vulns: [] })),
    deps.fetchGithub(pk.repositoryUrl, now).catch(() => ({
      ok: false,
      archived: null,
      pushedAt: null,
      staleMonths: null,
      reason: "github request error",
    })),
  ]);

  const sourcesConsulted = ["npm-registry"];
  if (dd.ok) sourcesConsulted.push("deps.dev");
  if (osv.ok) sourcesConsulted.push("osv.dev");
  if (gh.ok) sourcesConsulted.push("github");

  const cv = crossValidateDeprecation(npmDeprecatedStr, dd.isDeprecated, gh.archived);

  const advisories: Advisory[] = osv.vulns.map((v) => ({
    id: v.id,
    source: v.malicious ? "OSV-malicious" : v.id.startsWith("GHSA") ? "GHSA" : "OSV",
    severity: v.severity,
    summary: v.summary,
    fixed_in: v.fixed,
    malicious: v.malicious,
  }));
  const malicious = advisories.some((a) => a.malicious) || pk.securityHold;
  const superseded = computeSuperseded(resolved, pk.distTags.latest ?? null);

  // Cross-validate the maintainer-suggested successor (the liability guard):
  // never recommend a successor that's missing or itself deprecated.
  const hint = parseMigrationHint(npmDeprecatedStr ?? dd.deprecatedReason, name);
  let hintCheck: SuccessorCheck | null = null;
  if (hint && hint.kind === "npm" && (cv.deprecated || malicious)) {
    try {
      const sres = await deps.fetchNpm(hint.name);
      if (!sres.found || !sres.packument) {
        hintCheck = { exists: false, deprecated: false, latest: null };
      } else {
        const sl = sres.packument.distTags.latest ?? null;
        const sdep = sl ? !!sres.packument.deprecatedByVersion[sl] : false;
        hintCheck = { exists: true, deprecated: sdep, latest: sl };
      }
      sourcesConsulted.push("npm-registry(successor)");
    } catch {
      hintCheck = null;
    }
  }

  const migration = selectMigrationTarget({
    deprecated: cv.deprecated,
    malicious,
    hint,
    hintCheck,
    advisories,
    resolvedVersion: resolved,
  });

  const warnings = [...cv.warnings];
  if (queried && !versionFound) {
    warnings.push(`Queried version "${queried}" was not found; verdict reflects resolved version "${resolved}".`);
  }
  if (!dd.ok) warnings.push("deps.dev could not be reached — deprecation was not cross-validated against a second source.");
  if (!osv.ok) warnings.push("OSV advisory data could not be reached — vulnerability/malware status is unconfirmed.");
  if (pk.repositoryUrl && !gh.ok && gh.reason) warnings.push(`GitHub repo signal unavailable (${gh.reason}).`);
  if (hint && hintCheck && !hintCheck.exists) warnings.push(`Maintainer-suggested successor "${hint.name}" was not found in the registry.`);
  if (hint && hintCheck && hintCheck.deprecated) warnings.push(`Maintainer-suggested successor "${hint.name}" is itself deprecated.`);
  if (pk.securityHold) warnings.push("This name is a registry security-hold placeholder — the original package was removed for security reasons.");
  if (!resolved) warnings.push("No resolvable version (the package has no published 'latest' dist-tag).");

  const confidence = computeConfidence({
    depsdevOk: dd.ok,
    agree: cv.agree,
    versionResolved: !!resolved && (!queried || versionFound),
  });

  return VerdictSchema.parse({
    package: name,
    ecosystem: "npm",
    queried_version: queried,
    resolved_version: resolved,
    exists: true,
    deprecated: cv.deprecated,
    deprecated_reason: npmDeprecatedStr ?? dd.deprecatedReason ?? null,
    yanked: pk.securityHold,
    malicious,
    superseded_by: superseded,
    safe_migration_target: migration,
    advisories,
    confidence,
    agreement: { deprecation_sources_agree: cv.agree, notes: cv.notes },
    warnings,
    signals: {
      npm: {
        deprecated_string: npmDeprecatedStr,
        latest: pk.distTags.latest ?? null,
        version_found: versionFound,
        security_hold: pk.securityHold,
      },
      depsdev: dd.ok
        ? { is_deprecated: dd.isDeprecated, is_default: dd.isDefault, advisory_count: dd.advisoryKeys.length }
        : null,
      osv: osv.ok ? { vuln_count: osv.vulns.length, malicious: osv.vulns.some((v) => v.malicious) } : null,
      github: gh.ok ? { archived: gh.archived, pushed_at: gh.pushedAt, stale_months: gh.staleMonths } : null,
    },
    sources_consulted: sourcesConsulted,
    last_verified: now.toISOString(),
  });
}
