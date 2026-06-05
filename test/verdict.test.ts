import { describe, it, expect } from "vitest";
import {
  parseMigrationHint,
  computeSuperseded,
  crossValidateDeprecation,
  selectMigrationTarget,
  computeConfidence,
  getVerdict,
  type VerdictDeps,
} from "../src/verdict.js";

// Real deprecation strings observed live on the npm registry (2026-06).
const REAL = {
  request: "request has been deprecated, see https://github.com/request/request/issues/3142",
  nodeUuid: "Use uuid module instead",
  babelEs2015:
    "🙌  Thanks for using Babel: we recommend using babel-preset-env now: please read https://babeljs.io/env to update!",
  requestPromise:
    "request-promise has been deprecated because it extends the now deprecated request package, see https://github.com/request/request/issues/3142",
  harValidator: "this library is no longer supported",
  querystring:
    "The querystring API is considered Legacy. new code should use the URLSearchParams API instead.",
  leftPad: "use String.prototype.padStart()",
  gulpUtil:
    "gulp-util is deprecated - replace it, following the guidelines at https://medium.com/gulpjs/gulp-util-ca3b1f9f9ac5",
};

describe("parseMigrationHint", () => {
  it("extracts a real npm successor: 'Use uuid module instead' -> uuid", () => {
    expect(parseMigrationHint(REAL.nodeUuid, "node-uuid")).toEqual({ name: "uuid", kind: "npm" });
  });

  it("extracts 'we recommend using babel-preset-env' -> babel-preset-env", () => {
    expect(parseMigrationHint(REAL.babelEs2015, "babel-preset-es2015")).toEqual({
      name: "babel-preset-env",
      kind: "npm",
    });
  });

  it("extracts 'in favor of @babel/preset-env' -> scoped successor", () => {
    expect(
      parseMigrationHint("This package has been deprecated in favor of @babel/preset-env", "babel-preset-es2015"),
    ).toEqual({ name: "@babel/preset-env", kind: "npm" });
  });

  it("ADVERSARIAL: request-promise names 'request' as the REASON, not a target -> null", () => {
    // The single most important case: must not recommend the also-deprecated 'request'.
    expect(parseMigrationHint(REAL.requestPromise, "request-promise")).toBeNull();
  });

  it("returns null when the notice only links to an article (gulp-util)", () => {
    expect(parseMigrationHint(REAL.gulpUtil, "gulp-util")).toBeNull();
  });

  it("returns null for 'no longer supported' with no successor", () => {
    expect(parseMigrationHint(REAL.harValidator, "har-validator")).toBeNull();
  });

  it("returns null for request's issue-link-only notice", () => {
    expect(parseMigrationHint(REAL.request, "request")).toBeNull();
  });

  it("classifies a runtime API as 'native', not an npm package (left-pad)", () => {
    expect(parseMigrationHint(REAL.leftPad, "left-pad")).toEqual({
      name: "String.prototype.padStart",
      kind: "native",
    });
  });

  it("classifies URLSearchParams as native (querystring)", () => {
    const r = parseMigrationHint(REAL.querystring, "querystring");
    expect(r?.kind).toBe("native");
    expect(r?.name).toBe("URLSearchParams");
  });

  it("classifies a node: builtin as 'builtin'", () => {
    expect(parseMigrationHint("Deprecated, use node:fs instead", "graceful-fs")).toEqual({
      name: "node:fs",
      kind: "builtin",
    });
  });

  it("never recommends migrating to self", () => {
    expect(parseMigrationHint("use foo instead", "foo")).toBeNull();
  });

  it("rejects stopwords ('use this instead')", () => {
    expect(parseMigrationHint("Please do not use this anymore", "x")).toBeNull();
  });

  it("returns null for empty / undefined input", () => {
    expect(parseMigrationHint(null, "x")).toBeNull();
    expect(parseMigrationHint("", "x")).toBeNull();
  });
});

describe("computeSuperseded", () => {
  it("flags a major-behind version as a breaking boundary", () => {
    expect(computeSuperseded("18.2.0", "19.2.7")).toEqual({
      latest: "19.2.7",
      queried_is_latest: false,
      majors_behind: 1,
      breaking_boundary: true,
    });
  });

  it("marks the latest version as latest", () => {
    const s = computeSuperseded("19.2.7", "19.2.7");
    expect(s?.queried_is_latest).toBe(true);
    expect(s?.majors_behind).toBe(0);
  });

  it("returns null when version or latest is missing", () => {
    expect(computeSuperseded(null, "1.0.0")).toBeNull();
    expect(computeSuperseded("1.0.0", null)).toBeNull();
  });
});

describe("crossValidateDeprecation", () => {
  it("agrees when npm and deps.dev both say deprecated", () => {
    const r = crossValidateDeprecation("deprecated msg", true, null);
    expect(r.deprecated).toBe(true);
    expect(r.agree).toBe(true);
  });

  it("flags disagreement when sources conflict", () => {
    const r = crossValidateDeprecation("deprecated msg", false, null);
    expect(r.deprecated).toBe(true); // npm flag still wins for the boolean
    expect(r.agree).toBe(false);
    expect(r.notes.join(" ")).toMatch(/disagree/i);
  });

  it("detects deceptive deprecation (not flagged, repo archived)", () => {
    const r = crossValidateDeprecation(null, false, true);
    expect(r.deprecated).toBe(false);
    expect(r.warnings.join(" ")).toMatch(/deceptive deprecation/i);
  });
});

