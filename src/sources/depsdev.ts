/**
 * deps.dev v3 client (Google) — the second deprecation source we cross-validate
 * against the npm registry. Serves isDeprecated / deprecatedReason / isDefault /
 * advisoryKeys for 50M+ versions, free, no key. A best-effort corroborator: a
 * failure degrades confidence, it does not fail the verdict.
 */

const DEPSDEV = process.env.DEPCHECK_DEPSDEV || "https://api.deps.dev/v3";

export interface DepsDevResult {
  ok: boolean;
  isDeprecated: boolean | null;
  deprecatedReason: string | null;
  isDefault: boolean | null;
  advisoryKeys: string[];
}

const EMPTY: DepsDevResult = {
  ok: false,
  isDeprecated: null,
  deprecatedReason: null,
  isDefault: null,
  advisoryKeys: [],
};

export async function fetchDepsDev(
  name: string,
  version: string,
  signal?: AbortSignal,
): Promise<DepsDevResult> {
  const url = `${DEPSDEV}/systems/npm/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`;
  const res = await fetch(url, { headers: { accept: "application/json" }, signal });
  if (!res.ok) return { ...EMPTY };
  const d = (await res.json()) as Record<string, any>;
  return {
    ok: true,
    isDeprecated: typeof d.isDeprecated === "boolean" ? d.isDeprecated : null,
    deprecatedReason: typeof d.deprecatedReason === "string" && d.deprecatedReason ? d.deprecatedReason : null,
    isDefault: typeof d.isDefault === "boolean" ? d.isDefault : null,
    advisoryKeys: Array.isArray(d.advisoryKeys)
      ? d.advisoryKeys.map((a: any) => a?.id).filter((x: any): x is string => typeof x === "string")
      : [],
  };
}
