/**
 * Live smoke test — hits the real npm registry, deps.dev, OSV, and GitHub.
 * Exercises the representative cases that define the moat:
 *  - deprecated with a verifiable npm successor (node-uuid -> uuid)
 *  - deprecated, successor named is the REASON not a target (request-promise; must NOT suggest 'request')
 *  - deprecated, no clean successor (request, gulp-util)
 *  - deprecated -> native API (left-pad -> String.prototype.padStart)
 *  - healthy but behind, and healthy-latest (react)
 *  - non-existent / hallucinated name (slopsquatting)
 *  - a batch audit
 */
import { getVerdict } from "../src/verdict.js";
import { renderVerdict, renderSummary } from "../src/render.js";
import { auditPackages, parseSpec, type PackageSpec } from "../src/audit.js";

const cases: Array<[string, string | null]> = [
  ["request", null],
  ["node-uuid", null],
  ["gulp-util", null],
  ["request-promise", null],
  ["left-pad", null],
  ["react", "18.2.0"],
  ["react", null],
  ["express", null],
  ["this-package-surely-does-not-exist-9z9z9", null],
];

for (const [name, ver] of cases) {
  try {
    const v = await getVerdict(name, ver);
    console.log(renderVerdict(v));
  } catch (e) {
    console.log(`${name}: ERROR ${(e as Error).message}`);
  }
  console.log("─".repeat(72));
}

console.log("\n=== BATCH AUDIT ===");
const specs = ["react@18.2.0", "request", "lodash", "node-uuid", "left-pad"]
  .map(parseSpec)
  .filter((x): x is PackageSpec => x !== null);
const audit = await auditPackages(specs);
console.log(renderSummary(audit.summary));