describe("selectMigrationTarget", () => {
  const base = { advisories: [], resolvedVersion: "1.0.0" as string | null };

  it("recommends a verified npm successor with high confidence", () => {
    const t = selectMigrationTarget({
      ...base,
      deprecated: true,
      malicious: false,
      hint: { name: "uuid", kind: "npm" },
      hintCheck: { exists: true, deprecated: false, latest: "14.0.0" },
    });
    expect(t).toMatchObject({ package: "uuid", version: "14.0.0", confidence: "high" });
  });

  it("downgrades to low when the suggested successor is itself deprecated", () => {
    const t = selectMigrationTarget({
      ...base,
      deprecated: true,
      malicious: false,
      hint: { name: "request", kind: "npm" },
      hintCheck: { exists: true, deprecated: true, latest: "2.88.2" },
    });
    expect(t?.confidence).toBe("low");
    expect(t?.rationale).toMatch(/itself deprecated/i);
  });

  it("downgrades to low when the suggested successor does not exist", () => {
    const t = selectMigrationTarget({
      ...base,
      deprecated: true,
      malicious: false,
      hint: { name: "ghostpkg", kind: "npm" },
      hintCheck: { exists: false, deprecated: false, latest: null },
    });
    expect(t?.confidence).toBe("low");
    expect(t?.rationale).toMatch(/not found/i);
  });

  it("does NOT guess when deprecated with no hint", () => {
    const t = selectMigrationTarget({ ...base, deprecated: true, malicious: false, hint: null, hintCheck: null });
    expect(t).toMatchObject({ package: null, source: "none", confidence: "low" });
    expect(t?.rationale).toMatch(/do not guess/i);
  });

  it("recommends an advisory fix when not deprecated but vulnerable", () => {
    const t = selectMigrationTarget({
      deprecated: false,
      malicious: false,
      hint: null,
      hintCheck: null,
      resolvedVersion: "4.17.20",
      advisories: [
        { id: "GHSA-x", source: "GHSA", severity: "high", summary: "x", fixed_in: ["4.17.21"], malicious: false },
      ],
    });
    expect(t).toMatchObject({ package: null, version: ">=4.17.21", source: "advisory-fixed-in", confidence: "high" });
  });

  it("returns null for a healthy, merely-behind package (no upgrade pushed)", () => {
    const t = selectMigrationTarget({ ...base, deprecated: false, malicious: false, hint: null, hintCheck: null });
    expect(t).toBeNull();
  });

  it("treats a runtime-API hint as a code change, not a package swap", () => {
    const t = selectMigrationTarget({
      ...base,
      deprecated: true,
      malicious: false,
      hint: { name: "String.prototype.padStart", kind: "native" },
      hintCheck: null,
    });
    expect(t).toMatchObject({ package: null, source: "npm-deprecation-hint", confidence: "medium" });
  });
});

describe("computeConfidence", () => {
  it("is low when sources disagree", () => {
    expect(computeConfidence({ depsdevOk: true, agree: false, versionResolved: true })).toBe("low");
  });
  it("is medium when deps.dev is unavailable", () => {
    expect(computeConfidence({ depsdevOk: false, agree: true, versionResolved: true })).toBe("medium");
  });
  it("is high when sources agree and version resolved", () => {
    expect(computeConfidence({ depsdevOk: true, agree: true, versionResolved: true })).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Orchestrator with fully-mocked sources (deterministic, offline)
// ---------------------------------------------------------------------------

function mockDeps(over: Partial<VerdictDeps> = {}): VerdictDeps {
  return {
    fetchNpm: async () => ({ found: false, packument: null }),
    fetchDepsDev: async () => ({ ok: false, isDeprecated: null, deprecatedReason: null, isDefault: null, advisoryKeys: [] }),
    fetchOsv: async () => ({ ok: false, vulns: [] }),
    fetchGithub: async () => ({ ok: false, archived: null, pushedAt: null, staleMonths: null, reason: "mock" }),
    now: () => new Date("2026-06-05T00:00:00.000Z"),
    ...over,
  };
}

describe("getVerdict (orchestration, mocked)", () => {
  it("returns a slopsquatting verdict for a non-existent package", async () => {
    const v = await getVerdict("totally-fake-pkg", null, mockDeps());
    expect(v.exists).toBe(false);
    expect(v.warnings.join(" ")).toMatch(/slopsquatting/i);
    expect(v.last_verified).toBe("2026-06-05T00:00:00.000Z");
  });

  it("infers + cross-validates a successor end-to-end", async () => {
    const deps = mockDeps({
      fetchNpm: async (name: string) => {
        if (name === "node-uuid")
          return {
            found: true,
            packument: {
              name: "node-uuid",
              distTags: { latest: "1.4.8" },
              versions: ["1.4.8"],
              deprecatedByVersion: { "1.4.8": "Use uuid module instead" },
              time: {},
              repositoryUrl: null,
              securityHold: false,
              description: null,
            },
          };
        if (name === "uuid")
          return {
            found: true,
            packument: {
              name: "uuid",
              distTags: { latest: "14.0.0" },
              versions: ["14.0.0"],
              deprecatedByVersion: { "14.0.0": undefined },
              time: {},
              repositoryUrl: null,
              securityHold: false,
              description: null,
            },
          };
        return { found: false, packument: null };
      },
      fetchDepsDev: async () => ({ ok: true, isDeprecated: true, deprecatedReason: null, isDefault: true, advisoryKeys: [] }),
    });
    const v = await getVerdict("node-uuid", null, deps);
    expect(v.deprecated).toBe(true);
    expect(v.safe_migration_target).toMatchObject({ package: "uuid", version: "14.0.0", confidence: "high" });
    expect(v.confidence).toBe("high");
  });
});
