import { getVerdict, type VerdictDeps } from "./verdict.js";
import { type Verdict, type AuditSummary } from "./types.js";

/** Maximum packages audited in one batch call (bounds free-tier cost). */
export const MAX_BATCH = Number(process.env.DEPCHECK_MAX_BATCH || 50);
const CONCURRENCY = Number(process.env.DEPCHECK_CONCURRENCY || 6);

export interface PackageSpec {
  name: string;
  version: string | null;
}

/** Parse "name", "name@1.2.3", "@scope/name@^4" into {name, version}. */
export function parseSpec(spec: string): PackageSpec | null {
  const s = spec.trim();
  if (!s) return null;
  const at = s.lastIndexOf("@");
  // unscoped with no version, or scoped name with no version (only the leading @)
  if (at <= 0) return { name: s, version: null };
  return { name: s.slice(0, at), version: s.slice(at + 1) || null };
}

/** Extract {name, range} pairs from raw package.json content (all dep sections). */
export function parsePackageJson(content: string): PackageSpec[] {
  const json = JSON.parse(content) as Record<string, any>;
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const out = new Map<string, string | null>();
  for (const sec of sections) {
    const obj = json[sec];
    if (obj && typeof obj === "object") {
      for (const [name, range] of Object.entries(obj)) {
        if (!out.has(name)) out.set(name, typeof range === "string" ? range : null);
      }
    }
  }
  return [...out.entries()].map(([name, version]) => ({ name, version }));
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker(): Promise<void> {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function summarize(results: Verdict[]): AuditSummary {
  const s: AuditSummary = {
    total: results.length,
    deprecated: 0,
    yanked: 0,
    malicious: 0,
    vulnerable: 0,
    superseded: 0,
    not_found: 0,
    needs_migration: 0,
    clean: 0,
  };
  for (const v of results) {
    if (!v.exists) s.not_found++;
    if (v.deprecated) s.deprecated++;
    if (v.yanked) s.yanked++;
    if (v.malicious) s.malicious++;
    if (v.advisories.length) s.vulnerable++;
    if (v.superseded_by && v.superseded_by.majors_behind > 0) s.superseded++;
    if (v.safe_migration_target) s.needs_migration++;
    if (v.exists && !v.deprecated && !v.malicious && !v.yanked && v.advisories.length === 0) s.clean++;
  }
  return s;
}

export interface AuditResult {
  summary: AuditSummary;
  results: Verdict[];
  truncated: number; // how many specs were dropped by the MAX_BATCH cap
}

export async function auditPackages(specs: PackageSpec[], deps?: VerdictDeps): Promise<AuditResult> {
  // de-dupe by name (keep first-seen version)
  const seen = new Map<string, PackageSpec>();
  for (const sp of specs) if (!seen.has(sp.name)) seen.set(sp.name, sp);
  const unique = [...seen.values()];
  const capped = unique.slice(0, MAX_BATCH);
  const truncated = unique.length - capped.length;

  const results = await mapWithConcurrency(capped, CONCURRENCY, (sp) =>
    deps ? getVerdict(sp.name, sp.version, deps) : getVerdict(sp.name, sp.version),
  );
  return { summary: summarize(results), results, truncated };
}
