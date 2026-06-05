import semver from "semver";

/**
 * npm registry client — the authoritative source of truth for existence,
 * per-version deprecation strings, and dist-tags. All other sources corroborate
 * this one. No API key required.
 */

const NPM_REGISTRY = process.env.DEPCHECK_NPM_REGISTRY || "https://registry.npmjs.org";

export interface NpmPackument {
  name: string;
  distTags: Record<string, string>;
  versions: string[];
  deprecatedByVersion: Record<string, string | undefined>;
  time: Record<string, string>;
  repositoryUrl: string | null;
  securityHold: boolean;
  description: string | null;
}

export interface NpmResult {
  found: boolean;
  packument: NpmPackument | null;
}

/** Encode a package name for a registry path, preserving the scope slash safely. */
function encodeName(name: string): string {
  // scoped names (@scope/pkg) -> @scope%2Fpkg, which the registry accepts.
  return name.replace(/\//g, "%2F");
}

export async function fetchNpm(name: string, signal?: AbortSignal): Promise<NpmResult> {
  const res = await fetch(`${NPM_REGISTRY}/${encodeName(name)}`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (res.status === 404) return { found: false, packument: null };
  if (!res.ok) throw new Error(`npm registry returned ${res.status} for "${name}"`);
  const d = (await res.json()) as Record<string, any>;

  const versionsObj: Record<string, any> = d.versions || {};
  const versionKeys = Object.keys(versionsObj);
  const deprecatedByVersion: Record<string, string | undefined> = {};
  for (const v of versionKeys) {
    const dep = versionsObj[v]?.deprecated;
    deprecatedByVersion[v] = typeof dep === "string" ? dep : dep === true ? "deprecated" : undefined;
  }

  const description: string | null = typeof d.description === "string" ? d.description : null;
  // npm replaces malware/abuse names with a "security holding package" stub.
  const securityHold =
    /security holding package|security placeholder/i.test(description || "") ||
    (versionKeys.length > 0 && versionKeys.every((v) => /-security$/.test(v)));

  let repositoryUrl: string | null = null;
  if (d.repository) {
    repositoryUrl = typeof d.repository === "string" ? d.repository : d.repository.url ?? null;
  }

  return {
    found: true,
    packument: {
      name: d.name ?? name,
      distTags: d["dist-tags"] || {},
      versions: versionKeys,
      deprecatedByVersion,
      time: d.time || {},
      repositoryUrl,
      securityHold,
      description,
    },
  };
}

/**
 * Resolve a queried spec (exact version, semver range, dist-tag, or null) to a
 * concrete version. `found` is false when an explicitly-queried spec couldn't be
 * matched (we then fall back to latest for context, and the caller warns).
 */
export function resolveVersion(
  packument: NpmPackument,
  queried: string | null,
): { version: string | null; found: boolean } {
  const latest = packument.distTags.latest ?? null;
  if (!queried) return { version: latest, found: latest != null };
  if (packument.versions.includes(queried)) return { version: queried, found: true };
  if (packument.distTags[queried]) return { version: packument.distTags[queried], found: true };
  try {
    const max = semver.maxSatisfying(packument.versions, queried, { includePrerelease: false });
    if (max) return { version: max, found: true };
  } catch {
    // not a valid range; fall through
  }
  return { version: latest, found: false };
}
