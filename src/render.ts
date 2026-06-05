import { type Verdict, type AuditSummary } from "./types.js";

/** A compact, human-readable mirror of the structured verdict (for the text block). */
export function renderVerdict(v: Verdict): string {
  if (!v.exists) {
    const lines = [`${v.package} — ❓ NOT FOUND in npm registry`];
    if (v.malicious) lines.push("  • ⚠ OSV has a malicious-package record under this name");
    for (const w of v.warnings) lines.push(`  ⚠ ${w}`);
    lines.push(`  verified ${v.last_verified}`);
    return lines.join("\n");
  }

  let status: string;
  if (v.malicious) status = "☠️ MALICIOUS";
  else if (v.deprecated) status = "⛔ DEPRECATED";
  else if (v.yanked) status = "⛔ SECURITY-HELD";
  else if (v.advisories.length) status = "⚠️ VULNERABLE";
  else if (v.superseded_by && v.superseded_by.majors_behind > 0) status = "🟡 BEHIND";
  else status = "✅ FIT";

  const ver = v.resolved_version ?? "?";
  const lines = [`${v.package}@${ver} — ${status} (${v.confidence} confidence)`];

  if (v.deprecated && v.deprecated_reason) lines.push(`  • deprecated: "${v.deprecated_reason}"`);
  if (v.superseded_by) {
    const s = v.superseded_by;
    if (!s.queried_is_latest) {
      lines.push(`  • latest is ${s.latest}${s.majors_behind > 0 ? ` (${s.majors_behind} major(s) ahead — breaking)` : " (same major line)"}`);
    } else {
      lines.push(`  • this is the latest version`);
    }
  }
  for (const a of v.advisories) {
    lines.push(`  • advisory ${a.id}${a.severity ? ` [${a.severity}]` : ""}: ${a.summary}${a.fixed_in.length ? ` (fixed in ${a.fixed_in.join(", ")})` : " (no fix published)"}`);
  }
  if (v.safe_migration_target) {
    const m = v.safe_migration_target;
    const tgt = m.package ? `${m.package}${m.version ? `@${m.version}` : ""}` : m.version ? m.version : "(see rationale)";
    lines.push(`  → migration: ${tgt} [${m.confidence}] — ${m.rationale}`);
  }
  if (!v.agreement.deprecation_sources_agree) {
    lines.push(`  • ⚠ sources disagree: ${v.agreement.notes.join(" ")}`);
  }
  for (const w of v.warnings) lines.push(`  ⚠ ${w}`);
  lines.push(`  sources: ${v.sources_consulted.join(", ")} · verified ${v.last_verified}`);
  return lines.join("\n");
}

export function renderSummary(summary: AuditSummary): string {
  return [
    `Audited ${summary.total} package(s):`,
    `  ✅ clean: ${summary.clean}`,
    `  ⛔ deprecated: ${summary.deprecated}`,
    `  ☠️ malicious: ${summary.malicious}`,
    `  ⚠️ vulnerable: ${summary.vulnerable}`,
    `  🟡 behind (major): ${summary.superseded}`,
    `  ❓ not found: ${summary.not_found}`,
    `  → needs migration: ${summary.needs_migration}`,
  ].join("\n");
}
